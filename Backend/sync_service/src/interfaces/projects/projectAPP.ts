import { ProjectEBP } from './projectEBP';

export interface ProjectAPP {
  reference: string;
  name: string;
  description?: string;
  client_id: string;
  address_id?: string;
  start_date: Date;
  end_date: Date;
  budget: number;
  actual_cost: number;
  margin: number;
  notes?: string;
  // Propriété pour conserver les données originales pendant la transformation
  constructionSite?: any;
}

export class ProjectMapper {
  static fromEBP(projectEBP: ProjectEBP): ProjectAPP {
    const { constructionSite } = projectEBP;

    return {
      reference: constructionSite.Id,
      name: constructionSite.Caption,
      description: constructionSite.NotesClear,
      client_id: constructionSite.CustomerId,
      address_id: undefined, // À compléter lors de la synchronisation
      start_date: constructionSite.StartDate,
      end_date: constructionSite.EndDate,
      budget: constructionSite.PredictedSales,
      actual_cost: constructionSite.AccomplishedSales,
      margin: constructionSite.PredictedGrossMargin,
      notes: constructionSite.Notes,
      constructionSite: constructionSite,
    };
  }
}
