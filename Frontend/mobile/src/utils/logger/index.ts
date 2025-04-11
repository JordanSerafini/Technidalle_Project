export enum LogLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

class Logger {
  private static instance: Logger;
  private logBaseDir: string = '@logs';
  private logsInMemory: Map<string, string[]> = new Map();
  private maxLogsInMemory: number = 1000;
  private initialized: boolean = false;
  private autoDownloadEnabled: boolean = false;
  private allLogs: string[] = [];

  private constructor() {
    this.init();
    setInterval(() => this.flushAllLogs(), 30000);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.downloadCombinedLogFile();
      });
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async init(): Promise<void> {
    try {
      // Nous utilisons console.log pour l'initialisation puisque le logger n'est pas encore prêt
      console.log('Système de journalisation initialisé');
      this.initialized = true;
    } catch (error) {
      console.error('Erreur d\'initialisation du système de journalisation:', error);
    }
  }

  private getLogFilePath(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    return `${this.logBaseDir}/${dateStr}.log`;
  }

  private formatLogMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  private addToLogBuffer(formattedMessage: string): void {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Ajouter le log au tableau global de tous les logs
    this.allLogs.push(formattedMessage);
    
    // Ajouter le log au tableau spécifique à la date
    if (!this.logsInMemory.has(dateStr)) {
      this.logsInMemory.set(dateStr, []);
    }
    
    const logs = this.logsInMemory.get(dateStr)!;
    logs.push(formattedMessage);
    
    // Limiter la taille du tampon en mémoire
    if (logs.length > this.maxLogsInMemory) {
      this.saveLogsToFile(dateStr);
    }
    
    // Si le tableau global atteint une certaine taille, enregistrer dans un fichier
    if (this.allLogs.length > this.maxLogsInMemory) {
      this.downloadCombinedLogFile();
    }
  }

  /**
   * Active/Désactive le téléchargement automatique des logs
   */
  public enableAutoDownload(enable: boolean): void {
    this.autoDownloadEnabled = enable;
    console.log(`Téléchargement automatique des logs ${enable ? 'activé' : 'désactivé'}`);
  }

  /**
   * Sauvegarde les logs dans un fichier téléchargeable
   */
  private saveLogsToFile(dateStr: string): void {
    const logs = this.logsInMemory.get(dateStr);
    if (!logs || logs.length === 0) return;

    try {
      const fileName = `${dateStr}.log`;
      const content = logs.join('\n');
      
      // Afficher où les logs seraient sauvegardés
      console.debug(`Préparation de ${logs.length} logs pour le fichier ${fileName}`);
      
      // Télécharger le fichier si l'auto-téléchargement est activé
      if (this.autoDownloadEnabled) {
        this.downloadLogs(fileName, content);
      }
      
      // Vider le tampon après la sauvegarde
      this.logsInMemory.set(dateStr, []);
    } catch (error) {
      console.error('Erreur lors de l\'écriture des logs:', error);
    }
  }

  /**
   * Télécharge un fichier combiné avec tous les logs
   */
  public downloadCombinedLogFile(): void {
    if (this.allLogs.length === 0) {
      console.log('Aucun log à télécharger');
      return;
    }
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const fileName = `all_logs_${timestamp}.log`;
    
    console.log(`Téléchargement de ${this.allLogs.length} logs dans ${fileName}`);
    this.downloadLogs(fileName, this.allLogs.join('\n'));
    
    // Vider le tableau après le téléchargement
    this.allLogs = [];
  }

  /**
   * Télécharge un fichier avec le contenu des logs
   */
  private downloadLogs(fileName: string, content: string): void {
    try {
      // Créer un élément <a> pour le téléchargement
      const element = document.createElement('a');
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      
      // Cacher l'élément, l'ajouter au DOM, cliquer dessus puis le supprimer
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      console.log(`Fichier ${fileName} téléchargé`);
    } catch (error) {
      console.error('Erreur lors du téléchargement des logs:', error);
    }
  }

  /**
   * Sauvegarde tous les logs en mémoire et propose le téléchargement
   */
  public async flushAllLogs(): Promise<void> {
    // Télécharger les logs par date
    const dates = [...this.logsInMemory.keys()];
    for (const dateStr of dates) {
      this.saveLogsToFile(dateStr);
    }
    
    // Télécharger tous les logs combinés
    this.downloadCombinedLogFile();
  }

  /**
   * Télécharge manuellement tous les logs actuellement en mémoire
   */
  public downloadAllLogs(): void {
    const dates = [...this.logsInMemory.keys()];
    if (dates.length === 0) {
      console.log('Aucun log à télécharger');
      return;
    }
    
    for (const dateStr of dates) {
      const logs = this.logsInMemory.get(dateStr);
      if (logs && logs.length > 0) {
        this.downloadLogs(`${dateStr}.log`, logs.join('\n'));
      }
    }
  }

  /**
   * Télécharge tous les logs d'une journée spécifique
   */
  public downloadLogsByDate(dateStr: string): void {
    const logs = this.logsInMemory.get(dateStr);
    if (!logs || logs.length === 0) {
      console.log(`Aucun log pour la date ${dateStr}`);
      return;
    }
    
    this.downloadLogs(`${dateStr}.log`, logs.join('\n'));
  }

  public info(message: string, data?: any): void {
    const formattedMessage = this.formatLogMessage(LogLevel.INFO, message, data);
    console.info(formattedMessage);
    this.addToLogBuffer(formattedMessage);
  }

  public warn(message: string, data?: any): void {
    const formattedMessage = this.formatLogMessage(LogLevel.WARNING, message, data);
    console.warn(formattedMessage);
    this.addToLogBuffer(formattedMessage);
  }

  public error(message: string, data?: any): void {
    const formattedMessage = this.formatLogMessage(LogLevel.ERROR, message, data);
    console.error(formattedMessage);
    this.addToLogBuffer(formattedMessage);
  }

  public debug(message: string, data?: any): void {
    const formattedMessage = this.formatLogMessage(LogLevel.DEBUG, message, data);
    console.debug(formattedMessage);
    this.addToLogBuffer(formattedMessage);
  }

  public log(message: string, data?: any): void {
    this.info(message, data);
  }

  /**
   * Force la sauvegarde immédiate des logs
   */
  public async flush(): Promise<void> {
    await this.flushAllLogs();
  }

  /**
   * Récupère la liste des dates pour lesquelles il y a des logs en mémoire
   */
  public getLogDates(): string[] {
    return [...this.logsInMemory.keys()].sort().reverse(); // Plus récent d'abord
  }

  /**
   * Récupère le contenu des logs pour une date spécifique
   */
  public getLogContent(dateStr: string): string {
    const logs = this.logsInMemory.get(dateStr);
    return logs ? logs.join('\n') : `Aucun log pour ${dateStr}`;
  }
}

export const logger = Logger.getInstance(); 