import { PgSyncService } from '../pgToPg/pgSync.service';
import { SyncDealsService } from '../sync/sync-deals.service';
import { QueryService } from '../services/query.service';
import { ClientSyncService } from '../services/client-sync.service';

async function run() {
  const queryService = new QueryService();
  const clientSyncService = new ClientSyncService(queryService);
  const pgSyncService = new PgSyncService(queryService, clientSyncService);
  const syncDealsService = new SyncDealsService(queryService);

  console.log('Synchronisation des clients...');
  await pgSyncService.syncAllClients();

  console.log('Synchronisation des articles...');
  await pgSyncService.syncAllItems();

  console.log('Synchronisation des projets...');
  await pgSyncService.syncAllProjects();

  console.log('Synchronisation des documents...');
  await pgSyncService.syncDocuments();

  console.log('Synchronisation des affaires EBP...');
  await syncDealsService.syncAllEbpData();

  console.log('Synchronisation terminée');
}

run().catch((err) => {
  console.error('Erreur lors de la synchronisation', err);
  process.exit(1);
});
