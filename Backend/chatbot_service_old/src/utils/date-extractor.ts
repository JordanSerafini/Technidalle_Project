interface DateRange {
  startDate: Date;
  endDate: Date;
}

const MONTHS = {
  'janvier': 0,
  'février': 1,
  'mars': 2,
  'avril': 3,
  'mai': 4,
  'juin': 5,
  'juillet': 6,
  'août': 7,
  'septembre': 8,
  'octobre': 9,
  'novembre': 10,
  'décembre': 11
};

export function extractDates(question: string): DateRange | null {
  // Pattern pour l'année (plus flexible)
  const yearPatterns = [
    /année\s+(\d{4})/i,
    /(\d{4})/i  // Capture l'année directement si elle est mentionnée seule
  ];

  for (const pattern of yearPatterns) {
    const yearMatch = question.match(pattern);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (!isNaN(year) && year >= 1900 && year <= 2100) {  // Validation basique de l'année
        return {
          startDate: new Date(year, 0, 1),
          endDate: new Date(year, 11, 31, 23, 59, 59)
        };
      }
    }
  }

  // Pattern pour une date spécifique
  const specificDatePattern = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
  const specificDateMatch = question.match(specificDatePattern);
  if (specificDateMatch) {
    const day = parseInt(specificDateMatch[1]);
    const month = MONTHS[specificDateMatch[2].toLowerCase()];
    const year = parseInt(specificDateMatch[3]);
    const date = new Date(year, month, day);
    return {
      startDate: date,
      endDate: new Date(year, month, day, 23, 59, 59)
    };
  }

  // Pattern pour une période entre deux mois
  const dateRangePattern = /entre\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+et\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
  const dateRangeMatch = question.match(dateRangePattern);
  if (dateRangeMatch) {
    const startMonth = MONTHS[dateRangeMatch[1].toLowerCase()];
    const endMonth = MONTHS[dateRangeMatch[2].toLowerCase()];
    const year = parseInt(dateRangeMatch[3]);

    // Obtenir le dernier jour du mois de fin
    const lastDayOfMonth = new Date(year, endMonth + 1, 0).getDate();

    return {
      startDate: new Date(year, startMonth, 1),
      endDate: new Date(year, endMonth, lastDayOfMonth, 23, 59, 59)
    };
  }

  // Pattern pour une période entre deux dates spécifiques
  const specificDateRangePattern = /entre\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})\s+et\s+(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
  const specificDateRangeMatch = question.match(specificDateRangePattern);
  if (specificDateRangeMatch) {
    const startDay = parseInt(specificDateRangeMatch[1]);
    const startMonth = MONTHS[specificDateRangeMatch[2].toLowerCase()];
    const startYear = parseInt(specificDateRangeMatch[3]);
    const endDay = parseInt(specificDateRangeMatch[4]);
    const endMonth = MONTHS[specificDateRangeMatch[5].toLowerCase()];
    const endYear = parseInt(specificDateRangeMatch[6]);

    return {
      startDate: new Date(startYear, startMonth, startDay),
      endDate: new Date(endYear, endMonth, endDay, 23, 59, 59)
    };
  }

  // Si aucun pattern n'est trouvé, retourner null
  return null;
}

// Fonction utilitaire pour formater une date en français
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('fr-FR', options);
}

// Fonction pour valider une période de dates
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate;
}

// Exemples d'utilisation :
/*
const examples = [
  "Quels sont les chantiers de l'année 2024 ?",
  "Projets du 7 février 2022",
  "Chantiers entre janvier et mars 2024",
  "Projets entre 1 janvier 2024 et 31 mars 2024"
];

examples.forEach(question => {
  const dates = extractDates(question);
  if (dates) {
    console.log(`Question: ${question}`);
    console.log(`Dates extraites: ${formatDate(dates.startDate)} - ${formatDate(dates.endDate)}`);
  }
});
*/ 