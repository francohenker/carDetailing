import { HttpException, Injectable } from '@nestjs/common';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/enums/role';
import * as bcrypt from 'bcrypt';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(Users)
        private userRepository: Repository<Users>,
        private authService: AuthService,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<any> {
        const user = new Users(
            createUserDto.firstname.slice(0, 1).toUpperCase() + createUserDto.firstname.slice(1),
            createUserDto.lastname.slice(0, 1).toUpperCase() + createUserDto.lastname.slice(1),
            createUserDto.password,
            createUserDto.email,
            createUserDto.phone,
            Role.USER);
        const newUser = this.userRepository.create(user);
        return await this.userRepository.save(newUser);
    }

    async changeRole(id: number, role: Role): Promise<any> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error('User not found');
        }
        user.role = role;
        return await this.userRepository.save(user);
    }


    async login(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findOneBy({ email });
        if (!user) {
            throw new HttpException('User not found', 404);
        }
        // if(bcrypt.compareSync("GOOGLE_ENTRY", user.password)){
        //     throw new Error('User or password incorrect');
        // }

        if (bcrypt.compareSync(password, user.password)) {
            return this.authService.generateAccessToken(user);
        }
        throw new HttpException('User or password incorrect', 401);
    }


    async findOne(id: number): Promise<Users | null> {
        return await this.userRepository.findOne({ where: { id } });
    }




    async validateToken(token: string): Promise<any> {
        var payload = "";
        if (token && token.startsWith('Bearer ')) {
            payload = token.split(' ')[1]; // Extraer solo el token
        } else {
            payload = null;
        }
        payload = await this.authService.validateToken(payload);
        if (!payload) {
            throw new HttpException('Invalid token', 401);
        }
        return payload;
    }

    async findUserByToken(token: string): Promise<any> {
        const decode = await this.validateToken(token);
        // const decode = await this.authService.validateToken(payload);

        if (!decode) {
            throw new HttpException('Invalid token', 401);
        }

        return this.userRepository.findOne({ where: { id: decode.userId } });

    }

    async getProfile(id: number): Promise<any> {
        const user = await this.findOne(id);
        if (!user) {
            throw new HttpException('User not found', 404);
        }
        return user
    }

}
