import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = {
  projects: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  project_stages: {
    findMany: jest.fn(),
  },
  tags: { findMany: jest.fn() },
  project_tags: {
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('ProjectsService', () => {
  let service: ProjectsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAllProjects forwards params to prisma', async () => {
    prismaMock.projects.findMany.mockResolvedValue([{ id: 1 }]);

    const result = await service.getAllProjects(5, 0, 'foo');

    expect(prismaMock.projects.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 5,
        where: expect.any(Object),
      }),
    );
    expect(result).toEqual([{ id: 1 }]);
  });

  it('createProject sets reference when missing', async () => {
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(prismaMock));
    const created = { id: 10 };
    prismaMock.projects.create.mockResolvedValueOnce(created);
    const updated = { id: 10, reference: 'PRJ - 10' };
    prismaMock.projects.update.mockResolvedValueOnce(updated);

    const result = await service.createProject({ name: 'New', description: '', clientId: 1 });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.projects.create).toHaveBeenCalled();
    expect(prismaMock.projects.update).toHaveBeenCalledWith({
      where: { id: created.id },
      data: { reference: `PRJ - ${created.id}` },
    });
    expect(result).toEqual(updated);
  });

  it('updateProject delegates to prisma', async () => {
    prismaMock.projects.update.mockResolvedValue({ id: 1, name: 'Updated' });

    const result = await service.updateProject(1, { name: 'Updated' } as any);

    expect(prismaMock.projects.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'Updated' },
    });
    expect(result).toEqual({ id: 1, name: 'Updated' });
  });
});

