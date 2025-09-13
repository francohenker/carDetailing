import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Repository } from 'typeorm';
import { CreateTurnoDto } from './dto/create.turno.dto';
import { Car } from 'src/car/entities/car.entity';
import { ServicioService } from 'src/servicio/servicio.service';
import { ModifyTurnoDto } from './dto/modify.turno.dto';
import { fetchWeatherApi } from 'openmeteo';


@Injectable()
export class TurnoService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    private servicioService: ServicioService, 
  ) { }

  async createTurno(car: Car, turnoView: CreateTurnoDto): Promise<Turno> {
    const servicios = await this.servicioService.findByIds(turnoView.servicios);
    const newTurno = new Turno(
      car,
      turnoView.estado,
      turnoView.observacion,
      servicios,
    );
    const turno = this.turnoRepository.create(newTurno);
    this.turnoRepository.save(turno);
    return turno;
  }

  //VERIFICAR!!!!!!!!!!, agregar validaciones con respecto a la fecha (y posiblemente a los demas campos, try no funciona como deberia)
  async modifyTurno(turno: ModifyTurnoDto): Promise<Turno> {
    const existingTurno = await this.turnoRepository.findOneBy({
      id: turno.turnoId,
    });
    if (!existingTurno) {
      throw new HttpException('Turno not found', 404);
    }
    try {
      existingTurno.fechaHora = turno.fechaHora;
      existingTurno.estado = turno.estado;
      existingTurno.observacion = turno.observacion;

      const servicios = await this.servicioService.findByIds(turno.servicios);
      existingTurno.servicio = servicios;
      this.turnoRepository.save(existingTurno);
    } catch (error) {
      throw new HttpException('Error modifying Turno: ' + error.message, 500);
    }

    return existingTurno;
  }

  async deleteTurno(turnoId: number): Promise<void> {
    const turno = await this.turnoRepository.findOneBy({ id: turnoId });
    if (turno) {
      await this.turnoRepository.remove(turno);
    } else {
      throw new HttpException('Turno not found', 404);
    }
  }

  async findById(turnoId: number): Promise<Turno> {
    return await this.turnoRepository.findOne({
      where: { id: turnoId },
      relations: ['car', 'car.user', 'servicio'], // Assuming you want to load related entities
    });
  }




  // APARTADO DE LA API DEL TIEMPO
  //falta ver bien su implmementacion, filtrar por la fecha de inicio y de fin

  async wheater(startDate: string, endDate: string): Promise<any> {

    const params = {
      "latitude": [-27.0005],
      "longitude": [-54.4816],
      // "hourly": "temperature_2m",
      "hourly": ["temperature_2m", "apparent_temperature", "precipitation_probability", "precipitation"],
      "timezone": "America/Sao_Paulo",
      "start_date": "2025-06-17",
      "end_date": "2025-07-01"
      // "start_date": startDate,
      // "end_date": endDate
    };

    const url = "https://api.open-meteo.com/v1/forecast";
    const responses = await fetchWeatherApi(url, params);

    // Process first location. Add a for-loop for multiple locations or weather models
    const response = responses[0];

    // Attributes for timezone and location
    const utcOffsetSeconds = response.utcOffsetSeconds();
    const timezone = response.timezone();
    const timezoneAbbreviation = response.timezoneAbbreviation();
    const latitude = response.latitude();
    const longitude = response.longitude();

    const hourly = response.hourly()!;

    // Note: The order of weather variables in the URL query and the indices below need to match!
    const weatherData = {
      hourly: {
        time: [...Array((Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval())].map(
          (_, i) => new Date((Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) * 1000)
        ),
        temperature2m: hourly.variables(0)!.valuesArray()!,
      },
    };

    return weatherData;
    // `weatherData` now contains a simple structure with arrays for datetime and weather data
    // for (let i = 0; i < weatherData.hourly.time.length; i++) {
    //     console.log(
    //         weatherData.hourly.time[i].toISOString(),
    //         weatherData.hourly.temperature2m[i]
    //     );
    // }
  }

}
