import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { NestExpressApplication } from '@nestjs/platform-express/interfaces/nest-express-application.interface';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'debug', 'error', 'verbose', 'warn']
        : ['log', 'error', 'warn'],
  });
  // Get the ConfigService instance
  const config: ConfigService = app.get(ConfigService);

  // Set the global prefix
  const envBasePath = config.get<string>('BASEPATH');
  let basepath = '';
  if (envBasePath && envBasePath.length > 1) {
    basepath = envBasePath.endsWith('/')
      ? envBasePath.substring(0, envBasePath.length - 1)
      : envBasePath;
  }
  if (basepath !== '') {
    app.setGlobalPrefix(basepath);
  }

  // Security
  // app.use(helmet());

  app.enableCors();
  await app.listen(4000);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // convierte tipos automáticamente
      forbidNonWhitelisted: true, // Lanza un error si hay campos no permitidos
      whitelist: true, // Permite solo campos en la entidad del dto
    }),
  );
}

bootstrap();
