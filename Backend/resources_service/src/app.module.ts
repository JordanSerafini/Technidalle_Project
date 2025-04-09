import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MaterialsModule } from './materials/materials.module';
import { ProjectMaterialsModule } from './project-materials/project-materials.module';
import { ProjectStaffModule } from './project-staff/project-staff.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MaterialsModule,
    ProjectMaterialsModule,
    ProjectStaffModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
