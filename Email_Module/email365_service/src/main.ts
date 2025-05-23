import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORTEMAIL365 ?? 3650);
}
void bootstrap();
console.log(
  'Email365 service is running on port',
  process.env.PORTEMAIL365 ?? 3650,
);
