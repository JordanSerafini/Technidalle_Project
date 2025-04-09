import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration globale
  app.setGlobalPrefix('api/v1');

  // Activer CORS
  app.enableCors();

  // Démarrer l'application
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API Gateway is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
