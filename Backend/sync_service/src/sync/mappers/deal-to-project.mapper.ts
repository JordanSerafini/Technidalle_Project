import { BaseMapper } from './index';
import { ProjectAPP } from '../../interfaces/projects/projectAPP';

// Définition de l'enum ProjectStatus
export enum ProjectStatus {
  PROSPECT = 'prospect',
  DEVIS_EN_COURS = 'devis_en_cours',
  DEVIS_ACCEPTE = 'devis_accepte',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  ANNULE = 'annule',
}

interface Client {
  company_name?: string;
  firstname: string;
  lastname: string;
  email: string;
  customer_id?: string;
}

interface Deal {
  Id: string;
  Caption?: string;
  Notes?: string;
  DealState?: number;
  xx_DateDebut?: Date;
  xx_DateFin?: Date;
  PredictedDuration?: number;
  PredictedCosts?: number;
  AccomplishedCosts?: number;
  PredictedGrossMargin?: number;
  xx_Client?: string;
}

export class DealToProjectMapper extends BaseMapper<Deal, Partial<ProjectAPP>> {
  map(
    deal: Deal,
    clientId?: number,
    existingProject?: Partial<ProjectAPP>,
  ): Partial<ProjectAPP> {
    const projectData: Partial<ProjectAPP> = {
      ...existingProject,
      external_ebp_id: deal.Id,
      name: deal.Caption || 'Projet sans nom',
      reference: deal.Id,
      description: deal.Notes || existingProject?.description,
      client_id:
        clientId !== undefined ? String(clientId) : existingProject?.client_id,
      status: this.mapDealStateToProjectStatus(deal.DealState),
      start_date: deal.xx_DateDebut
        ? new Date(deal.xx_DateDebut)
        : existingProject?.start_date,
      end_date: deal.xx_DateFin
        ? new Date(deal.xx_DateFin)
        : existingProject?.end_date,
      estimated_duration:
        deal.PredictedDuration !== undefined && deal.PredictedDuration !== null
          ? Number(deal.PredictedDuration)
          : existingProject?.estimated_duration,
      budget:
        deal.PredictedCosts !== undefined && deal.PredictedCosts !== null
          ? Number(deal.PredictedCosts)
          : existingProject?.budget,
      actual_cost:
        deal.AccomplishedCosts !== undefined && deal.AccomplishedCosts !== null
          ? Number(deal.AccomplishedCosts)
          : existingProject?.actual_cost,
      margin:
        deal.PredictedGrossMargin !== undefined &&
        deal.PredictedGrossMargin !== null
          ? Number(deal.PredictedGrossMargin)
          : existingProject?.margin,
      notes: deal.Notes || existingProject?.notes,
    };

    return this.cleanUndefinedProperties(projectData);
  }

  extractClientInfo(deal: Deal): Partial<Client> {
    const clientInfo: Partial<Client> = {};
    const ebpClientRef = deal.xx_Client as string;

    if (!ebpClientRef) {
      clientInfo.company_name = 'Client EBP Inconnu ' + Date.now();
      clientInfo.firstname = 'N/A';
      clientInfo.lastname = 'N/A';
      clientInfo.email = `unknown-${Date.now()}@example.com`;
      return clientInfo;
    }

    clientInfo.company_name = ebpClientRef;
    clientInfo.firstname = 'À contacter';
    clientInfo.lastname = '(via EBP)';
    clientInfo.email = `${ebpClientRef.toLowerCase().replace(/\W+/g, '.').substring(0, 50)}@ebp.example.com`;

    return clientInfo;
  }

  private mapDealStateToProjectStatus(dealState?: number): ProjectStatus {
    if (dealState === undefined || dealState === null)
      return ProjectStatus.PROSPECT;

    switch (dealState) {
      case 0:
        return ProjectStatus.PROSPECT;
      case 1:
        return ProjectStatus.DEVIS_EN_COURS;
      case 2:
        return ProjectStatus.DEVIS_ACCEPTE;
      case 3:
        return ProjectStatus.EN_COURS;
      case 4:
        return ProjectStatus.TERMINE;
      case 5:
        return ProjectStatus.ANNULE;
      // Ajoutez d'autres cas ici si vous connaissez les correspondances pour d'autres états EBP
      // Exemple: case 6: return ProjectStatus.EN_PREPARATION;
      // Exemple: case 8: return ProjectStatus.ANNULE; // ou un autre statut pertinent
      default:
        console.warn(
          `État d'affaire EBP inconnu: ${dealState}, affectation à 'PROSPECT'. Veuillez ajouter un mappage spécifique si nécessaire.`, // Ajout d'une note pour l'utilisateur
        );
        return ProjectStatus.PROSPECT;
    }
  }

  // Méthode statique pour avoir une instance unique
  private static instance: DealToProjectMapper;

  static getInstance(): DealToProjectMapper {
    if (!DealToProjectMapper.instance) {
      DealToProjectMapper.instance = new DealToProjectMapper();
    }
    return DealToProjectMapper.instance;
  }

  // Méthodes statiques pour compatibilité avec le code existant
  static extractClientInfoFromDeal(deal: Deal): Partial<Client> {
    return DealToProjectMapper.getInstance().extractClientInfo(deal);
  }

  static toProjectEntity(
    deal: Deal,
    clientId?: number,
    existingProject?: Partial<ProjectAPP>,
  ): Partial<ProjectAPP> {
    return DealToProjectMapper.getInstance().map(
      deal,
      clientId,
      existingProject,
    );
  }
}
