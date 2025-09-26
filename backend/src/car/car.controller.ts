import { Body, Controller, Get, HttpException, Post, Req, UseGuards } from '@nestjs/common';
import { createCarDto } from './dto/create-car.dto';
import { CarService } from './car.service';
import { UserService } from 'src/users/users.service';
import { modifyCarDto } from './dto/modify-car.dto';
import { AuthService } from 'src/auth/auth.service';
import { Car } from './entities/car.entity';

@Controller('car')
export class CarController {
    constructor(
        private readonly carService: CarService,
        private readonly authService: AuthService,
    ) { }

    @Post('create')
    async createCar(@Req() request, @Body() carData: createCarDto): Promise<any> {
        const user = await this.authService.findUserByToken(
            request.headers.authorization,
        );
        await this.carService.create(carData, user);
        return 'Car created successfully';
    }

    //return car's user 
    @Get('get-cars-user')
    async getCarsByUser(@Req() request): Promise<Car[]> {
        const user = await this.authService.findUserByToken(
            request.headers.authorization,
        );
        if(user === null){
            throw new HttpException('User unauthorized', 401);
        }
        const cars = await this.carService.findAllByUserId(user.id);
        return cars;
    }

    // only change color
    @Post('modify')
    async modifyCar(@Req() request, @Body() carData: modifyCarDto): Promise<any> {
        const user = await this.authService.findUserByToken(
            request.headers.authorization,
        );
        // Assuming you have a method to modify the car
        await this.carService.modify(carData, user);
        return {'message': 'Car modified successfully'};
    }

    @Post('delete')
    async deleteCar(@Req() request, @Body() body): Promise<any> {
        const user = await this.authService.findUserByToken(request.headers.authorization);
        return await this.carService.deleteCar(user, body.id);
    }

}
