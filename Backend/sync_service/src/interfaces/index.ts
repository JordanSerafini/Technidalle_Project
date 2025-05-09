// Clients
export * from './clients/clientApp';
export * from './clients/clientEBP';

// Projects
export * from './projects/projectAPP';
export * from './projects/projectEBP';
export * from './projects/constructionSite';

// Items
export * from './items/itemAPP';
export * from './items/itemEBP';

// Deals
export * from './Deal/deal.interface';

// Documents
export * from './documents/documents.interface';

// Types d'entités
export enum EntityType {
  CLIENT = 'client',
  PROJECT = 'project',
  ITEM = 'item',
  DOCUMENT = 'document',
  DEAL = 'deal',
}

// Interface de base pour toutes les entités synchronisables
export interface SyncableEntity {
  id?: number | string;
  synced_at?: Date;
  synced_by_device_id?: string;
}

// Interface de mappage
export interface EntityMapper<EBP, APP> {
  fromEBP: (ebpEntity: EBP) => APP;
  toEBP?: (appEntity: APP) => Partial<EBP>;
}
