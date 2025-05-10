import { Body, Controller, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { createCarDto } from './dto/create-car.dto';
import { CarService } from './car.service';

@Controller('car')
export class CarController {
    constructor(
        private readonly carService: CarService,
    ) {}


    @Post('create')
    async createCar(@Body() carData: createCarDto): Promise<any> {
        await this.carService.create(carData);
        return 'Car created successfully'; 
    }
}
