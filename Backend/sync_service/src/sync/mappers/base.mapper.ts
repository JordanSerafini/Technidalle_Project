// Interface commune pour tous les mappers
export interface Mapper<Source, Target> {
  map(source: Source, ...args: any[]): Target;
}

// Classe de base pour les opérations de mappage
export abstract class BaseMapper<Source, Target>
  implements Mapper<Source, Target>
{
  abstract map(source: Source, ...args: any[]): Target;

  // Méthodes utilitaires communes à tous les mappers
  protected cleanUndefinedProperties<T extends object>(obj: T): T {
    const result = { ...obj };
    for (const key in result) {
      if (result[key] === undefined) {
        delete (result as any)[key]; // Utilisation temporaire de any pour la suppression
      }
    }
    return result;
  }

  // Convertit les dates string en objets Date
  protected parseDate(dateStr?: string | Date | null): Date | undefined {
    if (!dateStr) return undefined;

    if (dateStr instanceof Date) return dateStr;

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  }
} 