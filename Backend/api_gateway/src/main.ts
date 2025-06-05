import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // Configuration globale
  app.setGlobalPrefix('');

  // Activer CORS avec une configuration plus permissive
  app.enableCors({
    origin: true, // Permet toutes les origines en développement
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('Documentation des services de l\'API Gateway')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Démarrer l'application
  await app.listen(process.env.PORT ?? 3000);
  console.log(`API Gateway is running on port ${process.env.PORT ?? 3000}`);
}
void bootstrap();
