import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';
import { Role } from 'src/enums/role';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}
    
    @Post('create')
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Post('change-role')
    changeRole(@Body('id') id: number, @Body('role') role: Role) {
        return this.userService.changeRole(id, role);
    }


}
