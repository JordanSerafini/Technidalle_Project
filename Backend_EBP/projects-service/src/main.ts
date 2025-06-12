import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Démarrer comme microservice NATS
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [process.env.NATS_URL || 'nats://nats:4222'],
      },
    },
  );

  // Démarrer aussi en mode HTTP pour les appels directs
  const httpApp = await NestFactory.create(AppModule);
  
  httpApp.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  httpApp.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  const port = process.env.PORT || 3004;
  
  await Promise.all([
    app.listen(),
    httpApp.listen(port)
  ]);

  console.log(`🚀 Projects Service démarré sur le port ${port}`);
  console.log(`📡 Microservice NATS connecté sur ${process.env.NATS_URL || 'nats://nats:4222'}`);
  console.log(`🗄️ Base postgres_sync connectée sur le port ${process.env.DB_PORT || '5433'}`);
}

bootstrap();
