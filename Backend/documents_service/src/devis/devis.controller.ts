import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DevisService } from './devis.service';
import { CreateDevisDto, DevisWithLines } from '../interfaces/devis.interface';

@Controller()
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @MessagePattern({ cmd: 'create_devis' })
  async createDevis(data: CreateDevisDto): Promise<DevisWithLines> {
    try {
      return await this.devisService.createDevis(data);
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
      throw error;
    }
  }

  @MessagePattern({ cmd: 'get_devis_by_id' })
  async getDevisById(data: { id: number }): Promise<DevisWithLines | null> {
    try {
      return await this.devisService.getDevisById(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du devis ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'get_all_devis' })
  async getAllDevis(data?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
    clientId?: number;
    projectId?: number;
  }): Promise<DevisWithLines[]> {
    try {
      return await this.devisService.getAllDevis(
        data?.limit,
        data?.offset,
        data?.searchQuery,
        data?.clientId,
        data?.projectId,
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      return [];
    }
  }

  @MessagePattern({ cmd: 'update_devis' })
  async updateDevis(data: {
    id: number;
    devisDto: CreateDevisDto;
  }): Promise<DevisWithLines | null> {
    try {
      return await this.devisService.updateDevis(data.id, data.devisDto);
    } catch (error) {
      console.error(
        `Erreur lors de la mise à jour du devis ${data.id}:`,
        error,
      );
      return null;
    }
  }

  @MessagePattern({ cmd: 'delete_devis' })
  async deleteDevis(data: { id: number }): Promise<boolean> {
    try {
      return await this.devisService.deleteDevis(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la suppression du devis ${data.id}:`,
        error,
      );
      return false;
    }
  }

  @MessagePattern({ cmd: 'convert_devis_to_facture' })
  async convertDevisToFacture(data: {
    id: number;
  }): Promise<DevisWithLines | null> {
    try {
      return await this.devisService.convertDevisToFacture(data.id);
    } catch (error) {
      console.error(
        `Erreur lors de la conversion du devis ${data.id} en facture:`,
        error,
      );
      return null;
    }
  }
}
