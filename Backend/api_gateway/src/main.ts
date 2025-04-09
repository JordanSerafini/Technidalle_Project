import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration globale
  app.setGlobalPrefix('');

  // Activer CORS avec une configuration plus permissive
  app.enableCors({
    origin: true, // Permet toutes les origines en développement
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Démarrer l'application
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API Gateway is running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
