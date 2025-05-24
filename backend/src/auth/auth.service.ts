import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { Users } from 'src/users/entities/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        // private userService: UserService,
        // private userRepository: Repository<Users>,
        private jwtService: JwtService,
    ) { }


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


    async generateAccessToken(user: Users) {
        const payload = { name: user.username, userId: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            name: user.username,
            role: user.role,
        };
    }

    async validateToken(token: string) {
        try {
            const decoded = this.jwtService.verify(token); // Verifica firma y expiración
            return decoded;
        } catch (error) {
            throw new UnauthorizedException('Token inválido o caducado');
        }
    }


}
