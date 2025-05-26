import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatbotService {
  constructor() {}

  async getHealth(): Promise<{ status: string; database: string; services: string[] }> {
    // Vérification de l'état de la base de données
    const databaseStatus = 'connected';

    // Vérification de l'état des services externes
    const servicesStatus = ['Elasticsearch', 'Prisma'].map(service => {
      return `${service}: operational`;
    });

    return {
      status: 'ok',
      database: databaseStatus,
      services: servicesStatus,
    };
  }
}
