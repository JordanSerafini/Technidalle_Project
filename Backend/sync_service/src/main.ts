import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Activer CORS
  app.enableCors();

  try {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-call */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    // Configuration Swagger
    const config = new DocumentBuilder()
      .setTitle('Service de Synchronisation')
      .setDescription(
        'API pour la synchronisation des données entre EBP et PostgreSQL',
      )
      .setVersion('1.0')
      .addTag('sync')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    /* eslint-enable @typescript-eslint/no-unsafe-call */
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */

    logger.log('Documentation Swagger configurée avec succès');
  } catch (error) {
    logger.error(
      'Erreur lors de la configuration de Swagger',
      error instanceof Error ? error.message : String(error),
    );
  }

  // Déterminer le port à utiliser
  const port = process.env.PORT || 3000;

  await app.listen(port);
  logger.log(`Service de synchronisation démarré sur le port ${port}`);
}

void bootstrap();
