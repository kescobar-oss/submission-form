// Must stay the first import: it copies apps/api/.env into process.env before any
// other file reads DATABASE_URL, ADMIN_KEY, etc. On Railway there is no .env file;
// the variables are set in the dashboard instead, and this line simply finds nothing to load.
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Without this, Nest would never run onModuleDestroy on Ctrl+C or a Railway restart,
  // and the database connection would be dropped abruptly instead of closed.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
