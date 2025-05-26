import { Module } from '@nestjs/common';
import { EmailsModule } from './emails/emails.module';
import { ConfigModule } from '@nestjs/config';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    EmailsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WhatsappModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
