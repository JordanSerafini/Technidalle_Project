# EBP to App Database Mapping

This document describes how data from the EBP synchronization database (`postgres_sync`) maps to the final application PostgreSQL schema.

The goal is to normalise EBP data into the application's tables. Only the main entities used in the current synchronisation process are covered.

## Customers ➜ Clients

| EBP table/column (`postgres_sync`) | Final app table/column | Notes |
|-----------------------------------|------------------------|------|
| `Customer.Id` | `clients.customer_id` | Stored as text, used as external reference |
| `Customer.Name` | `clients.company_name` | |
| `Customer.MainInvoicingContact_FirstName` / `MainDeliveryContact_FirstName` | `clients.firstname` | Invoicing contact takes priority |
| `Customer.MainInvoicingContact_Name` / `MainDeliveryContact_Name` | `clients.lastname` | |
| `Customer.MainInvoicingContact_Email` / `MainDeliveryContact_Email` | `clients.email` | Email validated; placeholder generated if invalid |
| `Customer.MainInvoicingContact_Phone` | `clients.phone` | Numbers cleaned; invalid numbers ignored |
| `Customer.MainInvoicingContact_CellPhone` | `clients.mobile` | |
| `Customer.NotesClear` | `clients.notes` | |
| Invoicing/delivery address fields | `addresses` + `client_addresses` | Inserted via `upsertAddress()` with type `facturation` or `livraison` |

## Items ➜ Materials

| EBP table/column | Final app table/column | Notes |
|------------------|-----------------------|------|
| `Item.Id` | `materials.reference` | Unique reference |
| `Item.Caption` | `materials.name` | |
| `Item.DesCom` or `DesComClear` | `materials.description` | |
| `Item.UnitId` | `materials.unit` | Unit code mapped to text |
| `Item.SalePriceVatExcluded` | `materials.price` | Decimal |
| `Item.RealStock` | `materials.stock_quantity` | |
| `Item.ManageStock` | `materials.minimum_stock` | if managed |
| `Item.SupplierId` | `materials.supplier` | Stored as text |

## Deals ➜ Projects

| EBP table/column | Final app column | Notes |
|------------------|-----------------|------|
| `Deal.Id` | `projects.reference` and `projects.project_id` | Used as external reference |
| `Deal.Caption` | `projects.name` | |
| `Deal.Notes` | `projects.description` / `projects.notes` | |
| `Deal.xx_DateDebut` | `projects.start_date` | |
| `Deal.xx_DateFin` | `projects.end_date` | |
| `Deal.PredictedDuration` | `projects.estimated_duration` | numeric ➜ integer |
| `Deal.PredictedCosts` | `projects.budget` | decimal |
| `Deal.AccomplishedCosts` | `projects.actual_cost` | decimal |
| `Deal.PredictedGrossMargin` | `projects.margin` | decimal |
| `Deal.DealState` | `projects.status` | mapped to enum `project_status` |
| `Deal.xx_Client` | `projects.client_id` | client looked up by `Customer.Id` |

## Sale Documents ➜ Documents

| EBP table/column | Final app column | Notes |
|------------------|-----------------|------|
| `SaleDocument.Id` | `documents.document_id` | external reference |
| `SaleDocument.DocumentNumber` | `documents.reference` | |
| `SaleDocument.DocumentType` | `documents.type` | numeric code ➜ `document_type` enum |
| `SaleDocument.DocumentState` | `documents.status` | numeric code ➜ `document_status` enum |
| `SaleDocument.NetAmountVatIncludedWithDiscount` | `documents.amount` | decimal |
| `SaleDocument.DocumentDate` | `documents.issue_date` | |
| `SaleDocument.DueDate` | `documents.due_date` | |
| `SaleDocument.CustomerId` | `documents.client_id` | optional link to `clients` |
| `SaleDocument.DealId` | `documents.project_id` | link to project |

## Sale Document Lines ➜ Document Lines

| EBP table/column | Final app column | Notes |
|------------------|-----------------|------|
| `SaleDocumentLine.DocumentId` | `document_lines.document_id` | FK to `documents` |
| `SaleDocumentLine.ItemId` | `document_lines.material_id` | matched via `materials.reference` |
| `SaleDocumentLine.DescriptionClear` | `document_lines.description` | |
| `SaleDocumentLine.Quantity` | `document_lines.quantity` | numeric → decimal(10,3) |
| `SaleDocumentLine.UnitId` | `document_lines.unit` | |
| `SaleDocumentLine.PurchasePrice` | `document_lines.unit_price` | |
| `SaleDocumentLine.DiscountRate` | `document_lines.discount_percent` | |

The TypeScript class `SaleDocumentLineToDocumentLineMapper` in
`Backend/sync_service/src/sync/mappers` implements this mapping for use by
the synchronisation service.

## Enum mapping examples

```sql
-- Deal.DealState ➜ projects.status
0 → 'prospect'
1 → 'devis_en_cours'
2 → 'devis_accepte'
3 → 'en_cours'
4 → 'termine'
5 → 'annule'

-- SaleDocument.DocumentType ➜ documents.type
0 → 'devis'
1 → 'facture'
2 → 'bon_de_commande'
others → 'autre'
```

## Synchronisation process

1. **Extract** data from the `postgres_sync` database. The provided dump `sync_db_backup.dump` can be restored using `pg_restore`.
2. **Convert** each entity using the mapping rules above. The project includes TypeScript classes and services (see `Backend/sync_service/src/pgToPg`) implementing these conversions.
3. **Insert/Update** records in the application database using upsert logic. Example: `EBPclient.upsertAddress()` handles address deduplication and is used when inserting clients and projects.

The mapping ensures that EBP identifiers remain accessible (`customer_id`, `project_id`, `document_id`) while data is normalised in the final schema.
