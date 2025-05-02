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
}
