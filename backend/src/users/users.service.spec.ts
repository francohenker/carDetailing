import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Role } from '../roles/role.enum';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UserService;
  let repository: Repository<Users>;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstname: 'Test',
    lastname: 'User',
    password: 'hashedPassword',
    phone: '1234567890',
    role: Role.USER,
  };

  const mockUserRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuthService = {
    generateAccessToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(Users),
          useValue: mockUserRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<Users>>(getRepositoryToken(Users));
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un usuario correctamente', async () => {
      const createUserDto = {
        firstname: 'john',
        lastname: 'doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
      };

      mockUserRepository.findOneBy.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('debe lanzar HttpException si el email ya está en uso', async () => {
      const createUserDto = {
        firstname: 'john',
        lastname: 'doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '1234567890',
      };

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Email already in use',
      );
    });

    it('debe lanzar HttpException si password es null', async () => {
      const createUserDto = {
        firstname: 'john',
        lastname: 'doe',
        email: 'john@example.com',
        password: null,
        phone: '1234567890',
      };

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Password is required',
      );
    });
  });

  describe('login', () => {
    it('debe hacer login correctamente con credenciales válidas', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const token = { access_token: 'token', name: email, role: Role.USER };

      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      mockAuthService.generateAccessToken.mockResolvedValue(token);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

      const result = await service.login(email, password);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(authService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(token);
    });

    it('debe lanzar HttpException si el usuario no existe', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow('User not found');
    });

    it('debe lanzar HttpException si la contraseña es incorrecta', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

      await expect(
        service.login('test@example.com', 'wrongpassword'),
      ).rejects.toThrow('User or password incorrect');
    });
  });

  describe('findOne', () => {
    it('debe encontrar un usuario por ID', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    it('debe obtener todos los usuarios', async () => {
      const users = [mockUser, { ...mockUser, id: 2 }];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.getAllUsers();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('changeRole', () => {
    it('debe cambiar el rol de un usuario', async () => {
      const updatedUser = { ...mockUser, role: Role.ADMIN };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await service.changeRole(1, Role.ADMIN);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(result.role).toBe(Role.ADMIN);
    });

    it('debe lanzar HttpException si el usuario no existe', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.changeRole(999, Role.ADMIN)).rejects.toThrow(
        'User not found',
      );
    });
  });
});
