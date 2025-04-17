import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DevisController } from './devis.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROJECTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'projects',
          port: 3003,
        },
      },
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
  controllers: [DevisController],
})
export class DevisModule {}
