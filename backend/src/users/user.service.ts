import { Injectable } from '@nestjs/common';
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
            createUserDto.username, 
            createUserDto.password, 
            createUserDto.email, 
            createUserDto.telefono, 
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

    async findOne(username: string): Promise<Users | null> {
        return await this.userRepository.findOne({ where: { username } });
    }

    //verificar, no controle este metodo
    async login(username: string, password: string): Promise<any> {
        // const user = await this.userRepository.findOne({ where: { username, password } });
        // if (!user) {
        //     throw new Error('Invalid credentials');
        // }
        // return user;

        const user = await this.userRepository.findOneBy({username});
        if(!user){
            throw new Error('User not found');
        }

        if(bcrypt.compareSync("GOOGLE_ENTRY", user.password)){
            throw new Error('User or password incorrect');
        }
        
        if(bcrypt.compareSync(password, user.password)){
            return this.authService.generateAccessToken(user);
        }
        throw new Error('User or password incorrect');
    }

}
