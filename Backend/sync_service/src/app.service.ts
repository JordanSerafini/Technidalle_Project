import EBPclient from './clients/ebpClient';
import { Injectable, Logger } from '@nestjs/common';
import { pgClient } from './clients/PgClient';

interface TableInfo {
  tableName: string;
  columns: Column[];
}

interface Column {
  name: string;
  type: string;
}

interface EbpQueryResult {
  recordset: Record<string, any>[];
}

interface PgQueryResult {
  rows: Record<string, any>[];
}

const synchro_Controller = {
  getTables: async (): Promise<TableInfo[]> => {
    const query = `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
    `;

    try {
      const result = (await EBPclient.query(query)) as EbpQueryResult;
      const tables: TableInfo[] = [];

      for (const record of result.recordset) {
        const tableName = String(record.TABLE_NAME);
        const columnsQuery = `
          SELECT COLUMN_NAME, DATA_TYPE
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_NAME = '${tableName}'
        `;
        const columnsResult = (await EBPclient.query(
          columnsQuery,
        )) as EbpQueryResult;
        const columns: Column[] = columnsResult.recordset.map((column) => ({
          name: String(column.COLUMN_NAME),
          type: String(column.DATA_TYPE),
        }));

        tables.push({ tableName, columns });
      }

      return tables;
    } catch (error) {
      Logger.error('Error getting tables:', error);
      throw new Error(
        `Erreur lors de la récupération des tables: ${(error as Error).message}`,
      );
    }
  },

  generateCreateTableScript: (tableInfo: TableInfo): string => {
    let script = `CREATE TABLE IF NOT EXISTS "${tableInfo.tableName}" (\n`;

    tableInfo.columns.forEach((column, index) => {
      let pgDataType: string;
      switch (column.type) {
        case 'nvarchar':
        case 'varchar':
        case 'nchar':
          pgDataType = 'TEXT';
          break;
        case 'int':
          pgDataType = 'INTEGER';
          break;
        case 'varbinary':
          pgDataType = 'BYTEA';
          break;
        case 'uniqueidentifier':
          pgDataType = 'UUID';
          break;
        case 'decimal':
          pgDataType = 'DECIMAL';
          break;
        case 'tinyint':
          pgDataType = 'SMALLINT';
          break;
        case 'smallint':
          pgDataType = 'SMALLINT';
          break;
        case 'datetime':
          pgDataType = 'TIMESTAMP';
          break;
        case 'bit':
          pgDataType = 'BOOLEAN';
          break;
        case 'float':
          pgDataType = 'REAL';
          break;
        default:
          pgDataType = 'TEXT';
          throw new Error(`Type de données non géré : ${column.type}`);
      }

      script += `    "${column.name}" ${pgDataType}`;
      if (index < tableInfo.columns.length - 1) {
        script += ',';
      }
      script += '\n';
    });

    script += ');';

    return script;
  },

  createTables: async (): Promise<void> => {
    try {
      const tables = await synchro_Controller.getTables();

      for (const tableInfo of tables) {
        const createTableScript =
          synchro_Controller.generateCreateTableScript(tableInfo);
        try {
          await pgClient.query(createTableScript);
          Logger.log(`Table ${tableInfo.tableName} créée avec succès.`);
        } catch (queryError) {
          Logger.error(
            `Erreur lors de la création de la table ${tableInfo.tableName}:`,
            queryError,
          );
          throw queryError;
        }
      }

      Logger.log('Toutes les tables ont été créées avec succès.');
    } catch (error) {
      Logger.error('Erreur lors de la création des tables:', error);
      throw new Error(
        `Erreur lors de la création des tables: ${(error as Error).message}`,
      );
    }
  },

  formatValue(value: unknown, dataType: string): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'string') {
      value = value.replace(/'/g, "''");
    }

    switch (dataType) {
      case 'nvarchar':
      case 'varchar':
      case 'nchar':
        return `'${value}'`;
      case 'uniqueidentifier':
        return `'${value}'`;
      case 'datetime':
        if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        }
        return `'${String(value)}'`;
      case 'int':
      case 'decimal':
      case 'tinyint':
      case 'smallint':
      case 'float':
        return `${value}`;
      case 'bit':
        return value ? 'true' : 'false';
      case 'varbinary':
        // Vous pouvez ajouter ici la gestion des valeurs varbinary si nécessaire
        return `'${value}'`;
      case 'boolean':
        return value ? 'true' : 'false';
      case undefined:
        return 'NULL';
      default:
        throw new Error(`Type de données non géré : ${dataType}`);
    }
  },

  generateInsertQuery: (
    tableInfo: TableInfo,
    rowData: Record<string, unknown>,
    existingColumns: string[],
  ): string => {
    const columns = Object.keys(rowData).filter((column) =>
      existingColumns.includes(column),
    );
    const values = columns.map((column) => {
      const value = rowData[column];
      const columnDef = tableInfo.columns.find((col) => col.name === column);

      if (!columnDef) {
        throw new Error(
          `Colonne ${column} non trouvée dans la définition de la table ${tableInfo.tableName}`,
        );
      }

      return synchro_Controller.formatValue(value, columnDef.type);
    });
    const quotedColumns = columns.map((column) => `"${column}"`);
    return `INSERT INTO "${tableInfo.tableName}" (${quotedColumns.join(
      ', ',
    )}) VALUES (${values.join(', ')})`;
  },

  insertDataFromMSSQLToPGSQLSelect: async (): Promise<void> => {
    try {
      const startTime = Date.now();
      const tables = await synchro_Controller.getTables();

      Logger.log("Début du processus d'insertion des données...");
      const allowedTables = ["Customer", "Item", "StockDocument", "StockDocumentLine", "Address", "Supplier", "SupplierItem", "SaleDocumentLine", "Storehouse", "ScheduleEvent", "ScheduleEventType", "MaintenanceContract", "MaintenanceContractAssociatedFiles", "MaintenanceContractFamily", "MaintenanceContractPurchaseDocument"];

      //const allowedTables = ['Item'];

      for (const tableInfo of tables) {
        if (!allowedTables.includes(tableInfo.tableName)) {
          Logger.log(
            `Insertion dans la table '${tableInfo.tableName}' ignorée.`,
          );
          continue;
        }

        Logger.log(
          `Démarrage de l'insertion dans la table: ${tableInfo.tableName}`,
        );

        const selectQuery = `SELECT * FROM "${tableInfo.tableName}"`;
        let result: EbpQueryResult;
        try {
          result = (await EBPclient.query(selectQuery)) as EbpQueryResult;
        } catch (err) {
          Logger.error(
            `Erreur lors de la requête de données de la table ${tableInfo.tableName}:`,
            err,
          );
          continue;
        }

        const existingColumns = await synchro_Controller.getExistingColumns(
          tableInfo.tableName,
        );

        const numRows = result.recordset.length;
        let successfulInserts = 0;

        const insertQueries = result.recordset.map((rowData) =>
          synchro_Controller.generateInsertQuery(
            tableInfo,
            rowData as Record<string, unknown>,
            existingColumns,
          ),
        );

        for (const insertQuery of insertQueries) {
          try {
            await pgClient.query(insertQuery);
            successfulInserts++;
          } catch (error) {
            Logger.error(
              `Erreur pendant l'insertion dans la table "${tableInfo.tableName}":`,
              error,
            );
            Logger.log(`Requête incorrecte: ${insertQuery}`);
          }
        }

        Logger.log(
          `Table: "${tableInfo.tableName}", Insertions réussies : ${successfulInserts} sur ${numRows}`,
        );
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      Logger.log(`Temps d'exécution total : ${executionTime} ms`);
      Logger.log("Processus d'insertion des données terminé.");
    } catch (error) {
      Logger.error("Erreur globale dans le processus d'insertion :", error);
    }
  },

  insertDataFromMSSQLToPGSQL_ALL: async (): Promise<void> => {
    try {
      const startTime = Date.now();
      const tables = await synchro_Controller.getTables();

      Logger.log("Début du processus d'insertion de TOUTES les données...");

      for (const tableInfo of tables) {
        Logger.log(
          `Démarrage de l'insertion dans la table: ${tableInfo.tableName}`,
        );

        const selectQuery = `SELECT * FROM "${tableInfo.tableName}"`;
        let result: EbpQueryResult;
        try {
          result = (await EBPclient.query(selectQuery)) as EbpQueryResult;
        } catch (err) {
          Logger.error(
            `Erreur lors de la requête de données de la table ${tableInfo.tableName}:`,
            err,
          );
          continue;
        }

        const existingColumns = await synchro_Controller.getExistingColumns(
          tableInfo.tableName,
        );

        const numRows = result.recordset.length;
        let successfulInserts = 0;

        const insertQueries = result.recordset.map((rowData) =>
          synchro_Controller.generateInsertQuery(
            tableInfo,
            rowData as Record<string, unknown>,
            existingColumns,
          ),
        );

        for (const insertQuery of insertQueries) {
          try {
            await pgClient.query(insertQuery);
            successfulInserts++;
          } catch (error) {
            Logger.error(
              `Erreur pendant l'insertion dans la table "${tableInfo.tableName}":`,
              error,
            );
            Logger.log(`Requête incorrecte: ${insertQuery}`);
          }
        }

        Logger.log(
          `Table: "${tableInfo.tableName}", Insertions réussies : ${successfulInserts} sur ${numRows}`,
        );
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      Logger.log(`Temps d'exécution total : ${executionTime} ms`);
      Logger.log("Processus d'insertion de TOUTES les données terminé.");
    } catch (error) {
      Logger.error("Erreur globale dans le processus d'insertion :", error);
    }
  },

  getExistingColumns: async (tableName: string): Promise<string[]> => {
    const query = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
    `;
    try {
      const result = (await pgClient.query(query, [
        tableName,
      ])) as PgQueryResult;
      return result.rows.map((row) => String(row.column_name));
    } catch (error) {
      Logger.error(
        `Erreur lors de la récupération des colonnes pour ${tableName}:`,
        error,
      );
      throw new Error(
        `Erreur lors de la récupération des colonnes: ${(error as Error).message}`,
      );
    }
  },

  dropAllTables: async (): Promise<void> => {
    try {
      const query = `
        DO $$ DECLARE
        r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `;
      await pgClient.query(query);
      Logger.log('Toutes les tables ont été supprimées avec succès.');
    } catch (error) {
      Logger.error('Erreur lors de la suppression des tables:', error);
      throw new Error(
        `Erreur lors de la suppression des tables: ${(error as Error).message}`,
      );
    }
  },

  truncateAllTables: async (): Promise<void> => {
    try {
      const query = `
        DO $$ DECLARE
        r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
            EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
          END LOOP;
        END $$;
      `;
      await pgClient.query(query);
      Logger.log('Toutes les tables ont été tronquées avec succès.');
    } catch (error) {
      Logger.error('Erreur lors du tronquage des tables:', error);
      throw new Error(
        `Erreur lors du tronquage des tables: ${(error as Error).message}`,
      );
    }
  },

  truncateTable: async (tableName: string): Promise<void> => {
    try {
      const query = `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`;
      await pgClient.query(query);
      Logger.log(`La table ${tableName} a été tronquée avec succès.`);
    } catch (error) {
      Logger.error(`Erreur lors du tronquage de la table ${tableName}:`, error);
      throw new Error(
        `Erreur lors du tronquage de la table: ${(error as Error).message}`,
      );
    }
  },
};

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    return 'Service de synchronisation EBP-PostgreSQL';
  }

  async getTables(): Promise<TableInfo[]> {
    return synchro_Controller.getTables();
  }

  generateCreateTableScript(tableInfo: TableInfo): string {
    return synchro_Controller.generateCreateTableScript(tableInfo);
  }

  async createTables(): Promise<void> {
    return synchro_Controller.createTables();
  }

  formatValue(value: unknown, dataType: string): string {
    return synchro_Controller.formatValue(value, dataType);
  }

  generateInsertQuery(
    tableInfo: TableInfo,
    rowData: Record<string, unknown>,
    existingColumns: string[],
  ): string {
    return synchro_Controller.generateInsertQuery(
      tableInfo,
      rowData,
      existingColumns,
    );
  }

  async insertDataFromMSSQLToPGSQLSelect(): Promise<void> {
    return synchro_Controller.insertDataFromMSSQLToPGSQLSelect();
  }

  async insertDataFromMSSQLToPGSQL_ALL(): Promise<void> {
    return synchro_Controller.insertDataFromMSSQLToPGSQL_ALL();
  }

  async getExistingColumns(tableName: string): Promise<string[]> {
    return synchro_Controller.getExistingColumns(tableName);
  }

  async dropAllTables(): Promise<void> {
    return synchro_Controller.dropAllTables();
  }

  async truncateAllTables(): Promise<void> {
    return synchro_Controller.truncateAllTables();
  }

  async truncateTable(tableName: string): Promise<void> {
    return synchro_Controller.truncateTable(tableName);
  }
}

export default synchro_Controller;
