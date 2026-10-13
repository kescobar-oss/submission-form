import { INestApplication, ValidationPipe } from '@nestjs/common';

// App-wide settings, kept in one function so main.ts and the e2e test apply exactly
// the same setup. If they were written out twice, the test could pass while the real
// app was configured differently.
export function configureApp(app: INestApplication) {
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
}
