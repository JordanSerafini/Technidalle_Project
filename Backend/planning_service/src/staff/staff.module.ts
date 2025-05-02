import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '../prisma/prisma.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'PROJECTS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'projects',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
