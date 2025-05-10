import { Injectable } from '@nestjs/common';
import { Users } from './entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/enums/role';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(Users)
        private userRepository: Repository<Users>,
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



}
