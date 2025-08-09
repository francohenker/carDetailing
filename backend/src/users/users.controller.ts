import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { Role } from '../roles/role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
    return {
      statusCode: 201,
      message: 'User created successfully',
    };
  }

  @Post('change-role')
  async changeRole(@Body('id') id: number, @Body('role') role: Role) {
    return this.userService.changeRole(id, role);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.userService.login(email, password);
  }

  @Get('profile')
  async getProfile(@Req() request): Promise<any> {
    const jwt = await this.userService.validateToken(
      request.headers.authorization,
    );
    const user = await this.userService.getProfile(jwt.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  @Get('validate-token')
  async validateToken(@Req() request): Promise<any> {
    const user = await this.userService.validateToken(
      request.headers.authorization,
    );
    if (!user) {
      return {
        statusCode: 401,
        message: 'Invalid token',
      };
    }
    return {
      statusCode: 200,
      message: 'Token is valid',
    };
  }
}
