import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from '../turno/entities/turno.entity';
import { Pago } from '../pago/entities/pago.entity';
import { estado_pago } from '../enums/estado_pago.enum';
import PDFDocument from 'pdfkit';
import { empresaInfo } from '../config/empresa.config';

@Injectable()
export class FacturaService {
  constructor(
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
  ) {}

  async generateFacturaPDF(turnoId: number): Promise<Buffer> {
    // Buscar el turno con todas las relaciones necesarias
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['car', 'car.user', 'servicio', 'servicio.precio', 'pago'],
    });

    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }

    // Verificar que el turno tenga al menos un pago completado
    const pagoCompletado = turno.pago.find(
      (pago) => pago.estado === estado_pago.PAGADO,
    );

    if (!pagoCompletado) {
      throw new NotFoundException(
        'No se encontró un pago completado para este turno',
      );
    }

    return this.createPDF(turno, pagoCompletado);
  }

  private createPDF(turno: Turno, pago: Pago): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Header del comprobante
      doc
        .fontSize(20)
        .text('COMPROBANTE DE PAGO', { align: 'center' })
        .moveDown();

      // Información de la empresa
      doc
        .fontSize(14)
        .text(empresaInfo.razonSocial, { align: 'left' })
        .fontSize(10)
        .text(`CUIT: ${empresaInfo.cuit}`)
        .text('Servicio profesional de lavado y detailing de vehículos')
        .text(`Email: ${empresaInfo.email}`)
        .text(`Teléfono: ${empresaInfo.telefono}`);

      if (empresaInfo.web) {
        doc.text(`Web: ${empresaInfo.web}`);
      }

      doc.moveDown();

      // Información de la sucursal
      doc
        .fontSize(11)
        .text('SUCURSAL:', { underline: true })
        .fontSize(10)
        .text(empresaInfo.sucursal.nombre)
        .text(empresaInfo.sucursal.direccion)
        .text(
          `${empresaInfo.sucursal.localidad}, ${empresaInfo.sucursal.provincia} - CP: ${empresaInfo.sucursal.codigoPostal}`,
        );

      if (empresaInfo.sucursal.telefono) {
        doc.text(`Tel: ${empresaInfo.sucursal.telefono}`);
      }

      doc.moveDown();

      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

      // Información del comprobante
      const comprobanteNumber = `COMP-${turno.id.toString().padStart(6, '0')}`;
      const fechaComprobante = new Date().toLocaleDateString('es-AR');
      const fechaPago = pago.fecha_pago.toLocaleDateString('es-AR');

      doc
        .fontSize(12)
        .text(`Comprobante N°: ${comprobanteNumber}`, { align: 'right' })
        .text(`Fecha de Emisión: ${fechaComprobante}`, { align: 'right' })
        .text(`Fecha de Pago: ${fechaPago}`, { align: 'right' })
        .moveDown();

      // Información del cliente
      doc
        .fontSize(14)
        .text('DATOS DEL CLIENTE:', { underline: true })
        .fontSize(12)
        .text(`Nombre: ${turno.car.user.firstname} ${turno.car.user.lastname}`)
        .text(`Email: ${turno.car.user.email}`)
        .text(`Teléfono: ${turno.car.user.phone}`)
        .moveDown();

      // Información del vehículo
      doc
        .fontSize(14)
        .text('DATOS DEL VEHÍCULO:', { underline: true })
        .fontSize(12)
        .text(`Vehículo: ${turno.car.marca} ${turno.car.model}`)
        .text(`Patente: ${turno.car.patente}`)
        .text(`Color: ${turno.car.color}`)
        .text(`Tipo: ${turno.car.type}`)
        .moveDown();

      // Información del servicio
      doc
        .fontSize(14)
        .text('DETALLE DE SERVICIOS:', { underline: true })
        .moveDown();

      // Tabla de servicios
      let yPosition = doc.y;

      // Headers de la tabla
      doc
        .fontSize(10)
        .text('Servicio', 50, yPosition, { width: 200 })
        .text('Duración', 300, yPosition, { width: 80 })
        .text('Precio', 450, yPosition, { width: 100, align: 'right' });

      yPosition += 20;

      // Línea bajo el header
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

      yPosition += 10;

      // Servicios
      turno.servicio.forEach((servicio) => {
        const precio = servicio.precio?.find(
          (p) => p.tipoVehiculo === turno.car.type,
        );
        const precioMonto = precio ? precio.precio : 0;

        doc
          .text(servicio.name, 50, yPosition, { width: 200 })
          .text(`${servicio.duration} min`, 300, yPosition, { width: 80 })
          .text(`$${precioMonto.toLocaleString()}`, 450, yPosition, {
            width: 100,
            align: 'right',
          });

        yPosition += 20;
      });

      // Línea separadora antes del total
      yPosition += 10;
      doc.moveTo(300, yPosition).lineTo(550, yPosition).stroke();

      yPosition += 15;

      // Total
      doc
        .fontSize(12)
        .text('TOTAL:', 300, yPosition, { width: 100 })
        .text(`$${turno.totalPrice.toLocaleString()}`, 450, yPosition, {
          width: 100,
          align: 'right',
        });

      yPosition += 30;

      // Información del pago
      doc
        .fontSize(14)
        .text('INFORMACIÓN DEL PAGO:', 50, yPosition, { underline: true })
        .fontSize(12)
        .text(`Método de Pago: ${pago.metodo}`, 50, yPosition + 20)
        .text(`Monto: $${pago.monto.toLocaleString()}`, 50, yPosition + 35)
        .text(`Estado: ${pago.estado}`, 50, yPosition + 50);

      if (pago.payment_id) {
        doc.text(`ID de Transacción: ${pago.payment_id}`, 50, yPosition + 65);
      }

      // Footer
      doc
        .fontSize(10)
        .text(
          'Gracias por confiar en nuestros servicios',
          50,
          doc.page.height - 100,
          { align: 'center' },
        )
        .text(
          `${empresaInfo.razonSocial} - CUIT: ${empresaInfo.cuit}`,
          50,
          doc.page.height - 85,
          { align: 'center' },
        )
        .text(
          'Este es un comprobante de pago generado automáticamente',
          50,
          doc.page.height - 70,
          { align: 'center' },
        );

      doc.end();
    });
  }
}
