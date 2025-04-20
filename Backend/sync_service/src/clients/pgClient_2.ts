import { Pool, PoolConfig } from 'pg';

class PgClient2 {
  private pool: Pool;
  private static instance: PgClient2;

  private constructor() {
    const poolConfig: PoolConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      console.error('Erreur inattendue du client PostgreSQL', err);
      process.exit(-1);
    });

    console.log('Connexion à la base de données PostgreSQL établie');
  }

  public static getInstance(): PgClient2 {
    if (!PgClient2.instance) {
      PgClient2.instance = new PgClient2();
    }
    return PgClient2.instance;
  }

  public async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log(
        `Exécution de la requête: ${text} - Durée: ${duration}ms - Rows: ${res.rowCount}`,
      );
      return res;
    } catch (err) {
      console.error("Erreur lors de l'exécution de la requête", err);
      throw err;
    }
  }

  public async getClient() {
    const client = await this.pool.connect();
    return client;
  }

  public async closePool() {
    await this.pool.end();
  }
}

export default PgClient2.getInstance();
