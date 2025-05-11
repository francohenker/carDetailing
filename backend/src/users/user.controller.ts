import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { Role } from 'src/enums/role';
import { STATUS_CODES } from 'http';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Post('register')
    async create(@Body() createUserDto: CreateUserDto) {
        await this.userService.create(createUserDto);
        return STATUS_CODES[201];
    }

    @Post('change-role')
    async changeRole(@Body('id') id: number, @Body('role') role: Role) {
        return this.userService.changeRole(id, role);
    }

    // IMPLEMENTAR JWT PARA TERMINAR ESTA FUNCION
    @Post('login')
    async login(@Body('username') username: string, @Body('password') password: string) {
        const user = await this.userService.login(username, password);
        
        return 'asd';
    }

}
