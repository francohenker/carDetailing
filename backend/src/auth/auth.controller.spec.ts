import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    googleLogin: jest.fn(),
    googleLoginCallback: jest.fn(),
  };

  const mockResponse = {
    redirect: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleLogin', () => {
    it('debe iniciar el proceso de login con Google', () => {
      const expectedResponse = { message: 'Redirecting to Google OAuth' };
      mockAuthService.googleLogin.mockReturnValue(expectedResponse);

      const result = controller.googleLogin();

      expect(service.googleLogin).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('googleLoginCallback', () => {
    it('debe manejar el callback exitoso de Google OAuth', async () => {
      const mockReq = {
        user: {
          id: 1,
          email: 'test@example.com',
          firstname: 'Test',
          lastname: 'User',
        },
      };

      const mockUrl = 'http://localhost:3000/auth/callback?token=mock.jwt.token';
      mockAuthService.googleLoginCallback.mockResolvedValue({ url: mockUrl });

      await controller.googleLoginCallback(mockReq, mockResponse);

      expect(service.googleLoginCallback).toHaveBeenCalledWith(mockReq);
      expect(mockResponse.redirect).toHaveBeenCalledWith(mockUrl);
    });

    it('debe redirigir con token y datos de usuario', async () => {
      const mockReq = {
        user: {
          id: 5,
          email: 'admin@example.com',
          role: 'admin',
        },
      };

      const mockUrl =
        'http://localhost:3000/auth/callback?token=admin.token&name=admin@example.com&role=admin';
      mockAuthService.googleLoginCallback.mockResolvedValue({ url: mockUrl });

      await controller.googleLoginCallback(mockReq, mockResponse);

      expect(service.googleLoginCallback).toHaveBeenCalledWith(mockReq);
      expect(mockResponse.redirect).toHaveBeenCalledWith(mockUrl);
    });

    it('debe manejar errores en el callback', async () => {
      const mockReq = {
        user: null,
      };

      const errorUrl = 'http://localhost:3000/login?error=oauth_failed';
      mockAuthService.googleLoginCallback.mockResolvedValue({
        url: errorUrl,
      });

      await controller.googleLoginCallback(mockReq, mockResponse);

      expect(service.googleLoginCallback).toHaveBeenCalledWith(mockReq);
      expect(mockResponse.redirect).toHaveBeenCalledWith(errorUrl);
    });
  });
});
