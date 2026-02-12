import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { createCarDto } from './dto/create-car.dto';
import { CarService } from './car.service';
import { modifyCarDto } from './dto/modify-car.dto';
import { AuthService } from '../auth/auth.service';
import { Car } from './entities/car.entity';
import { Auditar } from '../auditoria/decorators/auditar.decorator';
import {
  TipoAccion,
  TipoEntidad,
} from '../auditoria/entities/auditoria.entity';

@Controller('car')
export class CarController {
  constructor(
    private readonly carService: CarService,
    private readonly authService: AuthService,
  ) {}

  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.CAR,
    descripcion: 'Creación de vehículo',
  })
  @Post('create')
  async createCar(@Req() request, @Body() carData: createCarDto): Promise<any> {
    const user = await this.authService.findUserByToken(
      request.headers.authorization,
    );
    return await this.carService.create(carData, user);
  }

  //return car's user
  @Get('get-cars-user')
  async getCarsByUser(@Req() request): Promise<Car[]> {
    const user = await this.authService.findUserByToken(
      request.headers.authorization,
    );
    if (user === null) {
      throw new HttpException('User unauthorized', 401);
    }
    const cars = await this.carService.findAllByUserId(user.id);
    return cars;
  }

  // Verificar si una patente existe en el sistema
  @Get('check-patente/:patente')
  async checkPatente(@Param('patente') patente: string) {
    return await this.carService.checkPatente(patente);
  }

  // only change color
  @Auditar({
    accion: TipoAccion.MODIFICAR,
    entidad: TipoEntidad.CAR,
    descripcion: 'Modificación de vehículo',
    capturarDatosAnteriores: true,
  })
  @Post('modify')
  async modifyCar(@Req() request, @Body() carData: modifyCarDto): Promise<any> {
    const user = await this.authService.findUserByToken(
      request.headers.authorization,
    );
    // Assuming you have a method to modify the car
    await this.carService.modify(carData, user);
    return { message: 'Car modified successfully' };
  }

  // Reclamar un auto dado de baja por patente
  @Auditar({
    accion: TipoAccion.CREAR,
    entidad: TipoEntidad.CAR,
    descripcion: 'Reclamo de vehículo por patente',
  })
  @Post('claim')
  async claimCar(@Req() request, @Body() body: { patente: string }): Promise<any> {
    const user = await this.authService.findUserByToken(
      request.headers.authorization,
    );
    const car = await this.carService.claimCar(user, body.patente);
    return { message: 'Vehículo reclamado exitosamente', car };
  }

  @Auditar({
    accion: TipoAccion.ELIMINAR,
    entidad: TipoEntidad.CAR,
    descripcion: 'Eliminación de vehículo',
  })
  @Delete('delete/:id')
  async deleteCar(@Req() request, @Param('id') id: number): Promise<any> {
    const user = await this.authService.findUserByToken(
      request.headers.authorization,
    );
    return await this.carService.deleteCar(user, id);
  }
}
