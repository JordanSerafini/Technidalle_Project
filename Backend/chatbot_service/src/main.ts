import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Protection contre les vulnérabilités HTTP
  app.use(helmet());

  // Protection contre les attaques par force brute (rate limiting)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limite chaque IP à 100 requêtes par fenêtre
      standardHeaders: true, // Retourne `RateLimit-*` headers
      legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
      message: {
        status: 429,
        message: 'Trop de requêtes, veuillez réessayer plus tard.',
      },
    }),
  );

  // Activer CORS
  app.enableCors();

  // Préfixe global pour l'API
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 5599);
  logger.log(
    'Application chatbot démarrée sur le port ' + (process.env.PORT ?? 5599),
  );
}
void bootstrap();
