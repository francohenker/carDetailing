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

  //inicio de sesion, todavia nose si se va a usar1

  // async signIn(username: string,password: string,): Promise<{ access_token: string }> {
  //     // const user = await this.userService.findOne(username);
  //     const user = await this.userRepository.findOneBy({ username });
  //     if (user?.password !== password) {
  //         throw new UnauthorizedException();
  //     }
  //     const payload = { sub: user.id, username: user.username };
  //     return {
  //         access_token: await this.jwtService.signAsync(payload),
  //     };
  // }

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

  //DEPRECATED (??

  // async validateToken(token: string) {
  //   try {
  //     const decoded = this.jwtService.verify(token, {
  //       secret: process.env.JWT_SECRET,
  //     }); // Verifica firma y expiración
  //     return decoded;
  //   } catch (error) {
  //     throw new UnauthorizedException('Token inválido o caducado');
  //   }
  // }

  // async findUser(token: string): Promise<Users> {
  //   let payload = '';
  //   if (token && token.startsWith('Bearer ')) {
  //     payload = token.split(' ')[1]; // Extraer solo el token
  //   } else {
  //     payload = null;
  //   }
  //   const decode = await this.validateToken(payload);
  //   if (!decode) {
  //     throw new UnauthorizedException('Token inválido o caducado');
  //   }
  //   return decode;
  // }

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
}
