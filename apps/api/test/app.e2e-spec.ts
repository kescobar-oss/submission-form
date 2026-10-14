import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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

  const savedRow = {
    id: 'cm-test-id',
    createdAt: new Date('2026-10-13T08:00:00Z'),
  };
  const fakePrisma = {
    featureRequest: {
      // Pretend the database saved the row and returned only what `select` asked for.
      create: vi.fn().mockResolvedValue(savedRow),
      findMany: vi.fn().mockResolvedValue([]),
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

  it('GET /health returns 200 { status: "ok" }', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });
});
