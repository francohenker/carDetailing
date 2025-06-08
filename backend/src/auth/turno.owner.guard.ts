import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TurnoService } from "src/turno/turno.service";

@Injectable()
export class TurnoOwnerGuard implements CanActivate {
    
    constructor(
        private readonly turnoService: TurnoService,
        private readonly jwtService: JwtService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        
        const token = request.headers.authorization?.split(' ')[1];
        const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        
        
        request.user = decoded; // para usarlo luego en controllers
        const user = request.user; // viene desde el JWT
        const turnoId = request.body.turnoId; // ID del turno desde el cuerpo de la solicitud

        const turno = await this.turnoService.findById(turnoId);
        if (!turno) {
            throw new HttpException('Turno not found', 404);
        }

        
        const userTurno = turno.car.user; // el usuario asociado al turno
        
        
        // Verifica si el usuario del token es el mismo que el usuario del turno
        //VER SI ES NECESARIO AGREGAR EL ADMIN COMO POSIBLE MODIFICADOR DEL TURNO !!!!!!
        if (!user || userTurno.id !== user.id) {
            throw new HttpException('You do not have permission to delete this turno', 403);
        }

        return true;
    }
}
