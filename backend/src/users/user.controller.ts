import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { Role } from 'src/enums/role';
import { STATUS_CODES } from 'http';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post('register')
    async create(@Body() createUserDto: CreateUserDto) {
        await this.userService.create(createUserDto);
        return {
            statusCode: 201,
            message: 'User created successfully',
        }
    }

    @Post('change-role')
    async changeRole(@Body('id') id: number, @Body('role') role: Role) {
        return this.userService.changeRole(id, role);
    }

    @Post('login')
    async login(@Body('username') username: string, @Body('password') password: string) {
        return await this.userService.login(username, password);
    }

}
