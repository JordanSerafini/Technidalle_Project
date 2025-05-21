import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatbotService {
  constructor() {}

  async getHealth(): Promise<{ status: string }> {
    return { status: 'ok' };
  }
}
