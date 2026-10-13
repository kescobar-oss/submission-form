import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

// "extends PrismaClient" means this service IS a Prisma Client, so other parts of the
// app can call this.prisma.featureRequest.create(...) on it directly.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Prisma 7 talks to Postgres through a driver adapter (the "pg" library),
    // the same setup as prisma/seed.ts.
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  // Nest calls this once at startup. Connecting here makes a wrong DATABASE_URL
  // fail immediately, instead of on the first visitor's request.
  async onModuleInit() {
    await this.$connect();
  }

  // Nest calls this on shutdown, so the database isn't left holding open connections.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
