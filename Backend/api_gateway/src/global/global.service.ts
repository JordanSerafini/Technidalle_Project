import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GlobalService {
  private readonly logger = new Logger(GlobalService.name);

  constructor(
    @Inject('CLIENTS_SERVICE') private readonly clientsService: ClientProxy,
    @Inject('PROJECTS_SERVICE') private readonly projectsService: ClientProxy,
    @Inject('RESOURCES_SERVICE') private readonly resourcesService: ClientProxy,
  ) {}

  async search(searchQuery: string) {
    if (!searchQuery || searchQuery.trim() === '') {
      return {
        clients: [],
        projects: [],
        materials: [],
      };
    }

    // Log pour le débogage
    this.logger.log(`Recherche globale démarrée avec: "${searchQuery}"`);

    // Exécuter les recherches en parallèle pour de meilleures performances
    const [clients, projects, materials] = await Promise.all([
      this.searchClients(searchQuery),
      this.searchProjects(searchQuery),
      this.searchMaterials(searchQuery),
    ]);

    // Log des résultats pour le débogage
    this.logger.log(
      `Résultats de recherche - Clients: ${clients.length}, Projets: ${projects.length}, Matériaux: ${materials.length}`,
    );

    return {
      clients,
      projects,
      materials,
    };
  }

  private async searchClients(searchQuery: string) {
    try {
      const result = await firstValueFrom(
        this.clientsService.send({ cmd: 'get_all_clients' }, { searchQuery }),
      );
      this.logger.log(`Service clients a retourné ${result.length} résultats`);
      return result;
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des clients:', error);
      return [];
    }
  }

  private async searchProjects(searchQuery: string) {
    try {
      const result = await firstValueFrom(
        this.projectsService.send({ cmd: 'get_all_projects' }, { searchQuery }),
      );
      this.logger.log(`Service projets a retourné ${result.length} résultats`);
      return result;
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des projets:', error);
      return [];
    }
  }

  private async searchMaterials(searchQuery: string) {
    try {
      const result = await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'get_all_materials' },
          { searchQuery },
        ),
      );
      this.logger.log(
        `Service matériaux a retourné ${result.length} résultats`,
      );
      return result;
    } catch (error) {
      this.logger.error('Erreur lors de la recherche des matériaux:', error);
      return [];
    }
  }
}
