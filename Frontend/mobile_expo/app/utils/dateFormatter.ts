export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'Non définie';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'Non définie';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
} 

export default {
  formatDate,
  formatDateTime,
};

