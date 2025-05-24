import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { Repository } from 'typeorm';
import { createCarDto } from './dto/create-car.dto';
import { Users } from 'src/users/entities/users.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class CarService {
    constructor(
        @InjectRepository(Car)
        private carRepository: Repository<Car>,
        @InjectRepository(Users)
        private userRepository: Repository<Users>,
        private authService: AuthService,
    ) { }

    async create(createCarDto: createCarDto, user: Users): Promise<Car> {
        // const user = await this.userRepository.findOne({ where: {} });

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


    async findUserById(token: string): Promise<Users> {
        var payload = "";
        if (token && token.startsWith('Bearer ')) {
            payload = token.split(' ')[1]; // Extraer solo el token
        } else {
            payload = null;
        }
        const decode = await this.authService.validateToken(payload);
        if (!decode) {
            throw new Error('Token inválido o caducado');
        }

        // const id = await this.authService.validateToken(token);
        return await this.userRepository.findOne({ where: { id: decode.userId } });
    }



}
