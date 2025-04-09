import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Création du microservice TCP
  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: process.env.PORT ? parseInt(process.env.PORT) : 3005,
      },
    });
  await microservice.listen();

  // Création de l'application HTTP pour la documentation Swagger
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('API Ressources')
    .setDescription('API pour la gestion des ressources')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3005);
  console.log(`Application démarrée sur le port 3005`);
}
void bootstrap();
