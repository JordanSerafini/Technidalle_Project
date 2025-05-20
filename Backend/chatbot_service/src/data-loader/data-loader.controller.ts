import { Controller, Post, Get, Logger } from '@nestjs/common';
import { DataLoaderService } from './data-loader.service';

@Controller('data-loader')
export class DataLoaderController {
  private readonly logger = new Logger(DataLoaderController.name);

  constructor(private readonly dataLoaderService: DataLoaderService) {}

  @Post('load-all')
  async loadAllData() {
    this.logger.log('Chargement manuel complet des données déclenché');
    await this.dataLoaderService.loadAllData();
    return { success: true, message: 'Chargement complet des données terminé' };
  }

  @Get('status')
  getStatus() {
    return { status: 'Service de chargement des données prêt' };
  }

  @Post('load-projects')
  async loadProjects() {
    this.logger.log('Chargement manuel des projets déclenché');
    await this.dataLoaderService.loadProjects();
    return { success: true, message: 'Chargement des projets terminé' };
  }

  @Post('load-clients')
  async loadClients() {
    this.logger.log('Chargement manuel des clients déclenché');
    await this.dataLoaderService.loadClients();
    return { success: true, message: 'Chargement des clients terminé' };
  }

  @Post('load-staff')
  async loadStaff() {
    this.logger.log('Chargement manuel du personnel déclenché');
    await this.dataLoaderService.loadStaff();
    return { success: true, message: 'Chargement du personnel terminé' };
  }

  @Post('load-documents')
  async loadDocuments() {
    this.logger.log('Chargement manuel des documents déclenché');
    await this.dataLoaderService.loadDocuments();
    return { success: true, message: 'Chargement des documents terminé' };
  }

  @Post('load-project-stages')
  async loadProjectStages() {
    this.logger.log('Chargement manuel des étapes de projet déclenché');
    await this.dataLoaderService.loadProjectStages();
    return {
      success: true,
      message: 'Chargement des étapes de projet terminé',
    };
  }

  @Post('load-materials')
  async loadMaterials() {
    this.logger.log('Chargement manuel des matériaux déclenché');
    await this.dataLoaderService.loadMaterials();
    return { success: true, message: 'Chargement des matériaux terminé' };
  }

  @Post('load-events')
  async loadEvents() {
    this.logger.log('Chargement manuel des événements déclenché');
    await this.dataLoaderService.loadEvents();
    return { success: true, message: 'Chargement des événements terminé' };
  }

  @Post('load-site-reports')
  async loadSiteReports() {
    this.logger.log('Chargement manuel des rapports de chantier déclenché');
    await this.dataLoaderService.loadSiteReports();
    return {
      success: true,
      message: 'Chargement des rapports de chantier terminé',
    };
  }

  @Post('load-tasks')
  async loadTasks() {
    this.logger.log('Chargement manuel des tâches déclenché');
    await this.dataLoaderService.loadTasks();
    return { success: true, message: 'Chargement des tâches terminé' };
  }
}
