import { Client } from '@/app/utils/interfaces/client.interface';

// Types pour améliorer les performances
export interface FormattedClientData {
  displayName: string;
  secondaryDisplay: string;
  statusColor: string;
  displayStatus: string;
  hasRecentOrders: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  city: string | undefined;
}

// Cache pour les données clients formatées, avec clés de type string ou number
const clientDataCache = new Map<string | number, FormattedClientData>();

// Helper pour formater les données du client (optimisé avec cache)
export const formatClientData = (client: Client): FormattedClientData => {
  // Utiliser le cache si disponible
  if (client.id && clientDataCache.has(client.id)) {
    return clientDataCache.get(client.id)!;
  }
  
  // Nettoyer les valeurs de prénom et nom (éliminer les points seuls, etc.)
  const firstname = client.firstname?.trim();
  const lastname = client.lastname?.trim();
  const companyName = client.company_name?.trim();
  
  // Vérifier s'il s'agit d'un prénom seul sans nom
  const isFirstNameOnly = (firstname && firstname.length > 1 && (!lastname || lastname === '.' || lastname === '..'));
  
  // Gérer les différents cas pour l'affichage du nom
  let displayName = '';
  if (isFirstNameOnly) {
    displayName = firstname;
  } else if ((lastname && lastname !== '.' && lastname !== '..') || (firstname && firstname !== '.' && firstname !== '..')) {
    displayName = `${lastname || ''} ${firstname || ''}`.trim();
  } else if (companyName && companyName !== 'Particulier') {
    displayName = companyName;
  } else {
    displayName = 'Client sans nom';
  }
  
  // Déterminer ce qui doit être affiché comme info secondaire
  let secondaryDisplay = '';
  if (companyName && companyName !== 'Particulier' && displayName !== companyName) {
    secondaryDisplay = companyName;
  } else if (companyName === 'Particulier') {
    secondaryDisplay = 'Particulier';
  }
  
  // Déterminer la couleur du statut
  let statusColor = 'bg-gray-200';
  let displayStatus = '';
  
  if (client.status) {
    const status = client.status.toLowerCase();
    if (status.includes('actif') || status === 'active') {
      statusColor = 'bg-green-200 text-green-800';
      displayStatus = 'Actif';
    } else if (status.includes('inactif') || status === 'inactive') {
      statusColor = 'bg-red-200 text-red-800';
      displayStatus = 'Inactif';
    } else if (status.includes('prospect')) {
      statusColor = 'bg-blue-200 text-blue-800';
      displayStatus = 'Prospect';
    } else {
      displayStatus = client.status;
    }
  }
  
  // Vérifier si le client a des commandes récentes
  let hasRecentOrders = false;
  if (client.last_order_date) {
    const orderDate = new Date(client.last_order_date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    hasRecentOrders = orderDate >= threeMonthsAgo;
  }
  
  const formattedData = {
    displayName,
    secondaryDisplay,
    statusColor,
    displayStatus,
    hasRecentOrders,
    hasPhone: !!(client.phone || client.mobile),
    hasEmail: !!client.email,
    city: client.addresses?.city
  };
  
  // Stocker dans le cache
  if (client.id) {
    clientDataCache.set(client.id, formattedData);
  }
  
  return formattedData;
}; 