import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Repository } from 'typeorm';
import { createCarDto } from './dto/create-car.dto';
import { Users } from 'src/users/entities/users.entity';

@Injectable()
export class CarService {
    constructor(
        @InjectRepository(Car)
        private carRepository: Repository<Car>,
        @InjectRepository(Users)
        private userRepository: Repository<Users>,
    ) { }

    async create(createCarDto: createCarDto): Promise<Car> {
        const user = await this.userRepository.findOne({ where: { id: createCarDto.idUser } });
        
        const car = new Car(
            user,
            createCarDto.marca,
            createCarDto.model,
            createCarDto.patente,
            createCarDto.color,
        );
        const newCar = this.carRepository.create(car);
        return await this.carRepository.save(newCar);
    }
}
