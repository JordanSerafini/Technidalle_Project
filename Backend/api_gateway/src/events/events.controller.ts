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
}
