import { Module } from '@nestjs/common';
import {
  ClientsModule as NestClientsModule,
  Transport,
} from '@nestjs/microservices';
import { EventsController } from './events.controller';

@Module({
  imports: [
    NestClientsModule.register([
      {
        name: 'PLANNING_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'planning',
          port: 3007,
        },
      },
    ]),
  ],
  controllers: [EventsController],
})
export class EventsModule {}
