import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { Role } from '../roles/role.enum';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/role.guard';
import { Roles } from 'src/roles/role.decorator';
import { AuthService } from 'src/auth/auth.service';
import { Users } from './entities/users.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async create(@Body() createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
    return {
      statusCode: 201,
      message: 'User created successfully',
    };
  }

  @Put('change-role/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async changeRole(@Param('id') id: number, @Body('role') role: Role) {
    return this.userService.changeRole(id, role);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.userService.login(email, password);
  }


  //return user data (profile) to frontend
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() request): Promise<Users> {
    const jwt = await this.authService.validateToken(
      request.headers.authorization,
    );
    const user = await this.userService.getProfile(jwt.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  @Get('getall')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers(): Promise<Users[]> {
    return this.userService.getAllUsers();
  }

  //use Guard @UseGuards(AuthGuard) for protected routes
  // @Get('validate-token')
  // async validateToken(@Req() request): Promise<any> {
  //   const user = await this.userService.validateToken(
  //     request.headers.authorization,
  //   );
  //   if (!user) {
  //     return {
  //       statusCode: 401,
  //       message: 'Invalid token',
  //     };
  //   }
  //   return {
  //     statusCode: 200,
  //     message: 'Token is valid',
  //   };
  // }
}
