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
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';
import { Role } from '../roles/role.enum';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../roles/role.guard';
import { Roles } from '../roles/role.decorator';
import { AuthService } from '../auth/auth.service';
import { Users } from './entities/users.entity';
import { Auditar } from '../auditoria/decorators/auditar.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.USUARIO,
    descripcion: 'Registro de nuevo usuario',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Put('change-role/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Auditar({
    accion: TipoAccion.MODIFICAR_ROL,
    entidad: TipoEntidad.USUARIO,
    descripcion: 'Cambio de rol de usuario',
    capturarDatosAnteriores: true,
  })
  async changeRole(@Param('id') id: number, @Body('role') role: Role) {
    return this.userService.changeRole(id, role);
  }

  @Post('login')
  @Auditar({
    accion: TipoAccion.LOGIN,
    entidad: TipoEntidad.SISTEMA,
    descripcion: 'Inicio de sesión de usuario',
  })
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

  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.USUARIO,
    descripcion: 'Actualización de perfil de usuario',
    capturarDatosAnteriores: true,
  })
  @Put('update-profile')
  @UseGuards(AuthGuard)
  async updateProfile(@Req() request, @Body() updateData: UpdateUserDto) {
    const jwt = await this.authService.validateToken(
      request.headers.authorization,
    );
    const user = await this.userService.getProfile(jwt.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.userService.updateProfile(jwt.userId, updateData);
  }
}
