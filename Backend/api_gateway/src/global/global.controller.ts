import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Get('search')
  async search(@Query('searchQuery') searchQuery: string) {
    if (!searchQuery || searchQuery.trim() === '') {
      throw new HttpException(
        'Le paramètre de recherche est requis',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Nettoyer et normaliser la requête de recherche
      const normalizedQuery = searchQuery.trim();
      console.log(`Recherche globale avec requête: "${normalizedQuery}"`);

      return await this.globalService.search(normalizedQuery);
    } catch (error) {
      console.error('Erreur lors de la recherche globale:', error);
      throw new HttpException(
        'Erreur lors de la recherche globale',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
