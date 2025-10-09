import {
  Body,
  Controller,
  HttpException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PagoService } from './pago.service';
import { Pago } from './entities/pago.entity';
import { Roles } from '../roles/role.decorator';
import { Role } from '../roles/role.enum';
import { RolesGuard } from 'src/roles/role.guard';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('pago')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('mark-paid/:turnoId')
  async markTurnoAsPaid(
    @Param('turnoId') turnoId: string,
    @Body() paymentData: { monto: number; metodo: string },
  ): Promise<Pago> {
    try {
      const turnoIdNumber = parseInt(turnoId, 10);
      if (isNaN(turnoIdNumber)) {
        throw new HttpException('Invalid turno ID', 400);
      }
      return await this.pagoService.markTurnoAsPaid(
        turnoIdNumber,
        paymentData.monto,
        paymentData.metodo,
      );
    } catch (error) {
      throw new HttpException(error.message || 'Error creating payment', 500);
    }
  }
}
