import { Controller, Post, Get, Body, Logger, Query } from '@nestjs/common';
import { DataLoaderService } from './data-loader.service';

interface LoadOptionsDto {
  forceReload?: boolean;
  batchSize?: number;
}

@Controller('data-loader')
export class DataLoaderController {
  private readonly logger = new Logger(DataLoaderController.name);

  constructor(private readonly dataLoaderService: DataLoaderService) {}

  @Post('load-all')
  async loadAllData(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel complet des données déclenché');
    await this.dataLoaderService.loadAllData(options);
    return { 
      success: true, 
      message: 'Chargement complet des données terminé',
      options: options 
    };
  }

  @Post('load-projects')
  async loadProjects(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des projets déclenché');
    await this.dataLoaderService.loadProjects(options);
    return { 
      success: true, 
      message: 'Chargement des projets terminé',
      options: options 
    };
  }

  @Post('load-clients')
  async loadClients(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des clients déclenché');
    await this.dataLoaderService.loadClients(options);
    return { 
      success: true, 
      message: 'Chargement des clients terminé',
      options: options 
    };
  }

  @Post('load-staff')
  async loadStaff(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel du personnel déclenché');
    await this.dataLoaderService.loadStaff(options);
    return { 
      success: true, 
      message: 'Chargement du personnel terminé',
      options: options 
    };
  }

  @Post('load-documents')
  async loadDocuments(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des documents déclenché');
    await this.dataLoaderService.loadDocuments(options);
    return { 
      success: true, 
      message: 'Chargement des documents terminé',
      options: options 
    };
  }

  @Post('load-project-stages')
  async loadProjectStages(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des étapes de projet déclenché');
    await this.dataLoaderService.loadProjectStages(options);
    return { 
      success: true, 
      message: 'Chargement des étapes de projet terminé',
      options: options 
    };
  }

  @Post('load-materials')
  async loadMaterials(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des matériaux déclenché');
    await this.dataLoaderService.loadMaterials(options);
    return { 
      success: true, 
      message: 'Chargement des matériaux terminé',
      options: options 
    };
  }

  @Post('load-events')
  async loadEvents(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des événements déclenché');
    await this.dataLoaderService.loadEvents(options);
    return { 
      success: true, 
      message: 'Chargement des événements terminé',
      options: options 
    };
  }

  @Post('load-site-reports')
  async loadSiteReports(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des rapports de chantier déclenché');
    await this.dataLoaderService.loadSiteReports(options);
    return { 
      success: true, 
      message: 'Chargement des rapports de chantier terminé',
      options: options 
    };
  }

  @Post('load-tasks')
  async loadTasks(@Body() options: LoadOptionsDto = {}) {
    this.logger.log('Chargement manuel des tâches déclenché');
    await this.dataLoaderService.loadTasks(options);
    return { 
      success: true, 
      message: 'Chargement des tâches terminé',
      options: options 
    };
  }

  // Endpoint pour vérifier l'état des embeddings
  @Get('status')
  async getEmbeddingStatus() {
    const status = await this.dataLoaderService.getEmbeddingStatus();
    return {
      success: true,
      data: status
    };
  }
}
