import express, { Request, Response } from 'express';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

interface McpRequest {
  method: string;
  params: any;
}

interface McpResponse {
  result?: any;
  error?: any;
}

class McpHttpServer {
  private app: express.Application;
  private mcpProcess: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.startMcpProcess();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private startMcpProcess(): void {
    console.log('🚀 Démarrage du processus MCP...');
    
    // Démarrer le serveur MCP en mode STDIO
    this.mcpProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    if (this.mcpProcess.stdout) {
      this.mcpProcess.stdout.on('data', (data) => {
        try {
          const lines = data.toString().split('\n').filter((line: string) => line.trim());
          for (const line of lines) {
            if (line.startsWith('{')) {
              const response = JSON.parse(line);
              this.handleMcpResponse(response);
            } else {
              console.log('MCP Log:', line);
            }
          }
        } catch (error) {
          console.error('Erreur parsing MCP response:', error);
        }
      });
    }

    if (this.mcpProcess.stderr) {
      this.mcpProcess.stderr.on('data', (data) => {
        console.error('MCP Error:', data.toString());
      });
    }

    this.mcpProcess.on('exit', (code) => {
      console.log(`❌ Processus MCP terminé avec le code: ${code}`);
      this.mcpProcess = null;
    });

    // Initialiser la connexion MCP
    setTimeout(() => {
      this.sendMcpRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'technidalle-http-bridge',
          version: '1.0.0'
        }
      });
    }, 1000);
  }

  private sendMcpRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.mcpProcess || !this.mcpProcess.stdin) {
        reject(new Error('Processus MCP non disponible'));
        return;
      }

      const id = ++this.requestId;
      this.pendingRequests.set(id, { resolve, reject });

      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');

      // Timeout après 30 secondes
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Timeout de la requête MCP'));
        }
      }, 30000);
    });
  }

  private handleMcpResponse(response: any): void {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id)!;
      this.pendingRequests.delete(response.id);

      if (response.error) {
        reject(new Error(response.error.message || 'Erreur MCP'));
      } else {
        resolve(response.result);
      }
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mcpProcess: this.mcpProcess ? 'running' : 'stopped'
      });
    });

    // Liste des outils MCP
    this.app.get('/api/tools', async (req: Request, res: Response) => {
      try {
        const result = await this.sendMcpRequest('tools/list', {});
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Exécuter un outil MCP
    this.app.post('/api/tools/:toolName', async (req: Request, res: Response) => {
      try {
        const { toolName } = req.params;
        const { arguments: toolArgs } = req.body;

        const result = await this.sendMcpRequest('tools/call', {
          name: toolName,
          arguments: toolArgs || {}
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Raccourcis pour les outils spécifiques

    // Liste des tables
    this.app.get('/api/:database/tables', async (req: Request, res: Response) => {
      try {
        const { database } = req.params;
        const { schema = 'public' } = req.query;
        
        if (database !== 'sync' && database !== 'app') {
          return res.status(400).json({ error: 'Base de données invalide. Utilisez sync ou app.' });
        }

        const toolName = `list_tables_${database}`;
        const result = await this.sendMcpRequest('tools/call', {
          name: toolName,
          arguments: { schema }
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Description d'une table
    this.app.get('/api/:database/tables/:tableName', async (req: Request, res: Response) => {
      try {
        const { database, tableName } = req.params;
        const { schema = 'public' } = req.query;
        
        if (database !== 'sync' && database !== 'app') {
          return res.status(400).json({ error: 'Base de données invalide. Utilisez sync ou app.' });
        }

        const toolName = `describe_table_${database}`;
        const result = await this.sendMcpRequest('tools/call', {
          name: toolName,
          arguments: { table_name: tableName, schema }
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Exécution de requête
    this.app.post('/api/:database/query', async (req: Request, res: Response) => {
      try {
        const { database } = req.params;
        const { query, limit = 100 } = req.body;
        
        if (database !== 'sync' && database !== 'app') {
          return res.status(400).json({ error: 'Base de données invalide. Utilisez sync ou app.' });
        }

        if (!query) {
          return res.status(400).json({ error: 'Requête SQL manquante.' });
        }

        const toolName = `execute_query_${database}`;
        const result = await this.sendMcpRequest('tools/call', {
          name: toolName,
          arguments: { query, limit }
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Analyse de données
    this.app.post('/api/:database/analyze/:tableName', async (req: Request, res: Response) => {
      try {
        const { database, tableName } = req.params;
        const { columns } = req.body;
        
        if (database !== 'sync' && database !== 'app') {
          return res.status(400).json({ error: 'Base de données invalide. Utilisez sync ou app.' });
        }

        const toolName = `analyze_data_${database}`;
        const result = await this.sendMcpRequest('tools/call', {
          name: toolName,
          arguments: { table_name: tableName, columns }
        });

        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });

    // Obtenir le schéma complet
    this.app.get('/api/:database/schema', async (req: Request, res: Response) => {
      try {
        const { database } = req.params;
        
        if (database !== 'sync' && database !== 'app') {
          return res.status(400).json({ error: 'Base de données invalide. Utilisez sync ou app.' });
        }

        // Récupérer la liste des tables
        const toolName = `list_tables_${database}`;
        const tablesResult = await this.sendMcpRequest('tools/call', {
          name: toolName,
          arguments: { schema: 'public' }
        });

        const schema = {
          database: database,
          tables: []
        };

        // Extraire les noms de tables du résultat
        if (tablesResult.content && tablesResult.content[0] && tablesResult.content[0].text) {
          const tableLines = tablesResult.content[0].text.split('\n').filter((line: string) => line.includes('📋'));
          
          for (const line of tableLines) {
            const match = line.match(/📋\s*(\w+)/);
            if (match) {
              const tableName = match[1];
              try {
                const describeToolName = `describe_table_${database}`;
                const description = await this.sendMcpRequest('tools/call', {
                  name: describeToolName,
                  arguments: { table_name: tableName, schema: 'public' }
                });
                
                (schema.tables as any[]).push({
                  name: tableName,
                  description: description
                });
              } catch (error) {
                (schema.tables as any[]).push({
                  name: tableName,
                  error: 'Impossible de décrire la table'
                });
              }
            }
          }
        }

        res.json(schema);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  public async start(port: number = 3000): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, '0.0.0.0', () => {
        console.log(`🌐 Serveur HTTP MCP Bridge démarré sur le port ${port}`);
        console.log(`📋 Endpoints disponibles:`);
        console.log(`   GET  /health - Statut du serveur`);
        console.log(`   GET  /api/tools - Liste des outils MCP`);
        console.log(`   POST /api/tools/:toolName - Exécuter un outil MCP`);
        console.log(`   GET  /api/:database/tables - Liste des tables`);
        console.log(`   GET  /api/:database/tables/:tableName - Description d'une table`);
        console.log(`   POST /api/:database/query - Exécution de requête SQL`);
        console.log(`   POST /api/:database/analyze/:tableName - Analyse de données`);
        console.log(`   GET  /api/:database/schema - Schéma complet`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }
}

// Point d'entrée principal
async function main() {
  const server = new McpHttpServer();
  
  // Gestion propre de l'arrêt
  process.on('SIGINT', async () => {
    console.log('\n🛑 Arrêt du serveur HTTP MCP Bridge...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Arrêt du serveur HTTP MCP Bridge...');
    await server.stop();
    process.exit(0);
  });

  try {
    const port = parseInt(process.env.HTTP_PORT || '3000');
    await server.start(port);
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur HTTP:', error);
    process.exit(1);
  }
}

// Point d'entrée pour les modules ES
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { McpHttpServer };