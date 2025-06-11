import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Créer une instance Express
  const expressApp = express();

  // Créer l'application NestJS avec un adaptateur Express
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    { bodyParser: false },
  );

  // Configurer les middleware manuellement
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use(express.json());
  expressInstance.use(express.urlencoded({ extended: true }));

  // Activer CORS
  app.enableCors();

  // Démarrer le serveur
  await app.init();
  await app.listen(process.env.PORT ?? 5599);

  logger.log(
    'Application chatbot démarrée sur le port ' + (process.env.PORT ?? 5599),
  );
}
void bootstrap();
