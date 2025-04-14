import { Module } from '@nestjs/common';
import {
  ClientsModule as NestClientsModule,
  Transport,
} from '@nestjs/microservices';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [
    NestClientsModule.register([
      {
        name: 'DOCUMENTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'documents',
          port: 3004,
        },
      },
    ]),
  ],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
