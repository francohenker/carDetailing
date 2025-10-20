import {
  Controller,
  Get,
  Param,
  Response,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { FacturaService } from './factura.service';
import { AuthGuard } from '../auth/auth.guard';
import { Response as ExpressResponse } from 'express';

@Controller('factura')
@UseGuards(AuthGuard)
export class FacturaController {
  constructor(private readonly facturaService: FacturaService) {}

  @Get('download/:turnoId')
  async downloadFactura(
    @Param('turnoId', ParseIntPipe) turnoId: number,
    @Response() res: ExpressResponse,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.facturaService.generateFacturaPDF(turnoId);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${turnoId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      res.status(400).json({
        error: 'Error generando la factura',
        message: error.message,
      });
    }
  }
}
