import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

// Everything about feature requests lives in this one box. PrismaService isn't listed:
// PrismaModule is @Global, so Nest already knows how to supply it.
@Module({
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
