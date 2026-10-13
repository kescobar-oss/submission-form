// Must stay the first import: it copies apps/api/.env into process.env before any
// other file reads DATABASE_URL, ADMIN_KEY, etc. On Railway there is no .env file;
// the variables are set in the dashboard instead, and this line simply finds nothing to load.
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Checks every incoming body against its DTO's rules before any controller runs.
  // Invalid input is turned away with 400 and a list of readable messages.
  // whitelist: true silently drops fields the DTO doesn't declare (e.g. "isAdmin"),
  // so a client can never sneak extra columns into the database.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // CORS: tells browsers which website may call this API. Only the web app's address
  // (e.g. http://localhost:3000, later the Vercel URL) gets permission; pages on any other
  // site are blocked by the visitor's own browser. If CORS_ORIGIN is unset we allow no
  // site at all (false), rather than falling back to "everyone".
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? false,
    methods: ['GET', 'POST'],
    // x-admin-key must be listed, or the browser refuses to send it from /submissions.
    allowedHeaders: ['Content-Type', 'x-admin-key'],
  });
  // Without this, Nest would never run onModuleDestroy on Ctrl+C or a Railway restart,
  // and the database connection would be dropped abruptly instead of closed.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
