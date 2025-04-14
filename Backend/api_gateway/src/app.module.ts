import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { ResourcesModule } from './resources/resources.module';
import { GlobalModule } from './global/global.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ClientsModule,
    ProjectsModule,
    ResourcesModule,
    GlobalModule,
    DocumentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
