import { Controller, Logger } from '@nestjs/common';

@Controller('emails')
export class EmailsController {
  private readonly logger = new Logger(EmailsController.name);

  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  async getEmails() {
    return this.emailsService.getEmails();
  }
}
