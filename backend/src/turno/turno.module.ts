import { Module } from '@nestjs/common';
import { Turno } from './entities/turno.entity';
import { WorkSpace } from './entities/workspace.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoService } from './turno.service';
import { TurnoController } from './turno.controller';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { CarModule } from '../car/car.module';
import { CarService } from '../car/car.service';
import { ServicioModule } from '../servicio/servicio.module';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { MailService } from '../mail.services';
import { ProductoModule } from '../producto/producto.module';
import { SystemConfigModule } from '../config/system-config.module';

@Module({
  imports: [
    ServicioModule,
    CarModule,
    AuthModule,
    ProductoModule,
    TypeOrmModule.forFeature([Turno, WorkSpace]),
    SystemConfigModule,
  ],
  providers: [
    TurnoService,
    WorkspaceService,
    CarService,
    JwtService,
    MailService,
  ],
  controllers: [TurnoController, WorkspaceController],
  exports: [TypeOrmModule, WorkspaceService],
})
export class TurnoModule {}
