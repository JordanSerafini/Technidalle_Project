import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { ResourcesModule } from './resources/resources.module';
import { GlobalModule } from './global/global.module';
import { EventsModule } from './events/events.module';
import { DevisModule } from './documents/devis/devis.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ClientsModule,
    ProjectsModule,
    ResourcesModule,
    GlobalModule,
    DocumentsModule,
    DevisModule,
    EventsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
