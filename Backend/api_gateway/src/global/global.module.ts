import { Module } from '@nestjs/common';
import { GlobalController } from './global.controller';
import { GlobalService } from './global.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLIENTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.CLIENTS_SERVICE_HOST || 'client',
          port: parseInt(process.env.CLIENTS_SERVICE_PORT || '3002', 10) || 3002,
        },
      },
      {
        name: 'PROJECTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.PROJECTS_SERVICE_HOST || 'projects',
          port: parseInt(process.env.PROJECTS_SERVICE_PORT || '3003', 10) || 3003,
        },
      },
      {
        name: 'RESOURCES_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.RESOURCES_SERVICE_HOST || 'resources',
          port: parseInt(process.env.RESOURCES_SERVICE_PORT || '3005', 10) || 3005,
        },
      },
    ]),
  ],
  controllers: [GlobalController],
  providers: [GlobalService],
  exports: [GlobalService],
})
export class GlobalModule {}
