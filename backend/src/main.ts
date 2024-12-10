import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  await app.listen(3000);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    forbidNonWhitelisted: true, // Lanza un error si hay campos no permitidos
    whitelist: true, // Permite solo campos en la entidad del dto
  }));

}




bootstrap();
