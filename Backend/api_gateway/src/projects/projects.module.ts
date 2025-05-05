import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProjectsController } from './projects.controller';

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
        name: 'CLIENTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'client',
          port: 3002,
        },
      },
    ]),
  ],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
