import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocket } from 'ws';

interface McpRequest {
  id: string;
  method: string;
  params?: any;
}

interface McpResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private ws: WebSocket | null = null;
  private requestId = 1;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  onModuleDestroy() {
    if (this.ws) {
      this.ws.close();
    }
  }

  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connexion au serveur MCP local (ajustez l'URL selon votre configuration)
        const mcpUrl = this.configService.get<string>('MCP_SERVER_URL') || 'ws://localhost:8080';
        this.ws = new WebSocket(mcpUrl);

        this.ws.on('open', () => {
          console.log('Connecté au serveur MCP');
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const response: McpResponse = JSON.parse(data.toString());
            const pending = this.pendingRequests.get(response.id);
            
            if (pending) {
              this.pendingRequests.delete(response.id);
              if (response.error) {
                pending.reject(new Error(response.error.message));
              } else {
                pending.resolve(response.result);
              }
            }
          } catch (error) {
            console.error('Erreur lors du parsing de la réponse MCP:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('Erreur WebSocket MCP:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('Connexion MCP fermée');
          // Tentative de reconnexion après 5 secondes
          setTimeout(() => this.connect(), 5000);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  private async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Connexion MCP non disponible');
    }

    const id = (this.requestId++).toString();
    const request: McpRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      this.ws!.send(JSON.stringify(request));
      
      // Timeout après 30 secondes
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Timeout de la requête MCP'));
        }
      }, 30000);
    });
  }

  async listTables(database: 'sync' | 'app' = 'sync'): Promise<any> {
    try {
      const method = database === 'sync' 
        ? 'mcp_technidalle-postgres-sync_list_tables_sync'
        : 'mcp_technidalle-postgres-sync_list_tables_app';
      
      return await this.sendRequest(method);
    } catch (error) {
      console.error('Erreur lors de la liste des tables:', error);
      throw error;
    }
  }

  async describeTable(tableName: string, database: 'sync' | 'app' = 'sync'): Promise<any> {
    try {
      const method = database === 'sync'
        ? 'mcp_technidalle-postgres-sync_describe_table_sync'
        : 'mcp_technidalle-postgres-sync_describe_table_app';
      
      return await this.sendRequest(method, { table_name: tableName });
    } catch (error) {
      console.error(`Erreur lors de la description de la table ${tableName}:`, error);
      throw error;
    }
  }

  async executeQuery(query: string, database: 'sync' | 'app' = 'sync', limit: number = 100): Promise<any> {
    try {
      const method = database === 'sync'
        ? 'mcp_technidalle-postgres-sync_execute_query_sync'
        : 'mcp_technidalle-postgres-sync_execute_query_app';
      
      return await this.sendRequest(method, { query, limit });
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la requête:', error);
      throw error;
    }
  }

  async analyzeData(tableName: string, columns?: string[], database: 'sync' | 'app' = 'sync'): Promise<any> {
    try {
      const method = database === 'sync'
        ? 'mcp_technidalle-postgres-sync_analyze_data_sync'
        : 'mcp_technidalle-postgres-sync_analyze_data_app';
      
      const params: any = { table_name: tableName };
      if (columns && columns.length > 0) {
        params.columns = columns;
      }
      
      return await this.sendRequest(method, params);
    } catch (error) {
      console.error(`Erreur lors de l'analyse de la table ${tableName}:`, error);
      throw error;
    }
  }

  async getTableSchema(database: 'sync' | 'app' = 'sync'): Promise<string> {
    try {
      const tables = await this.listTables(database);
      let schema = `Base de données: ${database}\n\nTables disponibles:\n`;
      
      for (const table of tables) {
        const tableName = typeof table === 'string' ? table : table.table_name;
        schema += `\n- ${tableName}\n`;
        
        try {
          const description = await this.describeTable(tableName, database);
          if (description && description.columns) {
            schema += `  Colonnes:\n`;
            description.columns.forEach((col: any) => {
              schema += `    - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}\n`;
            });
          }
        } catch (error) {
          schema += `  (Erreur lors de la description de la table)\n`;
        }
      }
      
      return schema;
    } catch (error) {
      console.error('Erreur lors de la récupération du schéma:', error);
      return 'Erreur lors de la récupération du schéma de la base de données';
    }
  }
} 