import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { ResourcesModule } from './resources/resources.module';
import { GlobalModule } from './global/global.module';
import { DocumentsModule } from './documents/documents.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ClientsModule,
    ProjectsModule,
    ResourcesModule,
    GlobalModule,
    DocumentsModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
