# Architecture Microservices NestJS - Technidalle BTP

## 🏗️ Vue d'ensemble

Cette architecture microservices est conçue pour une application mobile BTP professionnelle utilisant une seule base de données `postgres_sync` sur le port 5433.

**Architecture complète avec 21 microservices** couvrant tous les aspects métier du BTP : commercial, opérationnel, financier, contrôle de gestion, retail et e-commerce.

## 📐 Diagramme Architecture

Voir le fichier `api_gateway/conception/erd.uml` pour le diagramme PlantUML complet de l'architecture.

## 🚀 Création des Microservices

### 1. API Gateway
```bash
cd Backend_EBP
nest new api-gateway
cd api-gateway
npm install @nestjs/graphql @apollo/server-express @nestjs/apollo
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/throttler @nestjs/cors
npm install @nestjs/microservices nats
```

### 2. Auth Service
```bash
cd Backend_EBP
nest new auth-service
cd auth-service
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/typeorm typeorm pg
npm install bcryptjs
npm install @nestjs/microservices nats
```

### 3. Clients Service
```bash
cd Backend_EBP
nest new clients-service
cd clients-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 4. Suppliers Service 
```bash
cd Backend_EBP
nest new suppliers-service
cd suppliers-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 5. Projects Service
```bash
cd Backend_EBP
nest new projects-service
cd projects-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 6. Planning Service
```bash
cd Backend_EBP
nest new planning-service
cd planning-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install @nestjs/schedule
npm install class-validator class-transformer
```

### 7. Documents Service
```bash
cd Backend_EBP
nest new documents-service
cd documents-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install multer @types/multer
npm install class-validator class-transformer
```

### 8. Inventory Service
```bash
cd Backend_EBP
nest new inventory-service
cd inventory-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 9. Users Service
```bash
cd Backend_EBP
nest new users-service
cd users-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 10. Equipment Service
```bash
cd Backend_EBP
nest new equipment-service
cd equipment-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 11. Maintenance Service 
```bash
cd Backend_EBP
nest new maintenance-service
cd maintenance-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install @nestjs/schedule
npm install class-validator class-transformer
```

### 12. Incidents Service 
```bash
cd Backend_EBP
nest new incidents-service
cd incidents-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install @nestjs/schedule
npm install class-validator class-transformer
```

### 13. Analytics Service
```bash
cd Backend_EBP
nest new analytics-service
cd analytics-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install @nestjs/schedule
npm install class-validator class-transformer
```

### 14. Finance Service
```bash
cd Backend_EBP
nest new finance-service
cd finance-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install @nestjs/schedule
npm install class-validator class-transformer
```

### 15. Commercial Service  
```bash
cd Backend_EBP
nest new commercial-service
cd commercial-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 16. Controlling Service
```bash
cd Backend_EBP
nest new controlling-service
cd controlling-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 17. POS Service ()
```bash
cd Backend_EBP
nest new pos-service
cd pos-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
npm install @nestjs/schedule
```

### 18. Loyalty Service ()
```bash
cd Backend_EBP
nest new loyalty-service
cd loyalty-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 19. Catalog Service ()
```bash
cd Backend_EBP
nest new catalog-service
cd catalog-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 20. Ecommerce Service ()
```bash
cd Backend_EBP
nest new ecommerce-service
cd ecommerce-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install class-validator class-transformer
```

### 21. Workflow Service ()
```bash
cd Backend_EBP
nest new workflow-service
cd workflow-service
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/microservices nats
npm install @nestjs/schedule
npm install class-validator class-transformer
```

## 🐳 Docker Compose

### Structure des ports
- **API Gateway**: 3000
- **Auth Service**: 3001  
- **Clients Service**: 3002
- **Suppliers Service**: 3003 
- **Projects Service**: 3004
- **Planning Service**: 3005
- **Documents Service**: 3006
- **Inventory Service**: 3007
- **Users Service**: 3008
- **Equipment Service**: 3009
- **Maintenance Service**: 3010 
- **Incidents Service**: 3011 
- **Analytics Service**: 3012
- **Finance Service**: 3013 
- **Commercial Service**: 3014 
- **Controlling Service**: 3015 
- **POS Service**: 3016 (🆕)
- **Loyalty Service**: 3017 (🆕)
- **Catalog Service**: 3018 (🆕)
- **Ecommerce Service**: 3019 (🆕)
- **Workflow Service**: 3020 (🆕)
- **PostgreSQL Sync**: 5433
- **NATS**: 4222
- **Redis**: 6379

## 📋 Tables par Microservice

### 🏢 Clients Service (Port 3002)
**Tables principales:**
- `Customer` - Clients principaux
- `CustomerFamily` - Familles de clients
- `CustomerSubFamily` - Sous-familles
- `Contact` - Contacts clients
- `Address` - Adresses
- `CustomerAssociatedFiles` - Fichiers associés

**Endpoints REST:**
```
GET    /clients                    # Liste des clients
GET    /clients/:id                # Détails d'un client
POST   /clients                    # Créer un client
PUT    /clients/:id                # Modifier un client
DELETE /clients/:id                # Supprimer un client
GET    /clients/:id/contacts       # Contacts d'un client
GET    /clients/:id/addresses      # Adresses d'un client
GET    /clients/:id/files          # Fichiers d'un client
```

### 🏭 Suppliers Service (Port 3003)
**Tables principales:**
- `Supplier` - Fournisseurs principaux
- `SupplierFamily` - Familles de fournisseurs
- `SupplierSubFamily` - Sous-familles
- `SupplierItem` - Articles fournisseurs
- `SupplierAssociatedFiles` - Fichiers associés

**Endpoints REST:**
```
GET    /suppliers                  # Liste des fournisseurs
GET    /suppliers/:id              # Détails d'un fournisseur
POST   /suppliers                  # Créer un fournisseur
PUT    /suppliers/:id              # Modifier un fournisseur
DELETE /suppliers/:id              # Supprimer un fournisseur
GET    /suppliers/:id/items        # Articles d'un fournisseur
GET    /suppliers/:id/files        # Fichiers d'un fournisseur
```

### 🏗️ Projects Service (Port 3004)
**Tables principales:**
- `Deal` - Projets/Affaires
- `ConstructionSite` - Chantiers
- `DealItem` - Articles des projets
- `DealColleague` - Équipe projet
- `DealCustomer` - Clients du projet
- `DealSupplier` - Fournisseurs du projet
- `DealAssociatedFiles` - Documents projet

**Endpoints REST:**
```
GET    /projects                   # Liste des projets
GET    /projects/:id               # Détails d'un projet
POST   /projects                   # Créer un projet
PUT    /projects/:id               # Modifier un projet
DELETE /projects/:id               # Supprimer un projet
GET    /projects/:id/sites         # Chantiers d'un projet
GET    /projects/:id/items         # Articles d'un projet
GET    /projects/:id/team          # Équipe d'un projet
GET    /projects/:id/suppliers     # Fournisseurs d'un projet
GET    /projects/:id/files         # Documents d'un projet
```

### 📅 Planning Service (Port 3005)
**Tables principales:**
- `ScheduleEvent` - Événements planning
- `ScheduleEventType` - Types d'événements
- `ScheduleEventTemplate` - Templates d'événements
- `ScheduleEventExpectedResource` - Ressources attendues
- `ScheduleEventAssociatedFiles` - Fichiers événements

**Endpoints REST:**
```
GET    /planning/events            # Liste des événements
GET    /planning/events/:id        # Détails d'un événement
POST   /planning/events            # Créer un événement
PUT    /planning/events/:id        # Modifier un événement
DELETE /planning/events/:id        # Supprimer un événement
GET    /planning/calendar/:date    # Planning par date
GET    /planning/colleague/:id     # Planning d'un collègue
GET    /planning/construction-site/:id # Planning d'un chantier
GET    /planning/conflicts         # Conflits de planning
```

### 📄 Documents Service (Port 3006)
**Tables principales:**
- `SaleDocument` - Documents de vente
- `SaleDocumentLine` - Lignes documents vente
- `PurchaseDocument` - Documents d'achat
- `PurchaseDocumentLine` - Lignes documents achat
- `AttachmentFile` - Fichiers attachés
- `DocumentSerial` - Numérotation documents

**Endpoints REST:**
```
GET    /documents                  # Liste des documents
GET    /documents/:id              # Détails d'un document
POST   /documents                  # Créer un document
PUT    /documents/:id              # Modifier un document
DELETE /documents/:id              # Supprimer un document
GET    /documents/:id/lines        # Lignes d'un document
GET    /documents/:id/attachments  # Pièces jointes
GET    /documents/by-type/:type    # Documents par type
GET    /documents/sale             # Documents de vente
GET    /documents/purchase         # Documents d'achat
```

### 📦 Inventory Service (Port 3007)
**Tables principales:**
- `Item` - Articles/Produits
- `ItemFamily` - Familles d'articles
- `ItemSubFamily` - Sous-familles
- `StockItem` - Stocks par entrepôt
- `StockMovement` - Mouvements de stock
- `StockDocument` - Documents de stock
- `Storehouse` - Entrepôts
- `Location` - Emplacements

**Endpoints REST:**
```
GET    /inventory/items            # Liste des articles
GET    /inventory/items/:id        # Détails d'un article
POST   /inventory/items            # Créer un article
PUT    /inventory/items/:id        # Modifier un article
GET    /inventory/stock/:item      # Stock d'un article
GET    /inventory/movements        # Mouvements de stock
GET    /inventory/storehouses      # Liste des entrepôts
GET    /inventory/locations        # Emplacements
GET    /inventory/low-stock        # Articles en rupture
```

### 👥 Users Service (Port 3008)
**Tables principales:**
- `Colleague` - Collaborateurs
- `ColleagueFamily` - Familles de collaborateurs
- `ColleagueFunction` - Fonctions
- `ColleagueCompetence` - Compétences collaborateurs
- `Competence` - Référentiel compétences

**Endpoints REST:**
```
GET    /users/colleagues           # Liste des collaborateurs
GET    /users/colleagues/:id       # Détails d'un collaborateur
POST   /users/colleagues           # Créer un collaborateur
PUT    /users/colleagues/:id       # Modifier un collaborateur
GET    /users/colleagues/:id/competences # Compétences d'un collaborateur
GET    /users/competences          # Référentiel compétences
GET    /users/colleagues/available # Collaborateurs disponibles
```

### 🔧 Equipment Service (Port 3009)
**Tables principales:**
- `Equipment` - Équipements
- `EquipmentFamily` - Familles d'équipements
- `EquipmentType` - Types d'équipements

**Endpoints REST:**
```
GET    /equipment                  # Liste des équipements
GET    /equipment/:id              # Détails d'un équipement
POST   /equipment                  # Créer un équipement
PUT    /equipment/:id              # Modifier un équipement
GET    /equipment/families         # Familles d'équipements
GET    /equipment/types            # Types d'équipements
GET    /equipment/available        # Équipements disponibles
```

### 🔧 Maintenance Service (Port 3010)
**Tables principales:**
- `MaintenanceContract` - Contrats de maintenance
- `MaintenanceContractFamily` - Familles de contrats
- `MaintenanceContractTemplate` - Templates de contrats
- `MaintenanceContractCommitment` - Engagements
- `MaintenanceContractCost` - Coûts
- `MaintenanceContractCustomerProduct` - Produits clients
- `MaintenanceContractAssociatedFiles` - Fichiers associés

**Endpoints REST:**
```
GET    /maintenance/contracts      # Liste des contrats
GET    /maintenance/contracts/:id  # Détails d'un contrat
POST   /maintenance/contracts      # Créer un contrat
PUT    /maintenance/contracts/:id  # Modifier un contrat
DELETE /maintenance/contracts/:id  # Supprimer un contrat
GET    /maintenance/due            # Maintenances dues
GET    /maintenance/alerts         # Alertes maintenance
GET    /maintenance/templates      # Templates de contrats
```

### 🚨 Incidents Service (Port 3011)
**Tables principales:**
- `Incident` - Incidents/Pannes
- `IncidentTemplate` - Templates d'incidents
- `IncidentCustomerProduct` - Produits clients concernés
- `IncidentExtraCost` - Coûts supplémentaires
- `IncidentAssociatedFiles` - Fichiers associés

**Endpoints REST:**
```
GET    /incidents                  # Liste des incidents
GET    /incidents/:id              # Détails d'un incident
POST   /incidents                  # Créer un incident
PUT    /incidents/:id              # Modifier un incident
DELETE /incidents/:id              # Supprimer un incident
GET    /incidents/open             # Incidents ouverts
GET    /incidents/urgent           # Incidents urgents
GET    /incidents/by-customer/:id  # Incidents par client
```

### 📊 Analytics Service (Port 3012)
**Tables principales:**
- `ModificationLog` - Logs de modifications
- `EventLog` - Logs d'événements
- `StatisticView` - Vues statistiques

**Endpoints REST:**
```
GET    /analytics/dashboard        # Tableau de bord
GET    /analytics/projects/stats   # Statistiques projets
GET    /analytics/clients/stats    # Statistiques clients
GET    /analytics/suppliers/stats  # Statistiques fournisseurs
GET    /analytics/planning/stats   # Statistiques planning
GET    /analytics/inventory/stats  # Statistiques stock
GET    /analytics/maintenance/stats # Statistiques maintenance
GET    /analytics/incidents/stats  # Statistiques incidents
GET    /analytics/reports/:type    # Rapports par type
```

### 💰 Finance Service (Port 3013)
**Tables principales:**
- `Bank` - Banques et paramètres SEPA
- `PaymentType` - Types de paiement
- `CashMovement` - Mouvements de trésorerie
- `AnalyticPlan` - Plans analytiques
- `AnalyticPlanItem` - Postes analytiques
- `TravelExpense` - Frais de déplacement
- `Ecotax` - Écotaxes produits
- `PeriodicInvoicing` - **🆕 Facturation périodique**
- `PeriodicInvoicingCustomer` - **🆕 Clients récurrents**
- `BankRemittance` - **🆕 Remises bancaires SEPA**
- `ReminderCommitment` - **🆕 Relances automatiques**
- `ReminderLetter` - **🆕 Lettres de relance**
- `UnpaidSaleSettlementLine` - **🆕 Gestion impayés**
- `Intrastat` - **🆕 Commerce international**
- `IntrastatLine` - **🆕 Lignes Intrastat**

**Endpoints REST enrichis:**
```
GET    /finance/banks              # Gestion multi-banques
GET    /finance/cash-movements     # Trésorerie temps réel
GET    /finance/payment-types      # Types paiement BTP
GET    /finance/travel-expenses    # Frais déplacement
POST   /finance/travel-expenses    # Saisir frais déplacement
GET    /finance/analytic/:project  # Comptabilité analytique par projet
GET    /finance/ecotax             # Calcul écotaxes
GET    /finance/sepa/export        # Export virements SEPA
GET    /finance/bank-charges       # Frais bancaires
GET    /finance/periodic-invoicing # **🆕 Facturation récurrente**
POST   /finance/periodic-invoicing # **🆕 Configurer facturation récurrente**
GET    /finance/reminders          # **🆕 Relances en cours**
POST   /finance/reminders/send     # **🆕 Envoyer relances**
GET    /finance/unpaid             # **🆕 Créances impayées**
GET    /finance/intrastat          # **🆕 Déclarations Intrastat**
POST   /finance/intrastat/generate # **🆕 Générer déclaration**
```

### 🎯 Commercial Service (Port 3014) 
**Tables principales:**
- `PriceList` - Listes de prix et promotions
- `PriceListCalculationLine` - Règles de calcul
- `GeographicSector` - Secteurs géographiques
- `Activity` - Activités commerciales
- `ServiceType` - Types de services
- `ComplementaryDiscount` - Remises complémentaires

**Endpoints REST:**
```
GET    /commercial/price-lists     # Tarifs dynamiques
GET    /commercial/price-lists/:id/calculate # Calcul prix
GET    /commercial/geographic-sectors # Zones d'intervention
GET    /commercial/activities      # Activités CRM
POST   /commercial/activities      # Créer activité commerciale
GET    /commercial/service-types   # Services BTP
GET    /commercial/discounts       # Remises disponibles
GET    /commercial/promotions      # Promotions actives
GET    /commercial/quotations      # Devis en cours
```

### 📊 Controlling Service (Port 3015) 
**Tables principales:**
- `DealResourcesCost` - Coûts ressources projets
- `DealExtraCost` - Coûts supplémentaires
- `CommissionScale` - Barèmes commissions
- `ModificationLog` - Logs modifications
- `StatisticView` - Vues statistiques

**Endpoints REST:**
```
GET    /controlling/project-costs/:id # Coûts détaillés projet
GET    /controlling/extra-costs    # Surcoûts chantiers
POST   /controlling/extra-costs    # Ajouter surcoût
GET    /controlling/margins        # Calcul marges
GET    /controlling/profitability  # Rentabilité projets
GET    /controlling/budget-alerts  # Alertes dépassement budget
GET    /controlling/commissions    # Calcul commissions
GET    /controlling/resource-costs # Coûts ressources
GET    /controlling/kpi/:project   # KPI projet temps réel
```

### 🏪 POS Service (Port 3016) - 
**Tables principales:**
- `PosTerminal` - Terminaux de vente
- `PosSafe` - Caisses
- `PosTerminalOpenClose` - Ouvertures/fermetures
- `PosTerminalOpenCloseColleagueDetail` - Détails par vendeur
- `PosTerminalOpenClosePaymentTypeDetail` - Détails paiements
- `PosTerminalOpenCloseItemFamilyDetail` - Détails par famille

**Endpoints REST:**
```
GET    /pos/terminals              # Liste terminaux
GET    /pos/terminals/:id          # Détails terminal
POST   /pos/terminals/:id/open     # Ouvrir caisse
POST   /pos/terminals/:id/close    # Fermer caisse
GET    /pos/terminals/:id/status   # Statut caisse
GET    /pos/sales                  # Ventes POS
POST   /pos/sales                  # Nouvelle vente
GET    /pos/payments               # Paiements POS
GET    /pos/daily-report/:date     # Rapport journalier
GET    /pos/sales-by-colleague     # Ventes par vendeur
```

### 🎁 Loyalty Service (Port 3017) - 
**Tables principales:**
- `LoyaltyCardType` - Types cartes fidélité
- `LoyaltyHistory` - Historique fidélité
- `LoyaltyCalculationLine` - Règles calcul points
- `LoyaltyInclusionLine` - Critères inclusion
- `GiftVoucher` - Bons cadeaux
- `FreeDiscountVoucher` - Bons de réduction
- `FreeDiscountVoucherCampaign` - Campagnes promo
- `DiscountCoupon` - Coupons de réduction
- `DiscountCouponItem` - Articles éligibles

**Endpoints REST:**
```
GET    /loyalty/cards/:customer    # Carte fidélité client
GET    /loyalty/points/:customer   # Points disponibles
POST   /loyalty/points/add         # Ajouter points
POST   /loyalty/points/redeem      # Échanger points
GET    /loyalty/vouchers           # Bons disponibles
POST   /loyalty/vouchers/use       # Utiliser bon
GET    /loyalty/campaigns          # Campagnes actives
GET    /loyalty/history/:customer  # Historique fidélité
POST   /loyalty/gift-vouchers      # Créer bon cadeau
GET    /loyalty/coupons/validate/:code # Valider coupon
```

### 📦 Catalog Service (Port 3018) - 
**Tables principales:**
- `RangeItem` - Articles de gammes
- `RangeTemplate` - Templates gammes
- `RangeTemplateElement` - Éléments templates
- `RangeType` - Types de gammes
- `RangeTypeElement` - Éléments types
- `RangeItemAssociatedFiles` - Fichiers gammes
- `StockRangeItem` - Stock gammes
- `LinkedItem` - Articles liés

**Endpoints REST:**
```
GET    /catalog/ranges             # Gammes produits BTP
GET    /catalog/ranges/:id         # Détails gamme
GET    /catalog/ranges/:id/items   # Articles d'une gamme
POST   /catalog/ranges             # Créer gamme
PUT    /catalog/ranges/:id         # Modifier gamme
GET    /catalog/templates          # Templates gammes
POST   /catalog/templates          # Créer template
GET    /catalog/types              # Types de gammes
GET    /catalog/linked-items/:id   # Articles liés
GET    /catalog/ranges/:id/stock   # Stock par gamme
POST   /catalog/ranges/:id/configure # Configurer gamme
```

### 🌐 Ecommerce Service (Port 3019) - 
**Tables principales:**
- `ContactEcommerceInfo` - Infos e-commerce contacts
- `ItemEcommerceInfo` - Infos e-commerce articles
- `SaleOrderEcommerceInfo` - Commandes web
- `CustomerWebSynchronizationInfo` - Sync clients web
- `ColleagueWebSynchronizationInfo` - Sync utilisateurs web
- `UnitWebSynchronizationInfo` - Sync unités web

**Endpoints REST:**
```
GET    /ecommerce/catalog          # Catalogue web
GET    /ecommerce/orders           # Commandes web
POST   /ecommerce/orders           # Nouvelle commande web
GET    /ecommerce/customers/:id/info # Infos e-commerce client
PUT    /ecommerce/customers/:id/sync # Synchroniser client
GET    /ecommerce/items/:id/web-info # Infos web article
PUT    /ecommerce/items/:id/publish  # Publier article
GET    /ecommerce/sync-status      # Statut synchronisation
POST   /ecommerce/sync/trigger     # Déclencher sync
GET    /ecommerce/web-orders/:status # Commandes par statut
```

### 🔄 Workflow Service (Port 3020) - 
**Tables principales:**
- `EbpSysWorkflow` - Workflows système
- `EbpSysWorkflowTemplate` - Templates workflows
- `EbpSysWorkflowDefaultTemplate` - Templates par défaut
- `EbpSysDashboard` - Tableaux de bord
- `EbpSysDashboardTemplate` - Templates dashboards
- `EbpSysDashboardPart` - Composants dashboards

**Endpoints REST:**
```
GET    /workflow/processes         # Processus actifs
GET    /workflow/processes/:id     # Détails processus
POST   /workflow/processes         # Démarrer processus
PUT    /workflow/processes/:id/step # Étape suivante
GET    /workflow/templates         # Templates workflows
POST   /workflow/templates         # Créer template
GET    /workflow/dashboards        # Dashboards utilisateur
POST   /workflow/dashboards        # Créer dashboard
GET    /workflow/dashboards/:id/data # Données dashboard
GET    /workflow/triggers          # Déclencheurs automatiques
POST   /workflow/triggers          # Créer déclencheur
```

## 🔐 Auth Service (Port 3001)
**Tables principales:**
- `EbpSysUser` - Utilisateurs système
- `EbpSysUserGroup` - Groupes utilisateurs
- `EbpSysUserConnection` - Connexions

**Endpoints REST:**
```
POST   /auth/login                 # Connexion
POST   /auth/refresh               # Rafraîchir token
POST   /auth/logout                # Déconnexion
GET    /auth/profile               # Profil utilisateur
PUT    /auth/profile               # Modifier profil
```

## 🔄 Communication Inter-Services

### Events (NATS) 
- **user.authenticated** → Diffusé après connexion
- **client.created/updated/deleted** → Gestion clients
- **supplier.created/updated/deleted** → Gestion fournisseurs
- **project.created/updated/status_changed** → Gestion projets
- **event.scheduled/updated/completed** → Gestion planning
- **document.created/validated/sent** → Gestion documents
- **stock.updated/item.low_stock** → Gestion stock
- **equipment.assigned/maintenance_due** → Gestion équipements
- **maintenance.contract_due/alert** → Alertes maintenance
- **incident.created/urgent/resolved** → Gestion incidents
- **bank.transaction_created** → Mouvements bancaires 
- **payment.processed** → Paiements traités 
- **travel_expense.submitted** → Frais déplacement 
- **price_list.updated** → Mises à jour tarifs 
- **activity.created** → Activités commerciales 
- **project.cost_updated** → Coûts projets 
- **budget.exceeded** → Dépassements budget 
- **pos.sale_created** → **🆕 Vente POS**
- **pos.cash_opened/closed** → **🆕 Ouverture/fermeture caisse**
- **loyalty.points_earned/redeemed** → **🆕 Points fidélité**
- **voucher.used/expired** → **🆕 Utilisation bons**
- **catalog.range_updated** → **🆕 Gamme modifiée**
- **ecommerce.order_received** → **🆕 Commande web**
- **workflow.process_started/completed** → **🆕 Workflow**
- **reminder.sent** → **🆕 Relance envoyée**
- **periodic_invoice.generated** → **🆕 Facture récurrente**

### Relations entre Services 
- **Projects Service** ↔ **Clients Service** : Récupération données client
- **Projects Service** ↔ **Suppliers Service** : Récupération données fournisseur
- **Planning Service** ↔ **Projects Service** : Événements liés aux projets
- **Documents Service** ↔ **Projects Service** : Documents de projets
- **Maintenance Service** ↔ **Clients Service** : Contrats clients
- **Incidents Service** ↔ **Clients Service** : Incidents clients
- **Finance Service** ↔ **Projects Service** : Comptabilité analytique projets 
- **Commercial Service** ↔ **Clients Service** : Tarification clients 
- **Commercial Service** ↔ **Projects Service** : Devis et activités 
- **Controlling Service** ↔ **Projects Service** : Suivi coûts et marges 
- **Finance Service** ↔ **Planning Service** : Frais déplacement 
- **Analytics Service** ← **Tous les services** : Collecte données analytiques
- **POS Service** ↔ **Inventory Service** : **🆕 Stock temps réel magasin**
- **POS Service** ↔ **Loyalty Service** : **🆕 Points fidélité ventes**
- **Loyalty Service** ↔ **Clients Service** : **🆕 Fidélité clients BTP**
- **Catalog Service** ↔ **Inventory Service** : **🆕 Gammes et stock**
- **Ecommerce Service** ↔ **Catalog Service** : **🆕 Catalogue web**
- **Ecommerce Service** ↔ **Clients Service** : **🆕 Clients web**
- **Workflow Service** ← **Tous les services** : **🆕 Processus métier**
- **Finance Service** ↔ **POS Service** : **🆕 Encaissements POS**

## 🗄️ Base de Données

### postgres_sync (Port 5433)
- Base de données unique du projet
- Contient toutes les données métier synchronisées depuis EBP
- **319 tables** identifiées avec données BTP complètes
- Gestion des sessions utilisateurs et configuration mobile intégrées

## 📱 Application Mobile

### React Native
- Interface utilisateur moderne
- Gestion offline avec cache local
- Push notifications
- Synchronisation bidirectionnelle

### Nouvelles fonctionnalités mobiles **ENRICHIES VIA MCP** :
- **💰 Saisie frais déplacement** sur chantier avec géolocalisation
- **📍 Géolocalisation automatique** pour frais et activités
- **💳 Validation paiements** terrain  
- **📊 Tableau bord rentabilité** temps réel
- **🎯 Activités commerciales** nomades
- **💵 Calcul tarifs dynamiques** en situation
- **📈 Alertes budget** et dépassements
- **🏦 Consultation soldes** et mouvements bancaires
- **🏪 Interface POS mobile** - **🆕**
- **🎁 Gestion fidélité mobile** - **🆕**
- **📦 Configuration gammes** terrain - **🆕**
- **🌐 Synchronisation e-commerce** - **🆕**
- **🔄 Workflows mobiles** - **🆕**

## 🚀 Déploiement

### Développement
```bash
# Démarrer tous les services
docker-compose up -d

# Démarrer un service spécifique
docker-compose up clients-service

# Logs d'un service
docker-compose logs -f projects-service
```

### Production
- Kubernetes avec Helm charts
- CI/CD avec GitLab/GitHub Actions
- Monitoring avec Prometheus/Grafana
- Logs centralisés avec ELK Stack

## 🔧 Configuration

### Variables d'environnement
Chaque service aura ses propres variables :
- **DATABASE_URL_SYNC** : Connexion postgres_sync
- **DATABASE_URL_APP** : Connexion postgres_app
- **NATS_URL** : Connexion message broker
- **JWT_SECRET** : Clé JWT pour auth
- **SERVICE_PORT** : Port du service

### Sécurité
- JWT pour authentication
- RBAC (Role-Based Access Control)
- Rate limiting sur API Gateway
- CORS configuré selon environnement
- Validation stricte des données d'entrée

## ⚠️ Éléments Critiques Identifiés et Traités

### **🏪 Architecture Retail/Showroom Complète** 
- **Service POS** avec gestion complète terminaux et caisses
- Interface mobile pour vente sur showroom/magasin
- Synchronisation stock temps réel avec chantiers

### **🎁 Marketing Relationnel Avancé** 
- **Service Loyalty** avec cartes fidélité BTP
- Campagnes promotionnelles géolocalisées
- Bons cadeaux et coupons de réduction

### **📦 Gestion Catalogue Complexe** 
- **Service Catalog** pour gammes produits BTP
- Templates de gammes réutilisables
- Configuration produits avec variantes

### **🌐 Ouverture E-commerce** 
- **Service Ecommerce** pour boutique en ligne BTP
- Synchronisation bidirectionnelle avec ERP
- Commandes web intégrées au workflow

### **🔄 Automatisation Processus** 
- **Service Workflow** pour processus métier automatisés
- Dashboards personnalisés par métier
- Déclencheurs automatiques selon événements

### **💰 Finance Enrichie** 
- Facturation périodique automatisée (abonnements, maintenance)
- Gestion relances et impayés professionnelle
- Commerce international avec déclarations Intrastat
- Remises bancaires SEPA automatisées

### **🏪 Point de Vente Intégré** -
- Terminaux POS pour showroom/magasin BTP
- Gestion multi-caisses avec Z quotidiens
- Intégration fidélité en temps réel

### **🎁 Programme Fidélité BTP** -
- Cartes professionnelles avec points métier
- Campagnes ciblées par type de client (artisan, entreprise)
- Bons d'achat géolocalisés par zone

### **📦 Configurateur Gammes** -
- Gammes BTP complexes (carrelage, sanitaire, etc.)
- Templates réutilisables par famille produit
- Configuration en temps réel sur chantier

### **🌐 Boutique B2B En Ligne** -
- Catalogue professionnel avec tarifs négociés
- Commandes web intégrées au planning chantier
- Synchronisation automatique avec ERP

### **🔄 Workflows BTP Métier** -
- Processus devis → commande → livraison → facturation
- Alertes automatiques selon étapes projet
- Dashboards personnalisés par corps de métier

### **💰 Facturation Récurrente** -
- Abonnements maintenance équipements
- Échéances automatiques contrats annuels
- Relances intelligentes avec historique

Cette architecture **complète et réaliste** couvre maintenant l'intégralité des besoins métier BTP identifiés dans postgres_sync, avec une approche moderne retail + digital. 