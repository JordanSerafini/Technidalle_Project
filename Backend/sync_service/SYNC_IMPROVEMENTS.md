# Améliorations du Service de Synchronisation PostgreSQL → App

## 🚀 Vue d'ensemble

Le service de synchronisation a été considérablement amélioré pour gérer efficacement le mappage entre :
- **PostgreSQL Sync** (calque intermédiaire depuis EBP MSSQL) 
- **PostgreSQL App** (base de données finale de l'application Technidalle)

## 📋 Architecture Améliorée

### Flux de Données
```
EBP (MSSQL) → PostgreSQL Sync → PostgreSQL App
     ✅              🔧 (amélioré)
```

### Nouveau Service : `PgToAppSyncService`

Le service `src/services/pg-to-app-sync.service.ts` remplace et améliore les anciens mappages avec :

#### ✨ Fonctionnalités Clés
- **Gestion d'erreurs robuste** avec transactions
- **Mapping intelligent** Deals + ConstructionSite → Projects
- **Synchronisation complète** des documents avec leurs lignes
- **Logging détaillé** pour le debugging
- **Gestion des conflits** avec `ON CONFLICT DO UPDATE`

## 🔄 Mappages Implémentés

### 1. **Clients (`Customer` → `clients`)**
```sql
-- Mapping intelligent des contacts
Customer.Name → clients.company_name
Customer.MainInvoicingContact_* → clients.firstname/lastname/email
Customer.Siren → clients.siret
```

### 2. **Projets Unifiés (`Deal` + `ConstructionSite` → `projects`)**
```sql
-- Les deux sources deviennent des projets
Deal.Id → projects.reference = "DEAL-{id}"
ConstructionSite.Id → projects.reference = "PROJECT-{id}"
```

### 3. **Documents avec Lignes**
```sql
-- Documents complets avec leurs détails
SaleDocument + SaleDocumentLine → documents + document_lines
ConstructionSiteReferenceDocument + ...Line → documents + document_lines
```

### 4. **Matériaux (`Item` → `materials`)**
```sql
-- Catalogue unifié
Item.Caption → materials.name
Item.SalePriceVatExcluded → materials.price
Item.RealStock → materials.stock_quantity
```

### 5. **Adresses Multiples**
```sql
-- Gestion facturation + livraison
MainInvoicingAddress_* → addresses (type: 'facturation')
MainDeliveryAddress_* → addresses (type: 'livraison')
```

## 🛠️ Nouveaux Endpoints

### Synchronisation Complète
```bash
POST /sync/pg-to-app/complete
# Synchronise tout : clients → adresses → projets → matériaux → documents
```

### Synchronisations Partielles
```bash
POST /sync/pg-to-app/clients     # Clients uniquement
POST /sync/pg-to-app/projects    # Projets (Deals + ConstructionSite)
POST /sync/pg-to-app/documents   # Documents avec lignes
POST /sync/pg-to-app/materials   # Matériaux
```

### Monitoring
```bash
GET /sync/pg-to-app/status       # Statut et compteurs
```

## 🔧 Gestion d'Erreurs Améliorée

### Transactions Sécurisées
```typescript
await client.query('BEGIN');
try {
  // Opérations de synchronisation
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  // Log et gestion d'erreur
}
```

### Validation des Données
- **Emails** : Validation regex + fallback auto-généré
- **Téléphones** : Nettoyage automatique des caractères non numériques
- **Références** : Unicité garantie avec préfixes (`DEAL-`, `PROJECT-`)

### Logging Structuré
```typescript
this.logger.log('✅ Clients: 120/125 synchronisés');
this.logger.warn('⚠️ Projet sans client trouvé');
this.logger.error('❌ Erreur base de données');
```

## 📊 Métriques de Performance

### Résultats Typiques
```javascript
{
  "success": true,
  "processed": 1250,
  "succeeded": 1247,
  "failed": 3,
  "duration": 2340, // ms
  "errors": ["Détails des erreurs..."]
}
```

### Optimisations
- **Batching intelligent** des requêtes
- **Réutilisation des connexions** PostgreSQL
- **Index optimisés** pour les recherches
- **Gestion mémoire** des gros datasets

## 🔄 Migration depuis l'Ancien Service

### Services Remplacés
- ❌ `src/pgToPg/pgSync.service.ts` (ancien)
- ✅ `src/services/pg-to-app-sync.service.ts` (nouveau)

### Points d'Attention
1. **Nouvelles références de projets** : Format `DEAL-123` / `PROJECT-456`
2. **Gestion des emails** : Auto-génération si invalide
3. **Adresses multiples** : Facturation + Livraison séparées
4. **Documents complets** : Inclut maintenant les lignes de détail

## 🚀 Utilisation

### Synchronisation Manuelle
```bash
# Synchronisation complète
curl -X POST http://localhost:3000/sync/pg-to-app/complete

# Clients seulement
curl -X POST http://localhost:3000/sync/pg-to-app/clients
```

### Intégration Code
```typescript
// Dans votre service
constructor(
  private readonly pgToAppSyncService: PgToAppSyncService
) {}

async syncData() {
  const result = await this.pgToAppSyncService.syncComplete();
  console.log(`Synchronisé ${result.succeeded}/${result.processed} éléments`);
}
```

## 📝 Logs et Debugging

### Niveaux de Log
- **INFO** : Progression générale
- **DEBUG** : Détails des mappages
- **WARN** : Données incomplètes mais traitées
- **ERROR** : Erreurs bloquantes

### Exemple de Log
```
🚀 Démarrage de la synchronisation PostgreSQL Sync → App
📋 Étape 1: Synchronisation des clients
✅ Clients: 1325/1325 synchronisés
🏗️ Étape 2: Synchronisation des projets  
✅ Projets: 456/456 synchronisés (280 deals + 176 projets)
📄 Étape 3: Synchronisation des documents
✅ Documents: 2340/2350 synchronisés (10 erreurs)
⏱️ Synchronisation terminée en 2.34s
```

## 🔒 Sécurité et Robustesse

### Validation des Données
- Échappement SQL automatique via paramètres
- Validation des types avant insertion
- Gestion des valeurs nulles/undefined

### Gestion des Pannes
- Rollback automatique en cas d'erreur
- Récupération partielle possible
- État cohérent garanti

## 📈 Prochaines Étapes

### Améliorations Prévues
1. **Synchronisation incrémentale** (delta uniquement)
2. **Planification automatique** (cron jobs)
3. **API WebSocket** pour suivi temps réel
4. **Cache intelligent** pour optimiser les performances
5. **Export/Import** de configurations de mapping

### Monitoring Avancé
- Dashboard temps réel
- Alertes en cas d'échec
- Métriques de performance historiques 