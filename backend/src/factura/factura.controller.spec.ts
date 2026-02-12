import { Test, TestingModule } from '@nestjs/testing';
import { FacturaController } from './factura.controller';
import { FacturaService } from './factura.service';
import { Response } from 'express';

describe('FacturaController', () => {
  let controller: FacturaController;
  let service: FacturaService;

  const mockFacturaService = {
    generateFacturaPDF: jest.fn(),
  };

  const mockResponse = {
    set: jest.fn(),
    end: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacturaController],
      providers: [
        {
          provide: FacturaService,
          useValue: mockFacturaService,
        },
      ],
    }).compile();

    controller = module.get<FacturaController>(FacturaController);
    service = module.get<FacturaService>(FacturaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('downloadFactura', () => {
    it('debe descargar una factura correctamente', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');
      mockFacturaService.generateFacturaPDF.mockResolvedValue(mockPdfBuffer);

      await controller.downloadFactura(1, mockResponse);

      expect(service.generateFacturaPDF).toHaveBeenCalledWith(1);
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="comprobante-1.pdf"',
        'Content-Length': mockPdfBuffer.length,
      });
      expect(mockResponse.end).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('debe manejar errores al generar la factura', async () => {
      const errorMessage = 'Turno no encontrado';
      mockFacturaService.generateFacturaPDF.mockRejectedValue(
        new Error(errorMessage),
      );

      await controller.downloadFactura(999, mockResponse);

      expect(service.generateFacturaPDF).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error generando la factura',
        message: errorMessage,
      });
    });

    it('debe usar el turnoId en el nombre del archivo', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');
      mockFacturaService.generateFacturaPDF.mockResolvedValue(mockPdfBuffer);

      await controller.downloadFactura(123, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Disposition': 'attachment; filename="comprobante-123.pdf"',
        }),
      );
    });

    it('debe establecer el tipo de contenido como PDF', async () => {
      const mockPdfBuffer = Buffer.from('PDF content');
      mockFacturaService.generateFacturaPDF.mockResolvedValue(mockPdfBuffer);

      await controller.downloadFactura(1, mockResponse);

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        }),
      );
    });
  });
});
