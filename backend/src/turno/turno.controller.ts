import { Body, Controller, Post, Req } from '@nestjs/common';
import { UserService } from 'src/users/user.service';
import { TurnoService } from './turno.service';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create.turno.dto';

@Controller('turno')
export class TurnoController {
    constructor(
        private userService: UserService,
        private turnoService: TurnoService,
    ) {}

    //use only for extracting user from request
    private getUserFromRequest(@Req() request): any {
        return this.userService.findUserByToken(request.headers.authorization);
    }

    // @Post('create')
    // async createTurno(@Req() request, @Body() createTurnoDto: CreateTurnoDto): Promise<Turno> {
    //     const user = this.getUserFromRequest(request);
    //     return this.turnoService.createTurno(user, createTurnoDto);
    // }

    // @Post('modify')
    // async modifyTurno(@Req() request): Promise<Turno> {
    //     const user = this.getUserFromRequest(request);
    //     return this.turnoService.modifyTurno(user);
    // }

    // @Post('delete')
    // async deleteTurno(@Req() request): Promise<void> {
    //     const user = this.getUserFromRequest(request);
    //     return this.turnoService.deleteTurno(user);
    // }

    // @Post('list')
    // async listTurnos(@Req() request): Promise<Turno[]> {
    //     const user = this.getUserFromRequest(request);
    //     return this.turnoService.listTurnos(user);
    // }

    



}
