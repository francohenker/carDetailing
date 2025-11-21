import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from '../users/entities/users.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';

// interface Token {
//   userId: number;
//   email: string;
//   role: string;
// }
@Injectable()
export class AuthService {
  constructor(
    // private userService: UserService,
    @InjectRepository(Users)
    private userRepository: Repository<Users>,
    private jwtService: JwtService,
  ) {}

  async generateAccessToken(
    user: Users,
  ): Promise<{ access_token: string; name: string; role: string }> {
    const payload = { name: user.email, userId: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
      }),
      name: user.email,
      role: user.role,
    };
  }

  // valida el token y lo devuelve decodificado
  async validateToken(token: string): Promise<any> {
    let payload = '';
    if (token && token.startsWith('Bearer ')) {
      payload = token.split(' ')[1]; // Extraer solo el token
    } else {
      payload = null;
    }
    try {
      const decoded = this.jwtService.verify(payload, {
        secret: process.env.JWT_SECRET,
      }); // Verifica firma y expiración
      if (!decoded) {
        throw new HttpException('Invalid token', 401);
      }
      payload = decoded;
    } catch {
      throw new UnauthorizedException('Token inválido o caducado');
    }
    return payload;
  }

  async findUserByToken(token: string): Promise<Users> {
    const decode = await this.validateToken(token);
    // const decode = await this.authService.validateToken(payload);

    if (!decode) {
      throw new HttpException('Invalid token', 401);
    }

    return this.userRepository.findOne({ where: { id: decode.userId } });
  }

  async validateGoogleLogin(profile: any) {
    const { email, firstName, lastName } = profile;

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user without password for OAuth users
      // Using a random phone number since it's required in the schema
      user = this.userRepository.create({
        email,
        firstname: firstName,
        lastname: lastName,
        password: null,
        phone: null,
        role: 'user' as any,
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async googleLogin() {
    // This method is just a placeholder, the actual redirect is handled by Passport
    return { message: 'Redirecting to Google OAuth' };
  }

  async googleLoginCallback(req: any) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('No user from Google');
    }

    try {
      // Validate and get/create user in database
      const dbUser = await this.validateGoogleLogin(user);

      // Generate JWT token
      const tokenData = await this.generateAccessToken(dbUser);

      // Redirect to frontend with token
      const frontendUrl = process.env.URL_FRONTEND;
      return {
        url: `${frontendUrl}/auth/callback?token=${tokenData.access_token}&name=${encodeURIComponent(tokenData.name)}&role=${tokenData.role}`,
      };
    } catch (error) {
      console.error('Error in Google OAuth callback:', error);
      const frontendUrl = process.env.URL_FRONTEND;
      return {
        url: `${frontendUrl}/login?error=oauth_failed`,
      };
    }
  }
}
