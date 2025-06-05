import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration PostgreSQL avec variables d'environnement
const pgClient = new Client({
  user: process.env.SYNC_PG_USER || 'sync_user',
  host: process.env.SYNC_PG_HOST || 'localhost',
  database: process.env.SYNC_PG_DATABASE || 'sync_db',
  password: process.env.SYNC_PG_PASSWORD || 'sync_password',
  port: parseInt(process.env.SYNC_PG_PORT || '5433', 10),
});

pgClient
  .connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((e: Error) => console.error('Connection to PostgreSQL failed', e));

// Exécute une requête SQL avec des paramètres optionnels
const executeQuery = async (queryText: string, params: any[] = []) => {
  try {
    const res = await pgClient.query(queryText, params);
    return res.rows;
  } catch (err) {
    console.error('Error executing query', (err as Error).stack);
    throw err;
  }
};

// Démarre une transaction
const startTransaction = async () => {
  try {
    await pgClient.query('BEGIN');
  } catch (error) {
    console.error('Error starting transaction', error);
    throw error;
  }
};

// Valide (commit) une transaction
const commitTransaction = async () => {
  try {
    await pgClient.query('COMMIT');
  } catch (error) {
    console.error('Error committing transaction', error);
    throw error;
  }
};

// Annule (rollback) une transaction
const rollbackTransaction = async () => {
  try {
    await pgClient.query('ROLLBACK');
  } catch (error) {
    console.error('Error rolling back transaction', error);
    throw error;
  }
};

pgClient.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log(res.rows);
  }
});

export {
  pgClient,
  executeQuery,
  startTransaction,
  commitTransaction,
  rollbackTransaction,
};
