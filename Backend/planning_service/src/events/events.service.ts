import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, events, event_type } from '@prisma/client';

export interface CreateEventDto {
  title: string;
  description?: string;
  event_type: event_type;
  start_date: Date;
  end_date: Date;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  event_type?: event_type;
  start_date?: Date;
  end_date?: Date;
  all_day?: boolean;
  location?: string;
  project_id?: number;
  staff_id?: number;
  client_id?: number;
  status?: string;
  color?: string;
}

export interface EventQueryParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  staffId?: string;
  clientId?: string;
}

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: EventQueryParams): Promise<events[]> {
    const { startDate, endDate, projectId, staffId, clientId } = params;

    const where: Prisma.eventsWhereInput = {};

    // Filtrage par dates
    if (startDate || endDate) {
      if (startDate) {
        where.start_date = {
          gte: new Date(startDate),
        };
      }

      if (endDate) {
        where.end_date = {
          lte: new Date(endDate),
        };
      }
    }

    // Filtrage par projet
    if (projectId) {
      where.project_id = parseInt(projectId);
    }

    // Filtrage par personnel
    if (staffId) {
      where.staff_id = parseInt(staffId);
    }

    // Filtrage par client
    if (clientId) {
      where.client_id = parseInt(clientId);
    }

    return await this.prisma.$transaction(async (tx) => {
      return await tx.events.findMany({
        where,
        orderBy: { start_date: 'asc' },
        include: {
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
            },
          },
        },
      });
    });
  }

  async findOne(id: number): Promise<events | null> {
    return await this.prisma.$transaction(async (tx) => {
      return await tx.events.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
            },
          },
        },
      });
    });
  }

  async create(createEventDto: CreateEventDto): Promise<events> {
    return await this.prisma.$transaction(async (tx) => {
      return await tx.events.create({
        data: {
          ...createEventDto,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    });
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<events> {
    return await this.prisma.$transaction(async (tx) => {
      return await tx.events.update({
        where: { id },
        data: {
          ...updateEventDto,
          updated_at: new Date(),
        },
      });
    });
  }

  async remove(id: number): Promise<events> {
    return await this.prisma.$transaction(async (tx) => {
      return await tx.events.delete({
        where: { id },
      });
    });
  }
}
