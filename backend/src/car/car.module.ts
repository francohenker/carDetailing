import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './entities/car.entity';
import { CarController } from './car.controller';
import { CarService } from './car.service';
import { UserModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Car]), AuthModule],
  controllers: [CarController],
  providers: [CarService],
  exports: [TypeOrmModule],
})
export class CarModule {}
