import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: 'tcp',
      options: {
        host: '0.0.0.0',
        port: 3004,
      },
    } as unknown as MicroserviceOptions,
  );
  await app.listen();
  console.log('Documents service is listening on port 3004');
}
void bootstrap();
