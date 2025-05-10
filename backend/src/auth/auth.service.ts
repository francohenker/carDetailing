import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';

@Injectable()
export class AuthService {
    constructor(
        private UserService: UserService,
        private jwtService: JwtService,
    ) { }


    async signIn(
        username: string,
        password: string,
    ): Promise<{ access_token: string }> {
        const user = await this.UserService.findOne(username);
        if (user?.password !== password) {
            throw new UnauthorizedException();
        }
        const payload = { sub: user.id, username: user.username };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }


}
