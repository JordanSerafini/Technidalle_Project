import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

const prismaMock = {
  clients: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  addresses: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  client_addresses: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createClient forwards data to prisma and returns result', async () => {
    const dto = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
    };
    const created = { id: 1, ...dto };
    prismaMock.clients.create.mockResolvedValue(created);

    const result = await service.createClient(dto);

    expect(prismaMock.clients.create).toHaveBeenCalledWith({
      data: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'john@example.com',
        company_name: undefined,
        phone: undefined,
        mobile: undefined,
        address_id: undefined,
        siret: undefined,
        notes: undefined,
      },
      include: { addresses: true },
    });
    expect(result).toEqual(created);
  });
});
