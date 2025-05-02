import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  Event,
  CreateEventDto,
  UpdateEventDto,
  EventQueryParams,
  MoveEventParams,
} from '../interfaces/event.interface';

interface StaffSchedule {
  date?: string;
  weekOf?: string;
  staffId: string;
  chantiers?: any[];
  planning?: any;
}

@Controller('events')
export class EventsController {
  constructor(
    @Inject('PLANNING_SERVICE') private readonly planningService: ClientProxy,
  ) {}

  @Get()
  async getAllEvents(@Query() query: EventQueryParams): Promise<Event[]> {
    if (!this.planningService) {
      throw new HttpException(
        'Service de planification non disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    try {
      return await firstValueFrom(
        this.planningService.send({ cmd: 'get_all_events' }, query),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des événements:', error);
      throw new HttpException(
        'Erreur lors de la récupération des événements',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<Event> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'get_event_by_id' },
          { id: parseInt(id) },
        ),
      );
    } catch (error) {
      console.error("Erreur lors de la récupération de l'événement:", error);
      throw new HttpException(
        "Erreur lors de la récupération de l'événement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    try {
      return await firstValueFrom(
        this.planningService.send({ cmd: 'create_event' }, createEventDto),
      );
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      throw new HttpException(
        "Erreur lors de la création de l'événement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'update_event' },
          { id: parseInt(id), eventDto: updateEventDto },
        ),
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'événement:", error);
      throw new HttpException(
        "Erreur lors de la mise à jour de l'événement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'delete_event' },
          { id: parseInt(id) },
        ),
      );
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      throw new HttpException(
        "Erreur lors de la suppression de l'événement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('move')
  async moveEvent(@Body() moveEventParams: MoveEventParams): Promise<Event> {
    try {
      return await firstValueFrom(
        this.planningService.send({ cmd: 'move_event' }, moveEventParams),
      );
    } catch (error) {
      console.error("Erreur lors du déplacement de l'événement:", error);
      throw new HttpException(
        "Erreur lors du déplacement de l'événement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-project/:projectId')
  async getEventsByProject(
    @Param('projectId') projectId: string,
  ): Promise<Event[]> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'get_events_by_project' },
          { projectId: parseInt(projectId) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des événements du projet:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des événements du projet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-staff/:staffId')
  async getEventsByStaff(@Param('staffId') staffId: string): Promise<Event[]> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'get_events_by_staff' },
          { staffId: parseInt(staffId) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des événements du personnel:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des événements du personnel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('assignments/by-staff/:staffId')
  async getAssignmentsByStaff(@Param('staffId') staffId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'get_assignments_by_staff' },
          { staffId: parseInt(staffId) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des assignations du personnel:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des assignations du personnel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('assign-staff')
  async assignStaffToProject(
    @Body()
    assignmentData: {
      projectId: number;
      staffId: number;
      stageId?: number;
      roleDescription?: string;
      startDate: string;
      endDate?: string;
      hoursPlanned?: number;
    },
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'assign_staff_to_project' },
          assignmentData,
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de l'assignation du personnel au projet:",
        error,
      );
      throw new HttpException(
        "Erreur lors de l'assignation du personnel au projet",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('update-staff-assignment/:id')
  async updateStaffAssignment(
    @Param('id') id: string,
    @Body()
    updateData: {
      roleDescription?: string;
      startDate?: string;
      endDate?: string;
      hoursPlanned?: number;
      hoursWorked?: number;
      stageId?: number;
    },
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'update_staff_assignment' },
          { id: parseInt(id), ...updateData },
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de l'assignation du personnel:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la mise à jour de l'assignation du personnel",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('remove-staff-assignment/:id')
  async removeStaffAssignment(@Param('id') id: string): Promise<boolean> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'remove_staff_assignment' },
          { id: parseInt(id) },
        ),
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'assignation du personnel:",
        error,
      );
      throw new HttpException(
        "Erreur lors de la suppression de l'assignation du personnel",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('by-client/:clientId')
  async getEventsByClient(
    @Param('clientId') clientId: string,
  ): Promise<Event[]> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'get_events_by_client' },
          { clientId: parseInt(clientId) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des événements du client:',
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération des événements du client',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('staff/:staffId/schedule/today')
  async getStaffDailySchedule(
    @Param('staffId') staffId: string,
  ): Promise<StaffSchedule> {
    try {
      return await firstValueFrom(
        this.planningService.send<StaffSchedule>(
          { cmd: 'get_staff_daily_schedule' },
          { id: staffId },
        ),
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du planning journalier pour le personnel ${staffId}:`,
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération du planning journalier',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('staff/:staffId/schedule/week')
  async getStaffWeeklySchedule(
    @Param('staffId') staffId: string,
    @Query('date') date?: string,
  ): Promise<StaffSchedule> {
    try {
      return await firstValueFrom(
        this.planningService.send<StaffSchedule>(
          { cmd: 'get_staff_weekly_schedule' },
          { id: staffId, date: date },
        ),
      );
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du planning hebdomadaire pour le personnel ${staffId}:`,
        error,
      );
      throw new HttpException(
        'Erreur lors de la récupération du planning hebdomadaire',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('debug-staff-assignments/:staffId')
  async debugStaffAssignments(@Param('staffId') staffId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.planningService.send(
          { cmd: 'debug_staff_assignments' },
          { staffId: parseInt(staffId) },
        ),
      );
    } catch (error) {
      console.error(
        'Erreur lors du diagnostic des assignations du personnel:',
        error,
      );
      throw new HttpException(
        'Erreur lors du diagnostic des assignations du personnel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
