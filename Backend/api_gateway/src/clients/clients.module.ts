import { Module } from '@nestjs/common';
import {
  ClientsModule as NestClientsModule,
  Transport,
} from '@nestjs/microservices';
import { ClientsController } from './clients.controller';

@Module({
  imports: [
    NestClientsModule.register([
      {
        name: 'CLIENTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'client',
          port: 3002,
        },
      },
    ]),
  ],
  controllers: [ClientsController],
})
export class ClientsModule {}
