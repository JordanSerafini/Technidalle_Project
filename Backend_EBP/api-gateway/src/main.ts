import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:19006'], // React Native Metro
    credentials: true,
  });

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Technidalle BTP API Gateway')
    .setDescription('API Gateway pour l\'application mobile BTP Technidalle - Architecture Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('API Gateway', 'Orchestration de tous les microservices BTP')
    .addTag('Clients', 'Gestion des clients BTP')
    .addTag('Suppliers', 'Gestion des fournisseurs')
    .addTag('Projects', 'Gestion des projets et chantiers')
    .addTag('Planning', 'Gestion du planning et événements')
    .addTag('Documents', 'Gestion documentaire')
    .addTag('Inventory', 'Gestion des stocks et articles')
    .addTag('POS', 'Point de vente et caisses')
    .addTag('Loyalty', 'Programme de fidélité')
    .addTag('Finance', 'Gestion financière et trésorerie')
    .addTag('Analytics', 'Analyses et reporting')
    .addTag('Workflow', 'Processus métier automatisés')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 API Gateway Technidalle BTP démarré sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api`);
  console.log(`🏗️  Architecture: 21 microservices + PostgreSQL + NATS + Redis`);
}

bootstrap();
