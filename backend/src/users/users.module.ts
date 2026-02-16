import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { AuthModule } from '../auth/auth.module';
import { Supplier } from '../supplier/entities/supplier.entity';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Users, Supplier])],
  providers: [UserService],
  controllers: [UsersController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
