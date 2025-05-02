import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StaffService } from './staff.service';

@Controller()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @MessagePattern({ cmd: 'get_staff_daily_schedule' })
  getDailySchedule(@Payload() data: { id: string }) {
    // TODO: Valider l'ID
    return this.staffService.getDailySchedule(data.id);
  }

  @MessagePattern({ cmd: 'get_staff_weekly_schedule' })
  getWeeklySchedule(@Payload() data: { id: string; date?: string }) {
    // TODO: Valider l'ID et la date
    return this.staffService.getWeeklySchedule(data.id, data.date);
  }

  @MessagePattern({ cmd: 'get_events_by_staff' })
  getEventsByStaff(@Payload() data: { staffId: number }) {
    return this.staffService.getEventsByStaff(data.staffId);
  }

  @MessagePattern({ cmd: 'get_assignments_by_staff' })
  getAssignmentsByStaff(@Payload() data: { staffId: number }) {
    return this.staffService.getAssignmentsByStaff(data.staffId);
  }

  @MessagePattern({ cmd: 'assign_staff_to_project' })
  assignStaffToProject(
    @Payload()
    data: {
      projectId: number;
      staffId: number;
      stageId?: number;
      roleDescription?: string;
      startDate: string;
      endDate?: string;
      hoursPlanned?: number;
    },
  ) {
    return this.staffService.assignStaffToProject(data);
  }

  @MessagePattern({ cmd: 'update_staff_assignment' })
  updateStaffAssignment(
    @Payload()
    data: {
      id: number;
      roleDescription?: string;
      startDate?: string;
      endDate?: string;
      hoursPlanned?: number;
      hoursWorked?: number;
      stageId?: number;
    },
  ) {
    return this.staffService.updateStaffAssignment(data);
  }

  @MessagePattern({ cmd: 'remove_staff_assignment' })
  removeStaffAssignment(@Payload() data: { id: number }) {
    return this.staffService.removeStaffAssignment(data.id);
  }

  @MessagePattern({ cmd: 'debug_staff_assignments' })
  debugStaffAssignments(@Payload() data: { staffId: number }) {
    return this.staffService.debugStaffAssignments(data.staffId);
  }
}
