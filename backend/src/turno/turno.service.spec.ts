import { Test, TestingModule } from '@nestjs/testing';
import { TurnoService } from './turno.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
// import { Repository } from 'typeorm';
import { CarService } from '../car/car.service';
import { ServicioService } from '../servicio/servicio.service';

const mockTurnoRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('TurnoService', () => {
  let service: TurnoService;
  // let turnoRepository: jest.Mocked<Repository<Turno>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnoService,
        {
          provide: getRepositoryToken(Turno),
          useFactory: mockTurnoRepository,
        },
        {
          provide: CarService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: ServicioService,
          useValue: {
            findByIds: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TurnoService>(TurnoService);
    // turnoRepository = module.get(getRepositoryToken(Turno));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
