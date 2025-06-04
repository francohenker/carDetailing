import { Body, Controller, Post, Req } from '@nestjs/common';
import { ServicioService } from './servicio.service';
import { UserService } from 'src/users/user.service';
import { CreateServicioDto } from './dto/create.servicio.dto';
import { ModifyServicioDto } from './dto/modify.servicio.dto';
import { Servicio } from './entities/servicio.entity';

@Controller('servicio')
export class ServicioController {
    constructor(
        private servicioService: ServicioService,
        private userService: UserService,
    ) {}

    getUserFromRequest(@Req() request): any {
        return this.userService.findUserByToken(request.headers.authorization);
        
    }

    @Post('create')
    async createServicio(@Body() servicio: CreateServicioDto): Promise<Servicio | null> {
        return this.servicioService.create(servicio);
    }

    @Post('modify')
    async modifyServicio(@Body() servicio: ModifyServicioDto): Promise<Servicio | null> {
        return this.servicioService.modify(servicio);

    }
    @Post('delete')
    async deleteServicio(@Body() body): Promise<any> {
        return this.servicioService.delete(body.id);

    }




}
