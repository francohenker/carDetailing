import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { describe } from 'node:test';
import { UserService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { AuthService } from '../auth/auth.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { HttpException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UserService;

  // Mock del UsersService
  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEmail: jest.fn(),
  };

  // Mock del JwtService
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    verifyAsync: jest.fn(),
  };

  // Mock del AuthService
  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    findUserByToken: jest.fn(),
  };

  // Mock del AuditoriaService
  const mockAuditoriaService = {
    registrarAccion: jest.fn(),
    findAll: jest.fn(),
    getEstadisticas: jest.fn(),
  };

  // Mock del Repository
  const mockUsersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UserService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(Users),
          useValue: mockUsersRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: AuditoriaService,
          useValue: mockAuditoriaService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should not create a user and return status code 400', async () => {
      const createUserDto = {
        firstname: 'testuser',
        lastname: 'testlastname',
        password: 'testpass',
        email: 'testuser@example.com',
      };
      const createUserDto2 = {
        firstname: 'testuser',
        lastname: 'testlastname',
        password: 'testpass',
        email: 'testuser@example.com',
      };
      await controller.create(createUserDto);
      const a = new HttpException('Email already in use', 400);
      await expect(controller.create(createUserDto2)).rejects.toThrow(a);
    });
  });
});
