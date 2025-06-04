import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  await app.listen(4000);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // convierte tipos automáticamente
      forbidNonWhitelisted: true, // Lanza un error si hay campos no permitidos
      whitelist: true, // Permite solo campos en la entidad del dto
    }));

}




bootstrap();
