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
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      category: 'BUG' as const,
      priority: 'HIGH' as const,
      description: 'The submit button does nothing.',
      consent: true as const,
    };

    it('saves the submitted fields', async () => {
      await service.create(input);
      expect(fakePrisma.featureRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: input }),
      );
    });

    // The privacy rule: the database is asked for id and createdAt only,
    // so name and email can never end up in the response.
    it('asks the database for only id and createdAt', async () => {
      await service.create(input);
      expect(fakePrisma.featureRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({ select: { id: true, createdAt: true } }),
      );
    });

    it('returns what the database returned', async () => {
      const saved = { id: 'abc123', createdAt: new Date('2026-10-13T08:00:00Z') };
      fakePrisma.featureRequest.create.mockResolvedValue(saved);
      await expect(service.create(input)).resolves.toEqual(saved);
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
