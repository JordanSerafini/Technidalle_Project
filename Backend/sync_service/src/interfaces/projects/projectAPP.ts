import { ProjectEBP } from './projectEBP';

export interface ProjectAPP {
  id?: number;
  external_ebp_id?: string;
  reference: string;
  name: string;
  description?: string | null;
  client_id?: string | null;
  address_id?: number | null;
  status?: string;
  start_date?: Date | null;
  end_date?: Date | null;
  estimated_duration?: number | null;
  budget?: number | null;
  actual_cost?: number | null;
  margin?: number | null;
  notes?: string | null;
  deal_id?: string | null;
  // Propriété pour conserver les données originales pendant la transformation
  constructionSite?: any;
}

export class ProjectMapper {
  static fromEBP(projectEBP: ProjectEBP): ProjectAPP {
    const { constructionSite } = projectEBP;

    return {
      external_ebp_id: constructionSite.Id,
      reference: constructionSite.Id,
      name: constructionSite.Caption,
      description: constructionSite.NotesClear,
      client_id: constructionSite.CustomerId,
      address_id: undefined, // À compléter lors de la synchronisation
      start_date: constructionSite.StartDate,
      end_date: constructionSite.EndDate,
      estimated_duration: constructionSite.PredictedDuration,
      budget: constructionSite.PredictedSales,
      actual_cost: constructionSite.AccomplishedSales,
      margin: constructionSite.PredictedGrossMargin,
      notes: constructionSite.Notes,
      deal_id: constructionSite.DealId || undefined,
      constructionSite: constructionSite,
    };
  }
}
