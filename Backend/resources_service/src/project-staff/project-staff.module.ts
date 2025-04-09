import { Module } from '@nestjs/common';
import { ProjectStaffController } from './project-staff.controller';
import { ProjectStaffService } from './project-staff.service';

@Module({
  controllers: [ProjectStaffController],
  providers: [ProjectStaffService],
})
export class ProjectStaffModule {} 