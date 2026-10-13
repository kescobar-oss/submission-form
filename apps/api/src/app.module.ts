import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RequestsModule } from './requests/requests.module.js';

@Module({
  // Listing PrismaModule here is what makes Nest create the one shared database connection.
  // A module that isn't listed here doesn't exist as far as the app is concerned.
  imports: [PrismaModule, RequestsModule],
  // AppController only serves GET /health.
  controllers: [AppController],
})
export class AppModule {}
