import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestsService } from './requests.service.js';

// Unit tests check RequestsService on its own. Thanks to dependency injection we can hand it
// a fake PrismaService: plain functions that record how they were called. No database,
// no network, so these run in milliseconds and never write test rows to Railway.
describe('RequestsService', () => {
  let service: RequestsService;
  const fakePrisma = {
    featureRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RequestsService,
        // "Whenever someone asks for PrismaService, give them fakePrisma instead."
        { provide: PrismaService, useValue: fakePrisma },
      ],
    }).compile();
    service = moduleRef.get(RequestsService);
  });

  describe('create', () => {
    const input = {
      category: 'BUG' as const,
      priority: 'HIGH' as const,
      description: 'The submit button does nothing.',
      consent: true as const,
    };
    const author = { id: 'user-1', name: 'Ada Lovelace', email: 'ada@example.com' };

    // Name and email come from the logged-in account, and userId links the request to it.
    it('saves the submitted fields plus the author from the account', async () => {
      await service.create(input, author);
      expect(fakePrisma.featureRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ...input, name: 'Ada Lovelace', email: 'ada@example.com', userId: 'user-1' },
        }),
      );
    });

    // The privacy rule: the database is asked for id and createdAt only,
    // so name and email can never end up in the response.
    it('asks the database for only id and createdAt', async () => {
      await service.create(input, author);
      expect(fakePrisma.featureRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ select: { id: true, createdAt: true } }),
      );
    });

    it('returns what the database returned', async () => {
      const saved = { id: 'abc123', createdAt: new Date('2026-10-13T08:00:00Z') };
      fakePrisma.featureRequest.create.mockResolvedValue(saved);
      await expect(service.create(input, author)).resolves.toEqual(saved);
    });
  });

  describe('findMine', () => {
    // The whole point of "My requests": the query is limited to the caller's userId.
    it("only asks for the caller's own requests, newest first", async () => {
      await service.findMine('user-1');
      expect(fakePrisma.featureRequest.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findAll', () => {
    it('sorts newest first', async () => {
      await service.findAll();
      expect(fakePrisma.featureRequest.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns the rows from the database', async () => {
      const rows = [{ id: 'b' }, { id: 'a' }];
      fakePrisma.featureRequest.findMany.mockResolvedValue(rows);
      await expect(service.findAll()).resolves.toEqual(rows);
    });
  });
});
