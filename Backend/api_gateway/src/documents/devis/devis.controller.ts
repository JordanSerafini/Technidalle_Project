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
  Res,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  DevisWithLines,
  CreateDevisDto,
} from '../../interfaces/devis.interface';
import { CreateProjectDto } from '../../interfaces/project.interface';
import { Response } from 'express';
import axios from 'axios';

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

  @Get(':id/pdf')
  async generateDevisPdf(
    @Param('id') id: number,
    @Res() res: Response,
    @Query('sendEmail') sendEmail?: string,
  ): Promise<void> {
    try {
      console.log(`[API Gateway] Génération du PDF pour le devis ${id}`);

      // Construire l'URL
      let url = `http://documents:3004/devis/${id}/pdf`;
      if (sendEmail === 'true') {
        url += '?sendEmail=true';
        console.log(`[API Gateway] Avec envoi d'email, URL: ${url}`);
      }

      console.log(`[API Gateway] Envoi de la requête vers: ${url}`);

      try {
        // Récupérer le PDF depuis le service de documents
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'arraybuffer', // Important pour les données binaires
          timeout: 30000, // 30 secondes de timeout
        });

        console.log(
          `[API Gateway] Réponse reçue du service documents, status: ${response.status}, taille: ${response.data.length} octets`,
        );

        // Configurer les en-têtes pour le PDF
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Length': response.data.length,
          'Content-Disposition': `attachment; filename=devis_${id}.pdf`,
        });

        // Envoyer le PDF au client
        res.send(response.data);
        console.log(`[API Gateway] PDF envoyé au client avec succès`);
      } catch (axiosError) {
        console.error(`[API Gateway] Erreur Axios:`, axiosError.message);
        if (axiosError.response) {
          console.error(`[API Gateway] Status: ${axiosError.response.status}`);
          console.error(
            `[API Gateway] Message: ${axiosError.response.statusText}`,
          );
          console.error(`[API Gateway] Headers:`, axiosError.response.headers);
        } else if (axiosError.request) {
          console.error(
            `[API Gateway] Pas de réponse reçue:`,
            axiosError.request,
          );
        }
        throw new HttpException(
          'Erreur lors de la communication avec le service de documents',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      console.error(
        `[API Gateway] Erreur lors de la génération du PDF pour le devis ${id}:`,
        error.message || error,
      );

      throw new HttpException(
        "Erreur lors de la génération ou de l'envoi du PDF",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
