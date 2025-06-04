import { Module } from '@nestjs/common';
import { UserModule } from 'src/users/user.module';
import { Turno } from './entities/turno.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';

@Module({
    imports: [UserModule, TypeOrmModule.forFeature([Turno])],
    providers: [TurnoService],
    controllers: [TurnoController],
    exports: [TypeOrmModule, UserModule],
})
export class TurnoModule {}
