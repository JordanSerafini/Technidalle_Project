import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Get('search')
  async search(@Query('query') query: string) {
    if (!query || query.trim() === '') {
      throw new HttpException(
        'Le paramètre de recherche est requis',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.globalService.search(query);
    } catch (error) {
      console.error('Erreur lors de la recherche globale:', error);
      throw new HttpException(
        'Erreur lors de la recherche globale',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
