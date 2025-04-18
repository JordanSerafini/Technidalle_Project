import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DevisController } from './devis/devis.controller';
import { DevisService } from './devis/devis.service';
import { PdfGeneratorModule } from './pdf-generator/pdf-generator.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [PrismaModule, PdfGeneratorModule, EmailModule],
  controllers: [AppController, DevisController],
  providers: [AppService, DevisService],
})
export class AppModule {}
