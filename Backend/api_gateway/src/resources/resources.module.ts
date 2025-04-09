import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ResourcesController } from './resources.controller';

@Module({
  imports: [
    ClientsModule.register([
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
