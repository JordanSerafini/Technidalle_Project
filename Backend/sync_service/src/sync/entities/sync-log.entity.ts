// Remplacez par le chemin réel si QueryService est dans un autre dossier
// import { QueryService } from '../../services/query.service';

export class SyncLog {
  id?: number;
  sync_type: string;
  run_at: Date;
  status: string; // 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE'
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  source_entity?: string;
  target_table?: string;
  duration_ms?: number;
  details?: string; // Error messages, IDs of failed items
  error_details?: string; // Full error stack trace for total failure

  constructor(data: Partial<SyncLog> & { sync_type: string; status: string }) {
    this.sync_type = data.sync_type;
    this.status = data.status;
    this.items_processed = data.items_processed || 0;
    this.items_succeeded = data.items_succeeded || 0;
    this.items_failed = data.items_failed || 0;
    this.run_at = data.run_at || new Date();
    this.source_entity = data.source_entity;
    this.target_table = data.target_table;
    this.duration_ms = data.duration_ms;
    this.details = data.details;
    this.error_details = data.error_details;
  }
}
