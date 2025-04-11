import { Module } from '@nestjs/common';
import {
  ClientsModule as NestClientsModule,
  Transport,
} from '@nestjs/microservices';
import { ResourcesController } from './resources.controller';

@Module({
  imports: [
    NestClientsModule.register([
      {
        name: 'RESOURCES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'resources',
          port: 3005,
        },
      },
    ]),
  ],
  controllers: [ResourcesController],
})
export class ResourcesModule {}
