/**
 * Fonctions utilitaires pour manipuler et formater les données d'email
 */

/**
 * Tronque un texte si sa longueur dépasse maxLength et qu'il n'est pas marqué comme étendu
 */
export const truncateText = (text: string | undefined, isExpanded: boolean, maxLength = 1000): string => {
  if (!text) return '';
  if (isExpanded || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Extrait le nom d'expéditeur à partir d'une adresse email
 */
export const extractSenderName = (from: string | undefined): string => {
  if (!from) return 'Inconnu';
  
  // Pattern pour extraire le nom entre guillemets: "Nom" <email@example.com>
  const nameMatch = from.match(/"([^"]+)"/);
  if (nameMatch && nameMatch[1]) {
    return nameMatch[1];
  }
  
  // Si pas de nom entre guillemets, extraire l'email
  const emailMatch = from.match(/<([^>]+)>/);
  if (emailMatch && emailMatch[1]) {
    return emailMatch[1];
  }
  
  return from;
};

// Ajouter un export par défaut pour résoudre l'erreur d'Expo Router
export default function MailUtilsExport() {
  return null;
} 