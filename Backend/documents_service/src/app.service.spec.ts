import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { DocumentType } from './interfaces/document.interface';

const mockPrisma = {
  documents: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDocuments', () => {
    it('should return documents filtered by projectId', async () => {
      mockPrisma.documents.findMany.mockResolvedValue([{ id: 1 }]);
      const result = await service.getAllDocuments(undefined, undefined, undefined, undefined, 1);

      expect(mockPrisma.documents.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { project_id: 1 },
        }),
      );
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should throw when prisma fails', async () => {
      mockPrisma.documents.findMany.mockRejectedValue(new Error('fail'));
      await expect(service.getAllDocuments()).rejects.toThrow('fail');
    });
  });

  describe('createDocument', () => {
    it('should create a document', async () => {
      const dto = {
        project_id: 1,
        type: DocumentType.DEVIS,
        reference: 'REF',
        issue_date: new Date(),
      };
      const created = { id: 1, ...dto };
      mockPrisma.documents.create.mockResolvedValue(created);
      const result = await service.createDocument(dto as any);

      expect(mockPrisma.documents.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ...dto, created_at: expect.any(Date) }),
      });
      expect(result).toEqual(created);
    });

    it('should throw when prisma fails', async () => {
      const dto = {
        project_id: 1,
        type: DocumentType.DEVIS,
        reference: 'REF',
        issue_date: new Date(),
      };
      mockPrisma.documents.create.mockRejectedValue(new Error('fail'));
      await expect(service.createDocument(dto as any)).rejects.toThrow('fail');
    });
  });

  describe('deleteDocument', () => {
    it('should return true when deletion succeeds', async () => {
      mockPrisma.documents.delete.mockResolvedValue({});
      const result = await service.deleteDocument(1);

      expect(mockPrisma.documents.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(true);
    });

    it('should return false when prisma throws', async () => {
      mockPrisma.documents.delete.mockRejectedValue(new Error('fail'));
      const result = await service.deleteDocument(1);
      expect(result).toBe(false);
    });
  });
});
