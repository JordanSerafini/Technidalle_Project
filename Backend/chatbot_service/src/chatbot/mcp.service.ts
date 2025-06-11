import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private baseUrl: string;
  private isEnabled: boolean = true;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('MCP_SERVER_URL') || 'http://mcp-postgres-server:3000';
    // Supprimer ws:// si présent et remplacer par http://
    this.baseUrl = this.baseUrl.replace('ws://', 'http://').replace('wss://', 'https://');
  }

  async onModuleInit() {
    await this.initializeConnection();
  }

  private async initializeConnection(retries: number = 5): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`🔄 Test de connexion MCP (tentative ${i + 1}/${retries}): ${this.baseUrl}`);
        await this.healthCheck();
        console.log('✅ Serveur MCP accessible');
        this.isEnabled = true;
        return;
      } catch (error) {
        console.log(`⚠️ Tentative ${i + 1} échouée:`, error.message);
        if (i < retries - 1) {
          console.log(`⏳ Nouvelle tentative dans 2 secondes...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    console.log('❌ Toutes les tentatives de connexion MCP ont échoué - service désactivé');
    this.isEnabled = false;
  }

  onModuleDestroy() {
    // Rien à faire pour HTTP
  }

  /**
   * Test de santé du serveur MCP
   */
  private async healthCheck(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🔧 État MCP:', data);
  }

  /**
   * Appel HTTP générique
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isEnabled) {
      // Essayer de se reconnecter une fois
      console.log('🔄 Tentative de reconnexion MCP...');
      try {
        await this.healthCheck();
        this.isEnabled = true;
        console.log('✅ Reconnexion MCP réussie');
      } catch (reconnectError) {
        throw new Error('Service MCP désactivé - utilisation du fallback DatabaseService');
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.log(`⚠️ Erreur appel MCP ${endpoint}:`, error.message);
      // Si c'est une erreur de connexion, désactiver temporairement le service
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        console.log('⚠️ Connexion MCP perdue - désactivation temporaire');
        this.isEnabled = false;
      }
      throw error;
    }
  }

  async listTables(database: 'sync' | 'app' = 'sync'): Promise<any> {
    try {
      const result = await this.makeRequest(`/api/${database}/tables`);
      
      // Transformer le résultat pour correspondre au format attendu
      if (result.content && result.content[0] && result.content[0].text) {
        const lines = result.content[0].text.split('\n').filter(line => line.includes('📋'));
        return lines.map((line: string) => {
          const tableName = line.split('📋')[1].split('(')[0].trim();
          return { table_name: tableName };
        });
      }
      
      return result;
    } catch (error) {
      console.log(`⚠️ MCP listTables échec pour ${database}:`, error.message);
      throw error;
    }
  }

  async describeTable(tableName: string, database: 'sync' | 'app' = 'sync'): Promise<any> {
    try {
      const result = await this.makeRequest(`/api/${database}/tables/${tableName}`);
      
      // Transformer le format MCP en format attendu
      if (result.content && result.content[0] && result.content[0].text) {
        const text = result.content[0].text;
        const lines = text.split('\n').filter(line => line.includes('📌'));
        
        const columns = lines.map((line: string) => {
          const parts = line.split('📌')[1].trim().split(':');
          const columnName = parts[0].trim();
          const rest = parts[1] ? parts[1].trim() : '';
          const dataTypePart = rest.split(' ')[0];
          
          return {
            column_name: columnName,
            data_type: dataTypePart,
            is_nullable: rest.includes('NOT NULL') ? 'NO' : 'YES'
          };
        });
        
        return { columns };
      }
      
      return result;
    } catch (error) {
      console.log(`⚠️ MCP describeTable échec pour ${tableName}:`, error.message);
      throw error;
    }
  }

  async executeQuery(query: string, database: 'sync' | 'app' = 'sync', limit: number = 100): Promise<any> {
    try {
      const result = await this.makeRequest(`/api/${database}/query`, {
        method: 'POST',
        body: JSON.stringify({ query, limit }),
      });
      
      console.log('🔍 Debug MCP executeQuery result:', {
        hasContent: !!result.content,
        contentLength: result.content?.length,
        firstContent: result.content?.[0],
        resultKeys: Object.keys(result)
      });
      
      // Extraire les données du format MCP
      let rows = [];
      let rowCount = 0;
      
      if (result.content && result.content[0] && result.content[0].text) {
        const text = result.content[0].text;
        
        // Extraire le nombre de lignes
        const rowCountMatch = text.match(/📊 Résultats: (\d+) lignes/);
        if (rowCountMatch) {
          rowCount = parseInt(rowCountMatch[1], 10);
        }
        
        // Extraire les données JSON
        const dataMatch = text.match(/📋 Données:\n(.+)/s);
        if (dataMatch) {
          try {
            rows = JSON.parse(dataMatch[1].trim());
            console.log('✅ Données MCP extraites:', { rowCount, rowsLength: rows.length });
          } catch (parseError) {
            console.error('❌ Erreur parsing des données MCP:', parseError.message);
            rows = [];
          }
        }
      }
      
      return {
        rows: rows,
        rowCount: rowCount,
        source: 'mcp',
        database: database
      };
    } catch (error) {
      console.log(`⚠️ MCP executeQuery échec pour ${database}:`, error.message);
      throw error;
    }
  }

  async analyzeData(tableName: string, columns?: string[], database: 'sync' | 'app' = 'sync'): Promise<any> {
    try {
      const result = await this.makeRequest(`/api/${database}/analyze/${tableName}`, {
        method: 'POST',
        body: JSON.stringify({ columns }),
      });
      
      return result;
    } catch (error) {
      console.log(`⚠️ MCP analyzeData échec pour ${tableName}:`, error.message);
      throw error;
    }
  }

  async getTableSchema(database: 'sync' | 'app' = 'sync'): Promise<string> {
    try {
      const result = await this.makeRequest(`/api/${database}/schema`);
      
      let schema = `Base de données: ${database}\n\nTables disponibles:\n`;
      
      if (result.tables && Array.isArray(result.tables)) {
        for (const table of result.tables) {
          schema += `\n- ${table.name}\n`;
          if (table.description && table.description.columns) {
            schema += `  Colonnes:\n`;
            table.description.columns.forEach((col: any) => {
              schema += `    - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}\n`;
            });
          }
        }
      }
      
      return schema;
    } catch (error) {
      console.log(`⚠️ MCP getTableSchema échec pour ${database}:`, error.message);
      throw new Error(`MCP Schema indisponible pour ${database}: ${error.message}`);
    }
  }

  /**
   * Vérifier si le service MCP est disponible
   */
  isAvailable(): boolean {
    return this.isEnabled;
  }
} 