import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule as ClientsFeaturesModule } from './clients/clients.module';

@Module({
  imports: [ClientsFeaturesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
