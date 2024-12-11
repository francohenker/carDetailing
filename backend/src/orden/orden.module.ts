import { Module } from '@nestjs/common';
import { OrdenController } from './orden.controller';

@Module({
  controllers: [OrdenController]
})
export class OrdenModule {}
