import { Body, Controller, Post, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Car } from './entities/car.entity';
import { createCarDto } from './dto/create-car.dto';
import { CarService } from './car.service';
import { request } from 'http';

@Controller('car')
export class CarController {
    constructor(
        private readonly carService: CarService,
    ) {}


    @Post('create')
    async createCar(@Req() request, @Body() carData: createCarDto): Promise<any> {
        const user = await this.carService.findUserById(request.headers.authorization);
        await this.carService.create(carData, user);
        return 'Car created successfully'; 
    }

    




}
