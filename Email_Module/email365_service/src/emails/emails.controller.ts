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
  ) {
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
  ) {
    return this.emailsService.getMessage(userId, messageId);
  }

  @Post('users/:userId/sendMail')
  async sendMail(@Param('userId') userId: string, @Body() messageData: any) {
    return this.emailsService.sendMail(userId, messageData);
  }

  @Post('users/:userId/messages')
  async createDraft(@Param('userId') userId: string, @Body() messageData: any) {
    return this.emailsService.createDraft(userId, messageData);
  }

  @Patch('users/:userId/messages/:messageId')
  async updateDraft(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() updateData: any,
  ) {
    return this.emailsService.updateDraft(userId, messageId, updateData);
  }

  @Delete('users/:userId/messages/:messageId')
  async deleteMessage(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.emailsService.deleteMessage(userId, messageId);
  }
}
