import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { createCarDto } from './dto/create-car.dto';
import { CarService } from './car.service';
import { UserService } from 'src/users/user.service';

@Controller('car')
export class CarController {
    constructor(
        private readonly carService: CarService,
        private readonly userService: UserService, // Assuming you have a UserService to get user details
    ) {}


    @Post('create')
    async createCar(@Req() request, @Body() carData: createCarDto): Promise<any> {
        const user = await this.userService.findUserByToken(request.headers.authorization);
        await this.carService.create(carData, user);
        return 'Car created successfully'; 
    }

    @Get('get-cars-user')
    async getCarsByUser(@Req() request): Promise<any> {
        const user = await this.userService.findUserByToken(request.headers.authorization);
        const cars = await this.carService.findAllByUserId(user.id);
        return cars;
    }
    




}
