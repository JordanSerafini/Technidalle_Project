// Types de filtres disponibles
export enum FilterType {
  TYPE = 'type',
  CITY = 'city',
  STATUS = 'status',
  LAST_ORDER = 'lastOrder',
}

// Interface pour les options de fetch étendues
export interface ExtendedFetchOptions {
  limit?: number;
  offset?: number;
  searchQuery?: string;
  typeFilter?: string;
  cityFilter?: string;
  statusFilter?: string;
  lastOrderFilter?: string;
}

// Ajouter un export par défaut pour résoudre l'erreur d'Expo Router
export default function ClientFiltersExport() {
  return null;
} 