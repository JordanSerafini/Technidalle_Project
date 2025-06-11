import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration de validation globale
  app.useGlobalPipes(
    new ValidationPipe({ 
      whitelist: true, 
      transform: true,
      forbidNonWhitelisted: true
    }),
  );

  // Configuration CORS pour permettre les appels depuis l'API Gateway
  app.enableCors({
    origin: ['http://localhost:3000', 'http://api-gateway:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 6655);
  console.log(`Chatbot Service is running on port ${process.env.PORT ?? 6655}`);
}
bootstrap();
