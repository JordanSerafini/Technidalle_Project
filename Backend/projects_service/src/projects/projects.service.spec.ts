import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const prisma = {
    projects: { create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create project with generated reference when none provided', async () => {
    prisma.$transaction.mockImplementation(async (cb: any) => cb(prisma));
    prisma.projects.create.mockResolvedValue({ id: 1 });
    prisma.projects.update.mockResolvedValue({ id: 1, reference: 'PRJ - 1' });

    const result = await service.createProject({ name: 'Test', clientId: 2 });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.reference).toBe('PRJ - 1');
  });
});
