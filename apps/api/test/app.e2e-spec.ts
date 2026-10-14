import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Prisma } from './../generated/prisma/client.js';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import type { TokenPayload } from './../src/auth/auth.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// End-to-end: the whole app runs (routing, JwtAuthGuard, RolesGuard, ValidationPipe,
// controller, service), and real HTTP requests are sent to it. Only the database is faked,
// so the test needs no Railway connection and leaves no rows behind.
describe('Feature requests API (e2e)', () => {
  let app: INestApplication<App>;
  // Tokens for two test people, signed in beforeAll with the app's own JwtService.
  let userToken: string;
  let adminToken: string;
  let developerToken: string;

  const savedRow = {
    id: 'cm-test-id',
    createdAt: new Date('2026-10-13T08:00:00Z'),
  };
  // One stored account for the login tests. Its hash is filled in by beforeAll, using a
  // low bcrypt cost (4) so the tests stay fast; the real app uses 12.
  const PASSWORD = 'correct-password';
  const storedUser = {
    id: 'user-1',
    email: 'ada@example.com',
    name: 'Ada Lovelace',
    role: 'USER',
    passwordHash: '',
  };

  const fakePrisma = {
    featureRequest: {
      // Pretend the database saved the row and returned only what `select` asked for.
      create: vi.fn().mockResolvedValue(savedRow),
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      // Finds storedUser by email, and nobody else, like a table with one row.
      findUnique: vi.fn(({ where }: { where: { email: string } }) =>
        Promise.resolve(where.email === storedUser.email ? storedUser : null),
      ),
      // Pretend to save a new account. The real database fills in role USER by default;
      // the fake does the same, so the response looks like the real one.
      create: vi.fn(({ data }: { data: Record<string, string> }) =>
        Promise.resolve({ id: 'new-1', role: 'USER', ...data }),
      ),
    },
  };

  // No name or email: those now come from the login token.
  const validBody = {
    category: 'BUG',
    priority: 'HIGH',
    description: 'The submit button does nothing on mobile Safari.',
    consent: true,
  };

  const testUser: TokenPayload = { sub: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace', role: 'USER' };
  const testAdmin: TokenPayload = { sub: 'admin-1', email: 'boss@example.com', name: 'The Admin', role: 'ADMIN' };
  const testDeveloper: TokenPayload = { sub: 'dev-1', email: 'dev@example.com', name: 'The Developer', role: 'DEVELOPER' };

  beforeAll(async () => {
    // AuthModule refuses to start without a signing key. A fixed fake one is fine in tests.
    process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-chars';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Same swap as in the unit test, but inside the full app.
      .overrideProvider(PrismaService)
      .useValue(fakePrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app); // the exact validation + CORS setup main.ts uses
    await app.init();

    // Sign tokens exactly the way login does, without needing real accounts.
    const jwt = app.get(JwtService);
    userToken = await jwt.signAsync(testUser);
    adminToken = await jwt.signAsync(testAdmin);
    developerToken = await jwt.signAsync(testDeveloper);

    storedUser.passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  // Forget which fake functions were called by earlier tests, so each test only sees its
  // own calls. The fakes keep their pretend behaviour.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /requests with a valid body returns 201 and only { id, createdAt }', async () => {
    const response = await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validBody)
      .expect(201);

    // Exactly these two keys: no name, email or anything else personal.
    expect(Object.keys(response.body).sort()).toEqual(['createdAt', 'id']);
    expect(response.body.id).toBe(savedRow.id);
  });

  it('POST /requests with an invalid body returns 400 with readable messages', async () => {
    const response = await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validBody, description: 'short', consent: false })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'description must be longer than or equal to 10 characters',
        'consent must be true',
      ]),
    );
  });

  it('GET /requests without a token returns 401', () => {
    return request(app.getHttpServer()).get('/requests').expect(401);
  });

  it('GET /requests with a made-up token returns 401', () => {
    return request(app.getHttpServer())
      .get('/requests')
      .set('Authorization', 'Bearer not.a.real-token')
      .expect(401);
  });

  it('GET /requests as an admin returns 200', () => {
    return request(app.getHttpServer())
      .get('/requests')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect([]);
  });

  it('GET /requests as a user returns 403', () => {
    return request(app.getHttpServer())
      .get('/requests')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('GET /requests as a developer returns 200', () => {
    return request(app.getHttpServer())
      .get('/requests')
      .set('Authorization', `Bearer ${developerToken}`)
      .expect(200);
  });

  it('GET /requests with an expired token returns 401', async () => {
    // Same secret, but signed with an "exp" one minute in the past.
    const oldToken = await new JwtService({ secret: process.env.JWT_SECRET }).signAsync({
      ...testAdmin,
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    return request(app.getHttpServer())
      .get('/requests')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(401);
  });

  it('POST /requests without a token returns 401', () => {
    return request(app.getHttpServer()).post('/requests').send(validBody).expect(401);
  });

  // The body pretends to be someone else; the saved name, email and userId must still be
  // the ones from the token.
  it('POST /requests takes the author from the token, not the body', async () => {
    await request(app.getHttpServer())
      .post('/requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validBody, name: 'Someone Else', email: 'ceo@example.com', userId: 'admin-1' })
      .expect(201);

    expect(fakePrisma.featureRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Ada Lovelace', email: 'ada@example.com', userId: 'user-1' }),
      }),
    );
  });

  it("GET /requests/mine only asks for the caller's own requests", async () => {
    await request(app.getHttpServer())
      .get('/requests/mine')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(fakePrisma.featureRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } }),
    );
  });

  describe('login', () => {
    it('with the right password returns 200, a token and the account', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'Ada@Example.com', password: PASSWORD }) // email case doesn't matter
        .expect(200);

      expect(typeof response.body.token).toBe('string');
      expect(response.body.user).toEqual({ id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace', role: 'USER' });
      // Never send the hash back, not even to its owner.
      expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    });

    it('with a wrong password returns 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ada@example.com', password: 'wrong-password' })
        .expect(401)
        .expect((res) => expect(res.body.message).toBe('Invalid email or password'));
    });

    // Same status and same words as a wrong password, so nobody can find out which
    // emails have accounts.
    it('with an unknown email returns the identical 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: PASSWORD })
        .expect(401)
        .expect((res) => expect(res.body.message).toBe('Invalid email or password'));
    });

    it('returns a token that GET /auth/me accepts', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ada@example.com', password: PASSWORD })
        .expect(200);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${body.token}`)
        .expect(200)
        .expect({ id: 'user-1', email: 'ada@example.com', name: 'Ada Lovelace', role: 'USER' });
    });
  });

  describe('register', () => {
    // Signing up must never let someone pick their own role.
    it('ignores a role in the body, so new accounts are always USER', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'New Person', email: 'new@example.com', password: 'a-good-password', role: 'ADMIN' })
        .expect(201);

      expect(response.body.user.role).toBe('USER');
      const saved = fakePrisma.user.create.mock.calls[0][0].data;
      expect(saved).not.toHaveProperty('role');
      // The password is stored only as a bcrypt hash.
      expect(saved.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      expect(saved).not.toHaveProperty('password');
    });

    it('with an email that is already taken returns 409', async () => {
      // Make the fake database answer like Postgres does for a duplicate @unique value.
      fakePrisma.user.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Ada Again', email: 'ada@example.com', password: 'a-good-password' })
        .expect(409);
    });

    it('with a short password returns 400', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Short', email: 'short@example.com', password: 'short' })
        .expect(400);
    });
  });

  it('GET /health returns 200 { status: "ok" }', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
