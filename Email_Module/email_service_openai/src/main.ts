import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
      'http://localhost',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:19006',
      'http://127.0.0.1:3000',
      'http://192.168.20.225:8081',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,Origin,X-Requested-With',
    exposedHeaders: 'Content-Range,X-Content-Range',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  await app.listen(4444);
  logger.log(`Le serveur est démarré sur le port 4444`);
}
void bootstrap();
