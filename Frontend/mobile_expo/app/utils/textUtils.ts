/**
 * Utilitaires pour le traitement et le formatage de texte
 */

/**
 * Détecte si un texte est au format RTF
 */
export function isRTFFormat(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return text.trim().startsWith('{\\rtf1');
}

/**
 * Nettoie le texte RTF pour le rendre lisible
 * Supprime les balises RTF et garde uniquement le contenu textuel
 */
export function cleanRTFText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  // Si ce n'est pas du RTF, retourner tel quel
  if (!isRTFFormat(text)) return text;
  
  let cleanText = text;
  
  try {
    // Supprimer l'en-tête RTF
    cleanText = cleanText.replace(/^\{\\rtf1[^}]*\}/, '');
    
    // Supprimer les commandes RTF communes
    cleanText = cleanText.replace(/\\[a-z]+\d*\s?/gi, ''); // \par, \f0, etc.
    cleanText = cleanText.replace(/\{\\[^}]*\}/g, ''); // {\\generator...}
    cleanText = cleanText.replace(/\{|\}/g, ''); // Accolades restantes
    
    // Nettoyer les codes spéciaux RTF
    cleanText = cleanText.replace(/\\'/g, "'"); // Apostrophes
    cleanText = cleanText.replace(/\\par\s*/g, '\n'); // Nouveaux paragraphes
    cleanText = cleanText.replace(/\\line\s*/g, '\n'); // Nouvelles lignes
    cleanText = cleanText.replace(/\\tab\s*/g, '\t'); // Tabulations
    
    // Nettoyer les caractères d'échappement
    cleanText = cleanText.replace(/\\([\\{}])/g, '$1'); // \\ \{ \}
    
    // Nettoyer les espaces multiples et les lignes vides
    cleanText = cleanText.replace(/\s+/g, ' '); // Espaces multiples
    cleanText = cleanText.replace(/\n\s*\n/g, '\n'); // Lignes vides multiples
    
    // Trim et nettoyer les caractères indésirables
    cleanText = cleanText.trim();
    
    return cleanText;
  } catch (error) {
    console.warn('Erreur lors du nettoyage RTF:', error);
    return text; // Retourner le texte original en cas d'erreur
  }
}

/**
 * Formate un texte pour l'affichage avec gestion du RTF
 */
export function formatTextForDisplay(text: string, maxLength?: number): string {
  if (!text) return '';
  
  let formattedText = isRTFFormat(text) ? cleanRTFText(text) : text;
  
  // Limiter la longueur si spécifié
  if (maxLength && formattedText.length > maxLength) {
    formattedText = formattedText.substring(0, maxLength) + '...';
  }
  
  return formattedText;
}

/**
 * Convertit un texte RTF en lignes formatées pour l'affichage
 */
export function rtfToFormattedLines(text: string): string[] {
  if (!text) return [];
  
  const cleanText = isRTFFormat(text) ? cleanRTFText(text) : text;
  
  return cleanText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Extrait les dates d'un texte de description de projet
 */
export function extractDatesFromProjectDescription(text: string): { date: string; description: string }[] {
  if (!text) return [];
  
  const cleanText = formatTextForDisplay(text);
  const lines = cleanText.split('\n');
  const dateEntries: { date: string; description: string }[] = [];
  
  let currentDate = '';
  let currentDescription = '';
  
  for (const line of lines) {
    // Détecter les dates au format DD/MM/YYYY
    const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
    
    if (dateMatch) {
      // Sauvegarder l'entrée précédente s'il y en a une
      if (currentDate && currentDescription) {
        dateEntries.push({
          date: currentDate,
          description: currentDescription.trim()
        });
      }
      
      // Commencer une nouvelle entrée
      currentDate = dateMatch[1];
      currentDescription = line.replace(dateMatch[1], '').trim();
    } else if (currentDate) {
      // Ajouter à la description actuelle
      currentDescription += '\n' + line;
    }
  }
  
  // Ajouter la dernière entrée
  if (currentDate && currentDescription) {
    dateEntries.push({
      date: currentDate,
      description: currentDescription.trim()
    });
  }
  
  return dateEntries;
}

/**
 * Formate les entrées de dates pour un affichage chronologique
 */
export function formatProjectTimeline(text: string): { date: Date; dateStr: string; description: string }[] {
  const entries = extractDatesFromProjectDescription(text);
  
  return entries
    .map(entry => {
      const [day, month, year] = entry.date.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return {
        date,
        dateStr: entry.date,
        description: entry.description
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Tri décroissant (plus récent en premier)
} 