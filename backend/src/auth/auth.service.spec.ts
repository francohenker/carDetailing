import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from '../users/entities/users.entity';
import { Repository } from 'typeorm';
import { UnauthorizedException, HttpException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userRepository: Repository<Users>;

  const mockUser: Users = {
    id: 1,
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    password: 'hashedPassword',
    phone: '1234567890',
    role: 'user' as any,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    cars: [],
    turnos: [],
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(Users),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<Repository<Users>>(getRepositoryToken(Users));

    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('debe generar un token de acceso correctamente', async () => {
      const mockToken = 'mock.jwt.token';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.generateAccessToken(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          name: mockUser.email,
          userId: mockUser.id,
          role: mockUser.role,
        },
        { secret: 'test-secret' },
      );

      expect(result).toEqual({
        access_token: mockToken,
        name: mockUser.email,
        role: mockUser.role,
      });
    });
  });

  describe('validateToken', () => {
    it('debe validar y decodificar un token válido con Bearer', async () => {
      const token = 'Bearer valid.jwt.token';
      const decodedPayload = {
        userId: 1,
        name: 'test@example.com',
        role: 'user',
      };

      mockJwtService.verify.mockReturnValue(decodedPayload);

      const result = await service.validateToken(token);

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
      expect(result).toEqual(decodedPayload);
    });

    it('debe lanzar UnauthorizedException si el token es inválido', async () => {
      const token = 'Bearer invalid.token';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe lanzar UnauthorizedException si no hay token Bearer', async () => {
      const token = 'invalid-format';
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findUserByToken', () => {
    it('debe encontrar un usuario por token', async () => {
      const token = 'Bearer valid.jwt.token';
      const decodedPayload = {
        userId: 1,
        name: 'test@example.com',
        role: 'user',
      };

      mockJwtService.verify.mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findUserByToken(token);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('debe lanzar HttpException si el token es inválido', async () => {
      const token = 'Bearer invalid.token';
      mockJwtService.verify.mockReturnValue(null);

      await expect(service.findUserByToken(token)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('validateGoogleLogin', () => {
    it('debe retornar usuario existente si ya está registrado', async () => {
      const profile = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateGoogleLogin(profile);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: profile.email },
      });
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('debe crear un nuevo usuario si no existe', async () => {
      const profile = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      };

      const newUser = {
        email: profile.email,
        firstname: profile.firstName,
        lastname: profile.lastName,
        password: null,
        phone: null,
        role: 'user' as any,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue({ ...newUser, id: 2 });

      const result = await service.validateGoogleLogin(profile);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: profile.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: profile.email,
        firstname: profile.firstName,
        lastname: profile.lastName,
        password: null,
        phone: null,
        role: 'user',
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 2);
    });
  });

  describe('googleLogin', () => {
    it('debe retornar mensaje de redirección', async () => {
      const result = await service.googleLogin();

      expect(result).toEqual({ message: 'Redirecting to Google OAuth' });
    });
  });

  describe('googleLoginCallback', () => {
    beforeEach(() => {
      process.env.URL_FRONTEND = 'http://localhost:3000';
    });

    it('debe procesar callback exitoso de Google OAuth', async () => {
      const req = {
        user: mockUser,
      };

      const mockToken = 'mock.jwt.token';
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.googleLoginCallback(req);

      expect(result).toHaveProperty('url');
      expect(result.url).toContain('http://localhost:3000/auth/callback');
      expect(result.url).toContain(`token=${mockToken}`);
      expect(result.url).toContain(`role=${mockUser.role}`);
    });

    it('debe manejar error cuando no hay usuario', async () => {
      const req = {
        user: null,
      };

      await expect(service.googleLoginCallback(req)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debe redirigir con error si falla la validación', async () => {
      const req = {
        user: mockUser,
      };

      mockUserRepository.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.googleLoginCallback(req);

      expect(result.url).toContain('http://localhost:3000/login');
      expect(result.url).toContain('error=oauth_failed');
    });
  });
});
