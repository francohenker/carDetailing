import { Test, TestingModule } from '@nestjs/testing';
import { MercadopagoController } from './mercadopago.controller';

describe('MercadopagoController', () => {
  let controller: MercadopagoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MercadopagoController],
    }).compile();

    controller = module.get<MercadopagoController>(MercadopagoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
