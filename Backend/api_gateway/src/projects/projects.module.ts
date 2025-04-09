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
          host: '0.0.0.0',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
