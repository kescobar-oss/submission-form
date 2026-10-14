import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import type { Status } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRequestDto } from './dto/create-request.dto.js';

// Who is submitting: taken from the login token by the controller, never from the body.
export type Author = { id: string; name: string; email: string };

// The service holds the database work. It knows nothing about HTTP (headers, status codes);
// that is the controller's job. Keeping them apart means the same queries could be reused
// from a script or a scheduled job, and can be unit-tested without a web server.
@Injectable()
export class RequestsService {
  // Dependency injection: we don't write "new PrismaService()". Nest sees this parameter's
  // type, finds the one PrismaService it already created, and passes it in. In tests we can
  // pass a fake instead, so no real database is needed.
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRequestDto, author: Author) {
    return this.prisma.featureRequest.create({
      // name and email are still stored on the request (the admin table shows them), but
      // copied from the account; userId links the request to that account for "My requests".
      data: { ...data, name: author.name, email: author.email, userId: author.id },
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

  async updateStatus(id: string, status: Status) {
    try {
      return await this.prisma.featureRequest.update({
        where: { id },
        data: { status },
        // Send back only what changed, not the submitter's personal data.
        select: { id: true, status: true },
      });
    } catch (error) {
      // P2025 is Prisma's code for "no row matched the where": the ticket doesn't exist.
      // Turn it into a 404 instead of letting it surface as a 500.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Ticket not found');
      }
      throw error;
    }
  }

  // Only the caller's own requests. The userId comes from their token, so nobody can ask
  // for someone else's list. The @@index([userId]) in the schema keeps this lookup fast.
  findMine(userId: string) {
    return this.prisma.featureRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
