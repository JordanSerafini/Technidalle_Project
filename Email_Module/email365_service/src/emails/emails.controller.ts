/* eslint-disable */
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
    const data: { value: EmailMessage[] } = await this.emailsService.getEmails(
      userId,
      {
        filter,
        select,
        orderby,
        top,
      },
    );
    return data.value;
  }

  @Get('users/:userId/dailySummary')
  async getDailySummary(@Param('userId') userId: string): Promise<string> {
    return this.emailsService.dailySummary(userId);
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

  @Get('users/:userId/mailFolders')
  async getMailFolders(@Param('userId') userId: string) {
    return this.emailsService.getMailFolders(userId);
  }

  @Get('users/:userId/mailFolders/:folderId/messages')
  async getMessagesFromFolder(
    @Param('userId') userId: string,
    @Param('folderId') folderId: string,
    @Query('filter') filter?: string,
    @Query('select') select?: string,
    @Query('orderby') orderby?: string,
    @Query('top') top?: number,
  ) {
    return this.emailsService.getMessagesFromFolder(userId, folderId, {
      filter,
      select,
      orderby,
      top,
    });
  }

  @Post('users/:userId/mailFolders')
  async createMailFolder(
    @Param('userId') userId: string,
    @Body() folderData: { displayName: string; parentFolderId?: string },
  ) {
    return this.emailsService.createMailFolder(userId, folderData);
  }

  @Delete('users/:userId/mailFolders/:folderId')
  async deleteMailFolder(
    @Param('userId') userId: string,
    @Param('folderId') folderId: string,
  ) {
    return this.emailsService.deleteMailFolder(userId, folderId);
  }

  @Post('users/:userId/messages/:messageId/move')
  async moveMessage(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: { destinationId: string },
  ) {
    return this.emailsService.moveMessage(
      userId,
      messageId,
      body.destinationId,
    );
  }

  @Post('users/:userId/messages/:messageId/copy')
  async copyMessage(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: { destinationId: string },
  ) {
    return this.emailsService.copyMessage(
      userId,
      messageId,
      body.destinationId,
    );
  }

  @Patch('users/:userId/messages/:messageId/read')
  async markAsRead(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: { isRead: boolean },
  ) {
    return this.emailsService.markAsRead(userId, messageId, body.isRead);
  }

  @Get('users/:userId/messages/:messageId/attachments')
  async getAttachments(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.emailsService.getAttachments(userId, messageId);
  }

  @Get('users/:userId/messages/:messageId/attachments/:attachmentId/value')
  async downloadAttachment(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.emailsService.downloadAttachment(
      userId,
      messageId,
      attachmentId,
    );
  }

  @Post('users/:userId/messages/:messageId/send')
  async sendDraft(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.emailsService.sendDraft(userId, messageId);
  }

  @Patch('users/:userId/mailFolders/:folderId')
  async updateMailFolder(
    @Param('userId') userId: string,
    @Param('folderId') folderId: string,
    @Body() updateData: { displayName?: string },
  ) {
    return this.emailsService.updateMailFolder(userId, folderId, updateData);
  }

  @Patch('users/:userId/messages/:messageId/flag')
  async addFlag(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: { flag: any },
  ) {
    return this.emailsService.addFlag(userId, messageId, body.flag);
  }

  @Patch('users/:userId/messages/:messageId/importance')
  async setImportance(
    @Param('userId') userId: string,
    @Param('messageId') messageId: string,
    @Body() body: { importance: 'Low' | 'Normal' | 'High' },
  ) {
    return this.emailsService.setImportance(userId, messageId, body.importance);
  }
}
