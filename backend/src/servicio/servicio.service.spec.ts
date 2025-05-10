import { Test, TestingModule } from '@nestjs/testing';
import { ServicioService } from './servicio.service';

describe('ServicioService', () => {
  let service: ServicioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicioService],
    }).compile();

    service = module.get<ServicioService>(ServicioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
