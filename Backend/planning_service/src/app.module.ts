import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { StaffModule } from './staff/staff.module';

@Module({
  imports: [PrismaModule, EventsModule, StaffModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
