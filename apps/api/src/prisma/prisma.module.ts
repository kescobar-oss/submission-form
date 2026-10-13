import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// @Global means any module can ask for PrismaService without importing PrismaModule
// itself. There is only one database, so everyone shares this single connection.
@Global()
@Module({
  providers: [PrismaService],
  // "exports" is what this box lets other boxes use. Without it, PrismaService stays private.
  exports: [PrismaService],
})
export class PrismaModule {}
