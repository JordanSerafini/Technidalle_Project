import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { DevisController } from './devis/devis.controller';
import { DevisService } from './devis/devis.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, DevisController],
  providers: [AppService, DevisService],
})
export class AppModule {}
