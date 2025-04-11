import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { ProjectsModule } from './projects/projects.module';
import { ResourcesModule } from './resources/resources.module';
import { GlobalModule } from './global/global.module';

@Module({
  imports: [ClientsModule, ProjectsModule, ResourcesModule, GlobalModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
