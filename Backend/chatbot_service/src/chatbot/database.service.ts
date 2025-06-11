import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface TableInfo {
  table_name: string;
  table_schema: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private syncPool: Pool | null = null;
  private appPool: Pool | null = null;
  private syncConnected: boolean = false;
  private appConnected: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeDatabases();
  }

  async onModuleDestroy() {
    if (this.syncPool) {
      await this.syncPool.end();
    }
    if (this.appPool) {
      await this.appPool.end();
    }
  }

  private getSyncDatabaseConfig(): DatabaseConfig {
    return {
      host: this.configService.get<string>('POSTGRES_SYNC_HOST') || 'localhost',
      port: parseInt(this.configService.get<string>('POSTGRES_SYNC_PORT') || '5433'),
      user: this.configService.get<string>('POSTGRES_SYNC_USER') || 'sync_user',
      password: this.configService.get<string>('POSTGRES_SYNC_PASSWORD') || 'sync_password',
      database: this.configService.get<string>('POSTGRES_SYNC_DATABASE') || 'sync_db',
    };
  }

  private getAppDatabaseConfig(): DatabaseConfig {
    return {
      host: this.configService.get<string>('POSTGRES_APP_HOST') || 'localhost',
      port: parseInt(this.configService.get<string>('POSTGRES_APP_PORT') || '5432'),
      user: this.configService.get<string>('POSTGRES_APP_USER') || 'postgres',
      password: this.configService.get<string>('POSTGRES_APP_PASSWORD') || 'postgres',
      database: this.configService.get<string>('POSTGRES_APP_DATABASE') || 'postgres',
    };
  }

  private async initializeDatabases(): Promise<void> {
    const syncConfig = this.getSyncDatabaseConfig();
    const appConfig = this.getAppDatabaseConfig();

    // Pool pour postgres_sync
    try {
      this.syncPool = new Pool({
        ...syncConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.syncPool.on('error', (err) => {
        console.error('Erreur du pool PostgreSQL Sync:', err);
        this.syncConnected = false;
      });

      // Test de connexion sync
      const syncClient = await this.syncPool.connect();
      await syncClient.query('SELECT NOW()');
      syncClient.release();
      this.syncConnected = true;
      console.log('✅ Connexion à postgres_sync établie');
    } catch (error) {
      console.error('❌ Erreur de connexion à postgres_sync:', error);
      this.syncConnected = false;
    }

    // Pool pour postgres_app
    try {
      this.appPool = new Pool({
        ...appConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.appPool.on('error', (err) => {
        console.error('Erreur du pool PostgreSQL App:', err);
        this.appConnected = false;
      });

      // Test de connexion app
      const appClient = await this.appPool.connect();
      await appClient.query('SELECT NOW()');
      appClient.release();
      this.appConnected = true;
      console.log('✅ Connexion à postgres_app établie');
    } catch (error) {
      console.error('❌ Erreur de connexion à postgres_app:', error);
      this.appConnected = false;
    }
  }

  private getPool(database: 'sync' | 'app'): Pool {
    const pool = database === 'sync' ? this.syncPool : this.appPool;
    if (!pool) {
      throw new Error(`Pool de connexion ${database} non initialisé`);
    }
    return pool;
  }

  isConnected(database: 'sync' | 'app'): boolean {
    return database === 'sync' ? this.syncConnected : this.appConnected;
  }

  private validateQuery(query: string): void {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      throw new Error('Seules les requêtes SELECT sont autorisées');
    }
    
    // Vérifications de sécurité supplémentaires
    const dangerousKeywords = ['drop', 'delete', 'insert', 'update', 'alter', 'create', 'truncate'];
    for (const keyword of dangerousKeywords) {
      if (trimmedQuery.includes(keyword)) {
        throw new Error(`Mot-clé non autorisé détecté: ${keyword}`);
      }
    }
  }

  async executeQuery(query: string, database: 'sync' | 'app', limit: number = 100): Promise<any> {
    if (!this.isConnected(database)) {
      throw new Error(`Base de données ${database} non connectée`);
    }

    this.validateQuery(query);

    const pool = this.getPool(database);
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();
      
      // Ajouter une limite si pas déjà présente
      let finalQuery = query.trim();
      if (!finalQuery.toLowerCase().includes('limit') && limit > 0) {
        finalQuery += ` LIMIT ${limit}`;
      }

      console.log(`🔍 Exécution requête ${database}:`, finalQuery);
      
      const result = await client.query(finalQuery);
      
      return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields?.map(f => ({
          name: f.name,
          dataTypeID: f.dataTypeID
        })),
        database: database,
        query: finalQuery
      };
    } catch (error) {
      console.error(`❌ Erreur requête ${database}:`, error);
      throw new Error(`Erreur lors de l'exécution de la requête: ${error.message}`);
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  async listTables(database: 'sync' | 'app', schema: string = 'public'): Promise<TableInfo[]> {
    const query = `
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = $1 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const result = await this.executeQuery(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = '${schema}' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, database);
    
    return result.rows;
  }

  async describeTable(tableName: string, database: 'sync' | 'app', schema: string = 'public'): Promise<any> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns 
      WHERE table_schema = '${schema}' 
      AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `;
    
    const result = await this.executeQuery(query, database);
    
    return {
      table_name: tableName,
      table_schema: schema,
      columns: result.rows
    };
  }

  async analyzeData(tableName: string, database: 'sync' | 'app', columns?: string[]): Promise<any> {
    try {
      // Requête de base pour compter les lignes
      const countResult = await this.executeQuery(
        `SELECT COUNT(*) as total_rows FROM "${tableName}"`,
        database
      );

      const totalRows = parseInt(countResult.rows[0]?.total_rows || '0');

      // Si des colonnes spécifiques sont demandées
      if (columns && columns.length > 0) {
        const columnStats: any[] = [];
        
        for (const column of columns) {
          try {
            const stats = await this.executeQuery(
              `SELECT 
                COUNT(DISTINCT "${column}") as unique_values,
                COUNT("${column}") as non_null_count
               FROM "${tableName}"`,
              database
            );
            
            columnStats.push({
              column_name: column,
              ...stats.rows[0]
            });
          } catch (error: any) {
            columnStats.push({
              column_name: column,
              error: error.message
            });
          }
        }

        return {
          table_name: tableName,
          total_rows: totalRows,
          column_statistics: columnStats
        };
      }

      return {
        table_name: tableName,
        total_rows: totalRows,
        database: database
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'analyse de ${tableName}: ${error.message}`);
    }
  }

  async getTableSchema(database: 'sync' | 'app'): Promise<string> {
    try {
      const tables = await this.listTables(database);
      let schema = `Base de données: ${database}\n\nTables disponibles:\n`;

      for (const table of tables) {
        schema += `\n- ${table.table_name}\n`;
        
        try {
          const description = await this.describeTable(table.table_name, database);
          if (description && description.columns) {
            schema += `  Colonnes:\n`;
            description.columns.forEach((col: ColumnInfo) => {
              schema += `    - ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}\n`;
            });
          }
        } catch (error) {
          schema += `  (Erreur lors de la description de la table: ${error.message})\n`;
        }
      }

      return schema;
    } catch (error) {
      console.error('Erreur lors de la récupération du schéma:', error);
      return `Erreur lors de la récupération du schéma de la base de données ${database}: ${error.message}`;
    }
  }
} 