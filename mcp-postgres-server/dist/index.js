#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListResourcesRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { Pool } from 'pg';
import { config } from 'dotenv';
// Charger les variables d'environnement
config();
class TechnidalleMCPServer {
    server;
    syncPool;
    appPool;
    syncConnected = false;
    appConnected = false;
    constructor() {
        this.server = new Server({
            name: process.env.MCP_SERVER_NAME || 'technidalle-postgres-multi',
            version: process.env.MCP_SERVER_VERSION || '1.0.0',
        }, {
            capabilities: {
                resources: {},
                tools: {},
            },
        });
        this.setupHandlers();
        this.initializeDatabases();
    }
    getSyncDatabaseConfig() {
        return {
            host: process.env.POSTGRES_SYNC_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_SYNC_PORT || '5433'),
            user: process.env.POSTGRES_SYNC_USER || 'sync_user',
            password: process.env.POSTGRES_SYNC_PASSWORD || 'sync_password',
            database: process.env.POSTGRES_SYNC_DATABASE || 'sync_db',
        };
    }
    getAppDatabaseConfig() {
        return {
            host: process.env.POSTGRES_APP_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_APP_PORT || '5432'),
            user: process.env.POSTGRES_APP_USER || 'postgres',
            password: process.env.POSTGRES_APP_PASSWORD || 'postgres',
            database: process.env.POSTGRES_APP_DATABASE || 'postgres',
        };
    }
    async initializeDatabases() {
        const syncConfig = this.getSyncDatabaseConfig();
        const appConfig = this.getAppDatabaseConfig();
        // Pool pour postgres_sync
        this.syncPool = new Pool({
            ...syncConfig,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        this.syncPool.on('error', (err) => {
            console.error('Erreur inattendue du pool PostgreSQL Sync:', err);
            this.syncConnected = false;
        });
        // Pool pour postgres_app
        this.appPool = new Pool({
            ...appConfig,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
        this.appPool.on('error', (err) => {
            console.error('Erreur inattendue du pool PostgreSQL App:', err);
            this.appConnected = false;
        });
        // Test des connexions
        try {
            const syncClient = await this.syncPool.connect();
            await syncClient.query('SELECT NOW()');
            syncClient.release();
            this.syncConnected = true;
            console.log('✅ Connexion à postgres_sync établie avec succès');
        }
        catch (error) {
            console.error('❌ Erreur de connexion à postgres_sync:', error);
            this.syncConnected = false;
        }
        try {
            const appClient = await this.appPool.connect();
            await appClient.query('SELECT NOW()');
            appClient.release();
            this.appConnected = true;
            console.log('✅ Connexion à postgres_app établie avec succès');
        }
        catch (error) {
            console.error('❌ Erreur de connexion à postgres_app:', error);
            this.appConnected = false;
        }
    }
    getPool(database) {
        switch (database) {
            case 'sync':
                return this.syncPool;
            case 'app':
                return this.appPool;
            default:
                throw new Error(`Base de données inconnue: ${database}. Utilisez 'sync' ou 'app'.`);
        }
    }
    isConnected(database) {
        switch (database) {
            case 'sync':
                return this.syncConnected;
            case 'app':
                return this.appConnected;
            default:
                return false;
        }
    }
    setupHandlers() {
        // Handler pour lister les outils disponibles
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'execute_query_sync',
                        description: 'Exécuter une requête SQL en lecture seule sur la base postgres_sync',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Requête SQL à exécuter (SELECT uniquement)',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Limite du nombre de résultats (défaut: 100)',
                                    default: 100,
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'execute_query_app',
                        description: 'Exécuter une requête SQL en lecture seule sur la base postgres_app',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Requête SQL à exécuter (SELECT uniquement)',
                                },
                                limit: {
                                    type: 'number',
                                    description: 'Limite du nombre de résultats (défaut: 100)',
                                    default: 100,
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'list_tables_sync',
                        description: 'Lister toutes les tables disponibles dans postgres_sync',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                schema: {
                                    type: 'string',
                                    description: 'Nom du schéma (défaut: public)',
                                    default: 'public',
                                },
                            },
                        },
                    },
                    {
                        name: 'list_tables_app',
                        description: 'Lister toutes les tables disponibles dans postgres_app',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                schema: {
                                    type: 'string',
                                    description: 'Nom du schéma (défaut: public)',
                                    default: 'public',
                                },
                            },
                        },
                    },
                    {
                        name: 'describe_table_sync',
                        description: 'Obtenir la structure détaillée d\'une table dans postgres_sync',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                table_name: {
                                    type: 'string',
                                    description: 'Nom de la table à décrire',
                                },
                                schema: {
                                    type: 'string',
                                    description: 'Nom du schéma (défaut: public)',
                                    default: 'public',
                                },
                            },
                            required: ['table_name'],
                        },
                    },
                    {
                        name: 'describe_table_app',
                        description: 'Obtenir la structure détaillée d\'une table dans postgres_app',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                table_name: {
                                    type: 'string',
                                    description: 'Nom de la table à décrire',
                                },
                                schema: {
                                    type: 'string',
                                    description: 'Nom du schéma (défaut: public)',
                                    default: 'public',
                                },
                            },
                            required: ['table_name'],
                        },
                    },
                    {
                        name: 'analyze_data_sync',
                        description: 'Analyser les données d\'une table dans postgres_sync (comptages, statistiques)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                table_name: {
                                    type: 'string',
                                    description: 'Nom de la table à analyser',
                                },
                                columns: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Colonnes spécifiques à analyser (optionnel)',
                                },
                            },
                            required: ['table_name'],
                        },
                    },
                    {
                        name: 'analyze_data_app',
                        description: 'Analyser les données d\'une table dans postgres_app (comptages, statistiques)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                table_name: {
                                    type: 'string',
                                    description: 'Nom de la table à analyser',
                                },
                                columns: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Colonnes spécifiques à analyser (optionnel)',
                                },
                            },
                            required: ['table_name'],
                        },
                    },
                ],
            };
        });
        // Handler pour lister les ressources
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            const resources = [];
            // Ressources de postgres_sync
            if (this.syncConnected) {
                try {
                    const syncResult = await this.syncPool.query(`
            SELECT 
              schemaname,
              tablename,
              hasindexes,
              hasrules,
              hastriggers
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
          `);
                    const syncResources = syncResult.rows.map((table) => ({
                        uri: `postgres_sync://${table.schemaname}/${table.tablename}`,
                        name: `[SYNC] Table: ${table.tablename}`,
                        description: `Table ${table.tablename} dans postgres_sync (${table.schemaname})`,
                        mimeType: 'application/json',
                    }));
                    resources.push(...syncResources);
                }
                catch (error) {
                    console.error('Erreur lors de la récupération des ressources sync:', error);
                }
            }
            // Ressources de postgres_app
            if (this.appConnected) {
                try {
                    const appResult = await this.appPool.query(`
            SELECT 
              schemaname,
              tablename,
              hasindexes,
              hasrules,
              hastriggers
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
          `);
                    const appResources = appResult.rows.map((table) => ({
                        uri: `postgres_app://${table.schemaname}/${table.tablename}`,
                        name: `[APP] Table: ${table.tablename}`,
                        description: `Table ${table.tablename} dans postgres_app (${table.schemaname})`,
                        mimeType: 'application/json',
                    }));
                    resources.push(...appResources);
                }
                catch (error) {
                    console.error('Erreur lors de la récupération des ressources app:', error);
                }
            }
            return { resources };
        });
        // Handler pour lire une ressource
        this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
            const uri = request.params.uri;
            const match = uri.match(/^postgres_sync:\/\/([^\/]+)\/(.+)$/);
            if (!match) {
                throw new Error('URI de ressource invalide');
            }
            const [, schema, tableName] = match;
            try {
                // Obtenir la structure de la table
                const structureResult = await this.syncPool.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schema, tableName]);
                // Obtenir un échantillon de données
                const sampleResult = await this.syncPool.query(`
          SELECT * FROM "${schema}"."${tableName}" LIMIT 5
        `);
                const content = {
                    schema: schema,
                    table: tableName,
                    structure: structureResult.rows,
                    sample_data: sampleResult.rows,
                    row_count: sampleResult.rowCount,
                };
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'application/json',
                            text: JSON.stringify(content, null, 2),
                        },
                    ],
                };
            }
            catch (error) {
                throw new Error(`Erreur lors de la lecture de la ressource: ${error}`);
            }
        });
        // Handler pour exécuter les outils
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            if (!this.isConnected('sync') && !this.isConnected('app')) {
                throw new Error('Pas de connexion à la base de données');
            }
            if (!args) {
                throw new Error('Arguments manquants');
            }
            switch (name) {
                case 'execute_query_sync':
                    return this.executeQuery(args.query, args.limit, 'sync');
                case 'execute_query_app':
                    return this.executeQuery(args.query, args.limit, 'app');
                case 'list_tables_sync':
                    return this.listTables(args.schema, 'sync');
                case 'list_tables_app':
                    return this.listTables(args.schema, 'app');
                case 'describe_table_sync':
                    return this.describeTable(args.table_name, args.schema, 'sync');
                case 'describe_table_app':
                    return this.describeTable(args.table_name, args.schema, 'app');
                case 'analyze_data_sync':
                    return this.analyzeData(args.table_name, 'sync', args.columns);
                case 'analyze_data_app':
                    return this.analyzeData(args.table_name, 'app', args.columns);
                default:
                    throw new Error(`Outil inconnu: ${name}`);
            }
        });
    }
    async executeQuery(query, limit = 100, database) {
        // Vérifier que c'est une requête SELECT
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery.startsWith('select')) {
            throw new Error('Seules les requêtes SELECT sont autorisées');
        }
        // Ajouter une limite si elle n'est pas présente
        let finalQuery = query;
        if (!trimmedQuery.includes('limit')) {
            finalQuery = `${query} LIMIT ${limit}`;
        }
        try {
            const pool = this.getPool(database);
            const result = await pool.query(finalQuery);
            return {
                content: [
                    {
                        type: 'text',
                        text: `✅ Requête exécutée avec succès\n\n` +
                            `📊 Résultats: ${result.rowCount} lignes\n\n` +
                            `📋 Données:\n${JSON.stringify(result.rows, null, 2)}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Erreur lors de l'exécution de la requête: ${error}`);
        }
    }
    async listTables(schema = 'public', database) {
        try {
            const pool = this.getPool(database);
            const result = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          tableowner,
          hasindexes,
          hasrules,
          hastriggers
        FROM pg_tables 
        WHERE schemaname = $1
        ORDER BY tablename
      `, [schema]);
            const tableList = result.rows.map(table => `📋 ${table.tablename} (propriétaire: ${table.tableowner})`).join('\n');
            return {
                content: [
                    {
                        type: 'text',
                        text: `🗃️ Tables dans le schéma '${schema}':\n\n${tableList}\n\n` +
                            `📊 Total: ${result.rowCount} tables`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Erreur lors de la récupération des tables: ${error}`);
        }
    }
    async describeTable(tableName, schema = 'public', database) {
        try {
            const pool = this.getPool(database);
            const result = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, tableName]);
            if (result.rowCount === 0) {
                throw new Error(`Table '${tableName}' introuvable dans le schéma '${schema}'`);
            }
            const columns = result.rows.map(col => {
                let typeInfo = col.data_type;
                if (col.character_maximum_length) {
                    typeInfo += `(${col.character_maximum_length})`;
                }
                else if (col.numeric_precision) {
                    typeInfo += `(${col.numeric_precision}${col.numeric_scale ? `,${col.numeric_scale}` : ''})`;
                }
                return `📌 ${col.column_name}: ${typeInfo} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`;
            }).join('\n');
            return {
                content: [
                    {
                        type: 'text',
                        text: `🏗️ Structure de la table '${schema}.${tableName}':\n\n${columns}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Erreur lors de la description de la table: ${error}`);
        }
    }
    async analyzeData(tableName, database, columns) {
        try {
            // Compter le nombre total de lignes
            const pool = this.getPool(database);
            const countResult = await pool.query(`SELECT COUNT(*) as total FROM "${tableName}"`);
            const totalRows = countResult.rows[0].total;
            let analysis = `📊 Analyse de la table '${tableName}':\n\n`;
            analysis += `📈 Nombre total de lignes: ${totalRows}\n\n`;
            // Si des colonnes spécifiques sont demandées
            if (columns && columns.length > 0) {
                for (const column of columns) {
                    const distinctResult = await pool.query(`
            SELECT COUNT(DISTINCT "${column}") as distinct_count,
                   COUNT("${column}") as non_null_count
            FROM "${tableName}"
          `);
                    const stats = distinctResult.rows[0];
                    analysis += `🔍 Colonne '${column}':\n`;
                    analysis += `  - Valeurs distinctes: ${stats.distinct_count}\n`;
                    analysis += `  - Valeurs non-nulles: ${stats.non_null_count}\n`;
                    analysis += `  - Valeurs nulles: ${totalRows - stats.non_null_count}\n\n`;
                }
            }
            else {
                // Analyse générale de toutes les colonnes
                const columnsResult = await pool.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position
        `, [tableName]);
                analysis += `🏗️ Colonnes disponibles: ${columnsResult.rows.map(r => r.column_name).join(', ')}\n`;
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: analysis,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Erreur lors de l'analyse des données: ${error}`);
        }
    }
    async run() {
        // En mode conteneur, on garde le serveur en vie sans stdio
        if (process.env.NODE_ENV === 'production' || process.env.DOCKER_MODE === 'true') {
            console.log('🚀 Serveur MCP Technidalle PostgreSQL démarré en mode conteneur');
            console.log('📊 État des connexions:');
            console.log(`  - postgres_sync: ${this.syncConnected ? '✅ connecté' : '❌ déconnecté'}`);
            console.log(`  - postgres_app: ${this.appConnected ? '✅ connecté' : '❌ déconnecté'}`);
            // Garder le processus en vie en mode conteneur
            setInterval(() => {
                const timestamp = new Date().toISOString();
                console.log(`💓 [${timestamp}] Serveur MCP en vie - Connexions: sync=${this.syncConnected}, app=${this.appConnected}`);
            }, 60000); // Log toutes les minutes
            // Maintenir le processus en vie indéfiniment
            await new Promise(() => { });
        }
        else {
            // Mode développement avec stdio
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.log('🚀 Serveur MCP Technidalle PostgreSQL démarré en mode développement');
        }
    }
    async cleanup() {
        if (this.syncPool) {
            await this.syncPool.end();
        }
        if (this.appPool) {
            await this.appPool.end();
        }
    }
}
// Point d'entrée principal
async function main() {
    const server = new TechnidalleMCPServer();
    // Gestion propre de l'arrêt
    process.on('SIGINT', async () => {
        console.log('\n🛑 Arrêt du serveur MCP...');
        await server.cleanup();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('\n🛑 Arrêt du serveur MCP...');
        await server.cleanup();
        process.exit(0);
    });
    try {
        await server.run();
    }
    catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
//# sourceMappingURL=index.js.map