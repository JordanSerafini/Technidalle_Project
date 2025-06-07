import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

const prismaMock = {
  users: {
    findUnique: jest.fn(),
  },
};

const jwtMock = {
  signAsync: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      const user = { id: 1, email: 'foo@example.com', password: 'hash' };
      prismaMock.users.findUnique.mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as any);

      const result = await service.validateUser('foo@example.com', 'pass');

      expect(prismaMock.users.findUnique).toHaveBeenCalledWith({ where: { email: 'foo@example.com' } });
      expect(result).toEqual(user);
    });

    it('returns null when user not found', async () => {
      prismaMock.users.findUnique.mockResolvedValueOnce(null);

      const result = await service.validateUser('bar@example.com', 'pass');

      expect(result).toBeNull();
    });

    it('returns null when password mismatch', async () => {
      const user = { id: 1, email: 'foo@example.com', password: 'hash' };
      prismaMock.users.findUnique.mockResolvedValueOnce(user);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as any);

      const result = await service.validateUser('foo@example.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns access token for valid credentials', async () => {
      const user = { id: 1, email: 'foo@example.com', password: 'hash' };
      jest.spyOn(service, 'validateUser').mockResolvedValueOnce(user as any);
      jwtMock.signAsync.mockResolvedValueOnce('signed');

      const result = await service.login('foo@example.com', 'pass');

      expect(service.validateUser).toHaveBeenCalledWith('foo@example.com', 'pass');
      expect(jwtMock.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email });
      expect(result).toEqual({ access_token: 'signed' });
    });

    it('throws UnauthorizedException when credentials invalid', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValueOnce(null);
      await expect(service.login('foo@example.com', 'pass')).rejects.toThrow('Invalid credentials');
    });
  });
});
