import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

// End-to-end: the whole app runs (routing, AdminKeyGuard, ValidationPipe, controller,
// service), and real HTTP requests are sent to it. Only the database is faked, so the
// test needs no Railway connection and leaves no rows behind.
describe('Feature requests API (e2e)', () => {
  let app: INestApplication<App>;
  const ADMIN_KEY = 'test-admin-key';
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

  const validBody = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    category: 'BUG',
    priority: 'HIGH',
    description: 'The submit button does nothing on mobile Safari.',
    consent: true,
  };

  beforeAll(async () => {
    // The guard reads ADMIN_KEY from the environment, so the test sets its own value.
    process.env.ADMIN_KEY = ADMIN_KEY;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /requests with a valid body returns 201 and only { id, createdAt }', async () => {
    const response = await request(app.getHttpServer())
      .post('/requests')
      .send(validBody)
      .expect(201);

    // Exactly these two keys: no name, email or anything else personal.
    expect(Object.keys(response.body).sort()).toEqual(['createdAt', 'id']);
    expect(response.body.id).toBe(savedRow.id);
  });

  it('POST /requests with an invalid body returns 400 with readable messages', async () => {
    const response = await request(app.getHttpServer())
      .post('/requests')
      .send({ ...validBody, name: 'A', consent: false })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'name must be longer than or equal to 2 characters',
        'consent must be true',
      ]),
    );
  });

  it('GET /requests without the admin key returns 401', () => {
    return request(app.getHttpServer()).get('/requests').expect(401);
  });

  it('GET /requests with a wrong admin key returns 401', () => {
    return request(app.getHttpServer())
      .get('/requests')
      .set('x-admin-key', 'not-the-key')
      .expect(401);
  });

  it('GET /requests with the admin key returns 200', () => {
    return request(app.getHttpServer())
      .get('/requests')
      .set('x-admin-key', ADMIN_KEY)
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
