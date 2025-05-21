import { Injectable, Logger } from '@nestjs/common';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

@Injectable()
export class QueryCacheService {
  private readonly logger = new Logger(QueryCacheService.name);
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly defaultTTL = 1000 * 60 * 60; // 1 heure par défaut

  /**
   * Récupère une valeur dans le cache
   * @param key La clé du cache
   * @returns La valeur en cache ou undefined si non trouvée/expirée
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);

    if (!item) {
      return undefined;
    }

    // Vérifier si l'item a expiré
    if (Date.now() > item.expiresAt) {
      this.logger.debug(`Cache expiré pour la clé: ${key}`);
      this.cache.delete(key);
      return undefined;
    }

    this.logger.debug(`Cache hit pour la clé: ${key}`);
    return item.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   * @param key La clé du cache
   * @param data Les données à stocker
   * @param ttl Le temps de vie en millisecondes (optionnel)
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    this.cache.set(key, item);
    this.logger.debug(
      `Cache mis à jour pour la clé: ${key}, expire dans ${ttl / 1000}s`,
    );
  }

  /**
   * Supprime une valeur du cache
   * @param key La clé du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.logger.debug(`Cache supprimé pour la clé: ${key}`);
  }

  /**
   * Nettoie tout le cache
   */
  clear(): void {
    this.cache.clear();
    this.logger.debug('Cache entièrement vidé');
  }

  /**
   * Nettoie les entrées expirées du cache
   */
  cleanExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`${cleanedCount} entrées expirées nettoyées du cache`);
    }
  }

  /**
   * Récupère une donnée du cache ou l'y stocke si elle n'existe pas
   * @param key La clé du cache
   * @param fetchFn La fonction à appeler si la donnée n'est pas en cache
   * @param ttl Le temps de vie en millisecondes (optionnel)
   * @returns Les données, soit depuis le cache, soit fraîchement générées
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    // Essayer de récupérer du cache d'abord
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    // Si pas dans le cache, exécuter la fonction et mettre en cache
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des données pour la clé ${key}: ${error.message}`,
      );
      throw error;
    }
  }
}
