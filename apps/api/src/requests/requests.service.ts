import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';

// The service holds the database work. It knows nothing about HTTP (headers, status codes);
// that is the controller's job. Keeping them apart means the same queries could be reused
// from a script or a scheduled job, and can be unit-tested without a web server.
@Injectable()
export class RequestsService {
  // Dependency injection: we don't write "new PrismaService()". Nest sees this parameter's
  // type, finds the one PrismaService it already created, and passes it in. In tests we can
  // pass a fake instead, so no real database is needed.
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRequestDto) {
    return this.prisma.featureRequest.create({
      data,
      // Ask the database to send back only these two columns. The name and email are saved,
      // but never travel back to the browser, so they can't leak through the response.
      select: { id: true, createdAt: true },
    });
  }

  findAll() {
    return this.prisma.featureRequest.findMany({
      // Newest first, as the admin page needs. The @@index([createdAt]) in the schema
      // keeps this sort fast as the table grows.
      orderBy: { createdAt: 'desc' },
    });
  }
}
