import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  EventsService,
  CreateEventDto,
  UpdateEventDto,
  EventQueryParams,
} from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // --- Handlers Microservice pour l'API Gateway ---

  @MessagePattern({ cmd: 'get_all_events' })
  async getAllEvents(@Payload() query: EventQueryParams) {
    return this.eventsService.findAll(query);
  }

  @MessagePattern({ cmd: 'get_event_by_id' })
  async getEventById(@Payload() data: { id: number }) {
    return this.eventsService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_event' })
  async createEvent(@Payload() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @MessagePattern({ cmd: 'update_event' })
  async updateEvent(@Payload() data: { id: number; eventDto: UpdateEventDto }) {
    return this.eventsService.update(data.id, data.eventDto);
  }

  @MessagePattern({ cmd: 'delete_event' })
  async deleteEvent(@Payload() data: { id: number }) {
    return this.eventsService.remove(data.id);
  }

  @MessagePattern({ cmd: 'move_event' })
  async moveEvent(
    @Payload() data: { eventId: number; newStartDate: Date; newEndDate: Date },
  ) {
    const { eventId, newStartDate, newEndDate } = data;
    const event = await this.eventsService.findOne(eventId);

    if (!event) {
      return null;
    }

    return this.eventsService.update(eventId, {
      start_date: new Date(newStartDate),
      end_date: new Date(newEndDate),
    });
  }

  @MessagePattern({ cmd: 'get_events_by_project' })
  async getEventsByProject(@Payload() data: { projectId: number }) {
    const query: EventQueryParams = {
      projectId: data.projectId.toString(),
    };
    return this.eventsService.findAll(query);
  }

  @MessagePattern({ cmd: 'get_events_by_staff' })
  async getEventsByStaff(@Payload() data: { staffId: number }) {
    const query: EventQueryParams = {
      staffId: data.staffId.toString(),
    };
    return this.eventsService.findAll(query);
  }

  @MessagePattern({ cmd: 'get_events_by_client' })
  async getEventsByClient(@Payload() data: { clientId: number }) {
    const query: EventQueryParams = {
      clientId: data.clientId.toString(),
    };
    return this.eventsService.findAll(query);
  }
}
