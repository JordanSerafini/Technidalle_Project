import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  DevisWithLines,
  CreateDevisDto,
} from '../../interfaces/devis.interface';
import { CreateProjectDto } from '../../interfaces/project.interface';

@Controller('devis')
export class DevisController {
  private readonly documentsService: ClientProxy;
  private readonly projectsService: ClientProxy;

  constructor(
    @Inject('DOCUMENTS_SERVICE') documentsService: ClientProxy,
    @Inject('PROJECTS_SERVICE') projectsService: ClientProxy,
  ) {
    this.documentsService = documentsService;
    this.projectsService = projectsService;
  }

  @Get()
  async getAllDevis(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('clientId') clientId?: number,
    @Query('projectId') projectId?: number,
  ): Promise<DevisWithLines[]> {
    try {
      return await firstValueFrom(
        this.documentsService.send(
          { cmd: 'get_all_devis' },
          { limit, offset, searchQuery, clientId, projectId },
        ),
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      throw new HttpException(
        'Erreur lors de la récupération des devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async getDevisById(@Param('id') id: number): Promise<DevisWithLines> {
    try {
      const devis = await firstValueFrom(
        this.documentsService.send({ cmd: 'get_devis_by_id' }, { id }),
      );
      if (!devis) {
        throw new HttpException('Devis non trouvé', HttpStatus.NOT_FOUND);
      }
      return devis;
    } catch (error) {
      console.error(`Erreur lors de la récupération du devis ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la récupération du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createDevis(
    @Body() createDevisDto: CreateDevisDto,
  ): Promise<DevisWithLines> {
    try {
      // Si pas de project_id, créer un projet automatiquement
      if (!createDevisDto.project_id && createDevisDto.client_id) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];

        // Créer un nouveau projet
        const projectDto: CreateProjectDto = {
          reference: `PRJ-${formattedDate}-C${createDevisDto.client_id}`,
          name: `projet_${formattedDate}_client${createDevisDto.client_id}`,
          clientId: createDevisDto.client_id,
          startDate: today.toISOString(),
          // Ajouter la relation clients pour connecter le client existant au projet
          clients: {
            connect: { id: createDevisDto.client_id },
          },
        };

        // Appeler le service de projets pour créer le projet
        const newProject = await firstValueFrom(
          this.projectsService.send({ cmd: 'create_project' }, projectDto),
        );

        // Assigner le nouveau project_id au devis
        createDevisDto.project_id = newProject.id;
      }

      return await firstValueFrom(
        this.documentsService.send({ cmd: 'create_devis' }, createDevisDto),
      );
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      throw new HttpException(
        'Erreur lors de la création du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async updateDevis(
    @Param('id') id: number,
    @Body() devisDto: CreateDevisDto,
  ): Promise<DevisWithLines> {
    try {
      // Si pas de project_id, créer un projet automatiquement
      if (!devisDto.project_id && devisDto.client_id) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];

        // Créer un nouveau projet
        const projectDto: CreateProjectDto = {
          reference: `PRJ-${formattedDate}-C${devisDto.client_id}`,
          name: `projet_${formattedDate}_client${devisDto.client_id}`,
          clientId: devisDto.client_id,
          startDate: today.toISOString(),
          // Ajouter la relation clients pour connecter le client existant au projet
          clients: {
            connect: { id: devisDto.client_id },
          },
        };

        // Appeler le service de projets pour créer le projet
        const newProject = await firstValueFrom(
          this.projectsService.send({ cmd: 'create_project' }, projectDto),
        );

        // Assigner le nouveau project_id au devis
        devisDto.project_id = newProject.id;
      }

      const devis = await firstValueFrom(
        this.documentsService.send({ cmd: 'update_devis' }, { id, devisDto }),
      );
      if (!devis) {
        throw new HttpException('Devis non trouvé', HttpStatus.NOT_FOUND);
      }
      return devis;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du devis ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la mise à jour du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async deleteDevis(@Param('id') id: number): Promise<boolean> {
    try {
      const result = await firstValueFrom(
        this.documentsService.send({ cmd: 'delete_devis' }, { id }),
      );
      if (!result) {
        throw new HttpException('Devis non trouvé', HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      console.error(`Erreur lors de la suppression du devis ${id}:`, error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la suppression du devis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/convert-to-facture')
  async convertDevisToFacture(
    @Param('id') id: number,
  ): Promise<DevisWithLines> {
    try {
      const result = await firstValueFrom(
        this.documentsService.send({ cmd: 'convert_devis_to_facture' }, { id }),
      );
      if (!result) {
        throw new HttpException('Devis non trouvé', HttpStatus.NOT_FOUND);
      }
      return result;
    } catch (error) {
      console.error(
        `Erreur lors de la conversion du devis ${id} en facture:`,
        error,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Erreur lors de la conversion du devis en facture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
