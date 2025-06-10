import { Module } from '@nestjs/common';
// TypeOrmModule n'est plus nécessaire ici pour les entités principales si QueryService est utilisé
// import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncDealsService } from './sync-deals.service';
import { QueryService } from '../services/query.service'; // Correction du chemin d'importation
import { EbpQueryService } from '../services/ebp-query.service';
import { ClientSyncService } from '../services/client-sync.service';
import { UnifiedSyncService } from '../services/unified-sync.service';
import { UnifiedProjectMapper } from './mappers/unified-project.mapper';
import { DocumentCompleteMapper } from './mappers/document-complete.mapper';
// Si PG_POOL est fourni par un module central, ce module pourrait ne pas avoir besoin de le déclarer.
// Sinon, vous devrez fournir PG_POOL ici ou dans un module importé.
// import { Pool } from 'pg';

// Les entités (SyncLog, Project, Client, Document) ne sont plus enregistrées via TypeOrmModule.forFeature ici

@Module({
  imports: [
    // Si QueryService ou PG_POOL sont dans d'autres modules, importez ces modules ici.
    // Exemple: DatabaseModule.register({ poolConfig: { ... } })
  ],
  providers: [
    SyncDealsService,
    QueryService, // Fournissez QueryService. Assurez-vous que PG_POOL est disponible pour lui.
    EbpQueryService, // Service pour les requêtes vers la base EBP source
    ClientSyncService,
    UnifiedSyncService,
    UnifiedProjectMapper,
    DocumentCompleteMapper,
    // Si PG_POOL n'est pas fourni globalement ou par un module importé, vous devez le fournir ici :
    // {
    //   provide: 'PG_POOL',
    //   useValue: new Pool({ /* votre configuration pg pool */ }),
    // },
  ],
  // controllers: [SyncController], // Раскомментируйте, если есть SyncController
  exports: [
    SyncDealsService, 
    UnifiedSyncService, 
    UnifiedProjectMapper, 
    DocumentCompleteMapper
  ], // Экспортируйте сервис, если он будет utilisоваться в других модулях
})
export class SyncModule {}
