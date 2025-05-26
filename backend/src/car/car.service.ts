import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Repository } from 'typeorm';
import { createCarDto } from './dto/create-car.dto';
import { Users } from 'src/users/entities/users.entity';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/users/user.service';

@Injectable()
export class CarService {
    constructor(
        @InjectRepository(Car)
        private carRepository: Repository<Car>,
    ) { }

    async create(createCarDto: createCarDto, user: Users): Promise<Car> {
        const patenteRegex = /^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$/

        if (!patenteRegex.test(createCarDto.patente)) {
            throw new Error('Patente inválida');
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

    async findAllByUserId(userId: number): Promise<Car[]> {
        return await this.carRepository.find({ where: { user: { id: userId } } });
    }

}
