import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Repository } from 'typeorm';
import { createCarDto } from './dto/create-car.dto';
import { Users } from '../users/entities/users.entity';
import { modifyCarDto } from './dto/modify-car.dto';
import { SystemConfigService } from '../config/system-config.service';
import { Turno } from '../turno/entities/turno.entity';
import { estado_turno } from '../enums/estado_turno.enum';
import { estado_pago } from '../enums/estado_pago.enum';
import { MailService } from '../mail.services';

@Injectable()
export class CarService {
  constructor(
    @InjectRepository(Car)
    private carRepository: Repository<Car>,
    @InjectRepository(Turno)
    private turnoRepository: Repository<Turno>,
    private systemConfigService: SystemConfigService,
    private mailService: MailService,
  ) {}

  async create(createCarDto: createCarDto, user: Users): Promise<Car> {
    const patenteRegex = /^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$/;

    if (!patenteRegex.test(createCarDto.patente)) {
      throw new Error('Patente inválida');
    }

    // Validar tipo de vehículo activo
    const activeTypes = await this.systemConfigService.getActiveVehicleTypes();
    if (!activeTypes.includes(createCarDto.type)) {
      throw new HttpException(
        `El tipo de vehículo '${createCarDto.type}' no está activo en el sistema`,
        400,
      );
    }

    const car = new Car(
      user,
      createCarDto.marca.toUpperCase(),
      createCarDto.model.toUpperCase(),
      createCarDto.patente.toUpperCase(),
      createCarDto.color.toUpperCase(),
      createCarDto.type,
    );
    const newCar = this.carRepository.create(car);
    return await this.carRepository.save(newCar);
  }
  //return all cars for user
  async findAllByUserId(userId: number): Promise<Car[]> {
    return await this.carRepository.find({ where: { user: { id: userId } } });
  }

  async findById(carId: number): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { id: carId },
      relations: ['user'],
    });
    if (!car) {
      throw new HttpException('Car not found', 404);
    }
    return car;
  }

  //only change color
  async modify(carData: modifyCarDto, user: Users): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { id: carData.id, user: { id: user.id } },
    });
    if (!car) {
      throw new HttpException(
        'Car not found or does not belong to the user',
        404,
      );
    }

    car.color = carData.color.toUpperCase();

    return await this.carRepository.save(car);
  }

  // turn True isDelete property car and cancel pending turnos
  async deleteCar(user: Users, carId: number) {
    const car = await this.carRepository.findOne({
      where: { id: carId, user: { id: user.id } },
      relations: ['user'],
    });

    if (!car) {
      throw new HttpException('Car not found or does not belong to user', 404);
    }

    // Buscar turnos pendientes con sus pagos
    const pendingTurnos = await this.turnoRepository.find({
      where: {
        car: { id: carId },
        estado: estado_turno.PENDIENTE,
      },
      relations: ['car', 'car.user', 'servicio', 'pago'],
    });

    // Verificar si algún turno pendiente tiene pagos realizados
    const turnosConPago = pendingTurnos.filter(
      (turno) =>
        turno.pago && turno.pago.some((p) => p.estado === estado_pago.PAGADO),
    );

    if (turnosConPago.length > 0) {
      const turnosInfo = turnosConPago
        .map(
          (t) =>
            `Turno del ${new Date(t.fechaHora).toLocaleDateString('es-AR')}`,
        )
        .join(', ');
      throw new HttpException(
        `No se puede eliminar el vehículo porque tiene ${turnosConPago.length} turno(s) pendiente(s) con pago realizado: ${turnosInfo}. Cancele o finalice esos turnos primero.`,
        400,
      );
    }

    // Cancelar todos los turnos pendientes (ninguno tiene pago realizado)

    for (const turno of pendingTurnos) {
      turno.estado = estado_turno.CANCELADO;
      await this.turnoRepository.save(turno);

      // Enviar email de cancelación
      try {
        this.mailService.sendHtmlMail(
          turno.car.user.email,
          '❌ Turno Cancelado - Vehículo dado de baja',
          `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h2>Turno Cancelado</h2>
            </div>
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
              <p>Su turno del <strong>${turno.fechaHora}</strong> para el vehículo 
              <strong>${car.marca} ${car.model} (${car.patente})</strong> ha sido cancelado 
              porque el vehículo fue dado de baja del sistema.</p>
              <p>Si desea reagendar, por favor registre el vehículo nuevamente.</p>
            </div>
          </div>`,
          `Turno cancelado por baja de vehículo ${car.patente}`,
        );
      } catch (e) {
        // No fallar si el email falla
      }
    }

    car.isDeleted = true;
    await this.carRepository.save(car);
    return {
      message: 'Vehículo dado de baja',
      cancelledTurnos: pendingTurnos.length,
    };
  }

  // Buscar vehículo por patente (para transferencia)
  async checkPatente(patente: string): Promise<{
    exists: boolean;
    isDeleted?: boolean;
    carId?: number;
    marca?: string;
    model?: string;
    color?: string;
    type?: string;
    patente?: string;
  }> {
    const car = await this.carRepository.findOne({
      where: { patente: patente.toUpperCase() },
      relations: ['user'],
    });

    if (!car) {
      return { exists: false };
    }

    return {
      exists: true,
      isDeleted: car.isDeleted,
      carId: car.id,
      marca: car.marca,
      model: car.model,
      color: car.color,
      type: car.type,
      patente: car.patente,
    };
  }

  // Reclamar un auto dado de baja por patente (transferir a nuevo usuario)
  async claimCar(user: Users, patente: string): Promise<Car> {
    const car = await this.carRepository.findOne({
      where: { patente: patente.toUpperCase() },
      relations: ['user'],
    });

    if (!car) {
      throw new HttpException('Vehículo no encontrado con esa patente', 404);
    }

    if (!car.isDeleted) {
      throw new HttpException(
        'Este vehículo está activo y pertenece a otro usuario. No se puede reclamar.',
        400,
      );
    }

    // Transferir el auto al nuevo usuario
    car.user = user;
    car.isDeleted = false;
    return await this.carRepository.save(car);
  }
}
