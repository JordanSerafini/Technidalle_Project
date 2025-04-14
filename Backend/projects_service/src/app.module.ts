import { Module } from '@nestjs/common';

import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ProjectsModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
