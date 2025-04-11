import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GlobalService {
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

    // Exécuter les recherches en parallèle pour de meilleures performances
    const [clients, projects, materials] = await Promise.all([
      this.searchClients(searchQuery),
      this.searchProjects(searchQuery),
      this.searchMaterials(searchQuery),
    ]);

    return {
      clients,
      projects,
      materials,
    };
  }

  private async searchClients(searchQuery: string) {
    try {
      return await firstValueFrom(
        this.clientsService.send({ cmd: 'get_all_clients' }, { searchQuery }),
      );
    } catch (error) {
      console.error('Erreur lors de la recherche des clients:', error);
      return [];
    }
  }

  private async searchProjects(searchQuery: string) {
    try {
      return await firstValueFrom(
        this.projectsService.send({ cmd: 'get_all_projects' }, { searchQuery }),
      );
    } catch (error) {
      console.error('Erreur lors de la recherche des projets:', error);
      return [];
    }
  }

  private async searchMaterials(searchQuery: string) {
    try {
      return await firstValueFrom(
        this.resourcesService.send(
          { cmd: 'get_all_materials' },
          { searchQuery },
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la recherche des matériaux:', error);
      return [];
    }
  }
}
