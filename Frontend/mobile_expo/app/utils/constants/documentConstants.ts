import { DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';

// Types de filtres disponibles
export enum FilterType {
  TYPE = 'type',
  STATUS = 'status',
  DATE = 'date'
}

// Types de documents pour le filtre
export const documentTypes: DocumentType[] = [
  DocumentType.DEVIS,
  DocumentType.FACTURE,
  DocumentType.BON_DE_COMMANDE,
  DocumentType.BON_DE_LIVRAISON,
  DocumentType.FICHE_TECHNIQUE,
  DocumentType.PHOTO_CHANTIER,
  DocumentType.PLAN,
  DocumentType.AUTRE
];

// Statuts de documents pour le filtre
export const documentStatuses: DocumentStatus[] = [
  DocumentStatus.BROUILLON,
  DocumentStatus.EN_ATTENTE,
  DocumentStatus.VALIDE,
  DocumentStatus.REFUSE,
  DocumentStatus.ANNULE
];

// Filtres de date
export const dateFilters = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: '7 derniers jours' },
  { id: 'month', label: '30 derniers jours' },
  { id: 'year', label: 'Cette année' }
];
