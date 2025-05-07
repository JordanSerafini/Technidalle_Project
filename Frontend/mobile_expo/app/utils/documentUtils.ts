import { DocumentType, DocumentStatus } from '@/app/utils/interfaces/document';

// Obtenir le nom de l'icône selon le type
export const getIconForType = (type: DocumentType) => {
  switch (type) {
    case DocumentType.DEVIS: return 'description';
    case DocumentType.FACTURE: return 'receipt';
    case DocumentType.BON_DE_COMMANDE: return 'shopping-cart';
    case DocumentType.BON_DE_LIVRAISON: return 'local-shipping';
    case DocumentType.FICHE_TECHNIQUE: return 'article';
    case DocumentType.PHOTO_CHANTIER: return 'photo-camera';
    case DocumentType.PLAN: return 'map';
    // TODO: Ajouter les cas pour AVOIR, ACOMPTE, SITUATION si nécessaire
    default: return 'insert-drive-file';
  }
};

export const formatDocumentType = (type: DocumentType) => {
  if (typeof type !== 'string') {
    return '';
  }
  return type.replace(/_/g, ' ');
};

export const formatDocumentStatus = (status: DocumentStatus | undefined | null) => {

   if (!status) {
    return '';
  }
  if (typeof status !== 'string') {
    return '';
  }
  return status.replace(/_/g, ' ');
};


export const formatMonthYear = (monthYear: string) => {
  const [month, year] = monthYear.split('/');
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
};

// Ajouter un export par défaut pour résoudre l'erreur d'Expo Router
export default function DocumentUtilsExport() {
  return null;
}