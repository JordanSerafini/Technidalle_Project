import {
  Controller,
  Logger,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailMessage, SendMailRequest } from './interfaces/email.interface';

@Controller('emails')
export class EmailsController {
  private readonly logger = new Logger(EmailsController.name);

  constructor(private readonly emailsService: EmailsService) {}

  @Get('users/:userId/messages')
  async getEmails(
    @Param('userId') userId: string,
    @Query('filter') filter?: string,
    @Query('select') select?: string,
    @Query('orderby') orderby?: string,
    @Query('top') top?: number,
  ): Promise<EmailMessage[]> {
    return this.emailsService.getEmails(userId, {
      filter,
      select,
      orderby,
      top,
    });
  }

  @Get('users/:userId/messages/:messageId')
  async getMessage(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
  ): Promise<EmailMessage> {
    return this.emailsService.getMessage(userId, messageId);
  }

  @Post('users/:userId/sendMail')
  async sendMail(
    @Param('userId') userId: string,
    @Body() request: SendMailRequest,
  ): Promise<void> {
    return this.emailsService.sendMail(userId, request);
  }

  @Post('users/:userId/messages')
  async createDraft(
    @Param('userId') userId: string,
    @Body() message: EmailMessage,
  ): Promise<EmailMessage> {
    return this.emailsService.createDraft(userId, message);
  }

  @Patch('users/:userId/messages/:messageId')
  async updateDraft(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() updateData: Partial<EmailMessage>,
  ): Promise<EmailMessage> {
    return this.emailsService.updateDraft(userId, messageId, updateData);
  }

  @Delete('users/:userId/messages/:messageId')
  async deleteMessage(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
  ): Promise<boolean> {
    return this.emailsService.deleteMessage(userId, messageId);
  }
}
