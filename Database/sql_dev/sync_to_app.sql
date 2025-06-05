-- Example SQL script to migrate data from the postgres_sync staging database
-- into the application's schema. Adjust schema names and add custom logic as
-- needed for your environment.

BEGIN;

-- 1. Clients
INSERT INTO clients (customer_id, company_name, firstname, lastname, email,
                    phone, mobile, notes, created_at, updated_at)
SELECT
    c."Id" AS customer_id,
    c."Name" AS company_name,
    COALESCE(c."MainInvoicingContact_FirstName", c."MainDeliveryContact_FirstName", '') AS firstname,
    COALESCE(c."MainInvoicingContact_Name", c."MainDeliveryContact_Name", '') AS lastname,
    CASE
        WHEN c."MainInvoicingContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN c."MainInvoicingContact_Email"
        WHEN c."MainDeliveryContact_Email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN c."MainDeliveryContact_Email"
        ELSE 'no-email-' || c."Id" || '@example.com'
    END AS email,
    regexp_replace(COALESCE(c."MainInvoicingContact_Phone", c."MainDeliveryContact_Phone", ''), '[^0-9+]', '', 'g') AS phone,
    regexp_replace(COALESCE(c."MainInvoicingContact_CellPhone", c."MainDeliveryContact_CellPhone", ''), '[^0-9+]', '', 'g') AS mobile,
    c."NotesClear" AS notes,
    NOW(), NOW()
FROM "Customer" c
ON CONFLICT (customer_id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    firstname    = EXCLUDED.firstname,
    lastname     = EXCLUDED.lastname,
    email        = EXCLUDED.email,
    phone        = EXCLUDED.phone,
    mobile       = EXCLUDED.mobile,
    notes        = EXCLUDED.notes,
    updated_at   = NOW();

-- 2. Addresses linked to clients (main invoicing address)
WITH addr AS (
    SELECT DISTINCT c."Id" AS customer_id,
           NULLIF(TRIM(c."MainInvoicingAddress_Address1"), '')  AS street_name,
           NULLIF(TRIM(c."MainInvoicingAddress_ZipCode"), '')   AS zip_code,
           NULLIF(TRIM(c."MainInvoicingAddress_City"), '')      AS city
    FROM "Customer" c
)
INSERT INTO addresses (street_name, zip_code, city)
SELECT a.street_name, a.zip_code, a.city
FROM addr a
WHERE a.street_name IS NOT NULL
  AND a.zip_code  IS NOT NULL
  AND a.city      IS NOT NULL
ON CONFLICT (street_number, street_name, zip_code, city) DO NOTHING;

-- Link clients to addresses
INSERT INTO client_addresses (client_id, address_id, address_type, is_default)
SELECT cl.id, ad.id, 'facturation', TRUE
FROM "Customer" c
JOIN clients cl ON cl.customer_id = c."Id"
JOIN addresses ad ON ad.street_name = c."MainInvoicingAddress_Address1"
                 AND ad.zip_code    = c."MainInvoicingAddress_ZipCode"
                 AND ad.city        = c."MainInvoicingAddress_City"
ON CONFLICT (client_id, address_id, address_type) DO NOTHING;

-- 3. Materials
INSERT INTO materials (reference, name, description, unit, price, created_at, updated_at)
SELECT i."Id"           AS reference,
       i."Caption"      AS name,
       COALESCE(i."DesComClear", i."Description") AS description,
       COALESCE(i."UnitId", 'U') AS unit,
       COALESCE(i."SalePriceVatExcluded", 0) AS price,
       NOW(), NOW()
FROM "Item" i
ON CONFLICT (reference) DO UPDATE SET
       name        = EXCLUDED.name,
       description = EXCLUDED.description,
       unit        = EXCLUDED.unit,
       price       = EXCLUDED.price,
       updated_at  = NOW();

-- 4. Projects
INSERT INTO projects (project_id, reference, name, description, client_id, status,
                      start_date, end_date, estimated_duration, budget,
                      actual_cost, margin, notes, created_at, updated_at)
SELECT d."Id" AS project_id,
       d."Id" AS reference,
       d."Caption" AS name,
       d."Notes" AS description,
       cl.id AS client_id,
       CASE d."DealState"
           WHEN 0 THEN 'prospect'
           WHEN 1 THEN 'devis_en_cours'
           WHEN 2 THEN 'devis_accepte'
           WHEN 3 THEN 'en_cours'
           WHEN 4 THEN 'termine'
           WHEN 5 THEN 'annule'
           ELSE 'prospect'
       END::project_status AS status,
       d."xx_DateDebut" AS start_date,
       d."xx_DateFin" AS end_date,
       d."PredictedDuration"::int,
       d."PredictedCosts",
       d."AccomplishedCosts",
       d."PredictedGrossMargin",
       d."Notes" AS notes,
       NOW(), NOW()
FROM "Deal" d
LEFT JOIN clients cl ON cl.customer_id = d."xx_Client"
ON CONFLICT (reference) DO UPDATE SET
       name              = EXCLUDED.name,
       description       = EXCLUDED.description,
       client_id         = EXCLUDED.client_id,
       status            = EXCLUDED.status,
       start_date        = EXCLUDED.start_date,
       end_date          = EXCLUDED.end_date,
       estimated_duration= EXCLUDED.estimated_duration,
       budget            = EXCLUDED.budget,
       actual_cost       = EXCLUDED.actual_cost,
       margin            = EXCLUDED.margin,
       notes             = EXCLUDED.notes,
       updated_at        = NOW();

-- 5. Documents
INSERT INTO documents (document_id, project_id, client_id, type, reference, status,
                       amount, issue_date, due_date, created_at, updated_at)
SELECT sd."Id" AS document_id,
       p.id AS project_id,
       cl.id AS client_id,
       CASE sd."DocumentType"
           WHEN 0 THEN 'devis'
           WHEN 1 THEN 'facture'
           WHEN 2 THEN 'bon_de_commande'
           ELSE 'autre'
       END::document_type AS type,
       sd."DocumentNumber" AS reference,
       CASE sd."DocumentState"
           WHEN 0 THEN 'brouillon'
           WHEN 1 THEN 'en_attente'
           WHEN 2 THEN 'valide'
           WHEN 3 THEN 'refuse'
           WHEN 4 THEN 'annule'
           ELSE 'brouillon'
       END::document_status AS status,
       sd."NetAmountVatIncludedWithDiscount" AS amount,
       sd."DocumentDate" AS issue_date,
       sd."DueDate" AS due_date,
       NOW(), NOW()
FROM "SaleDocument" sd
LEFT JOIN projects p ON p.project_id = sd."DealId"
LEFT JOIN clients cl ON cl.customer_id = sd."CustomerId"
ON CONFLICT (reference) DO UPDATE SET
       project_id = EXCLUDED.project_id,
       client_id  = EXCLUDED.client_id,
       type       = EXCLUDED.type,
       status     = EXCLUDED.status,
       amount     = EXCLUDED.amount,
       issue_date = EXCLUDED.issue_date,
       due_date   = EXCLUDED.due_date,
       updated_at = NOW();

-- 6. Document lines
INSERT INTO document_lines (document_id, material_id, description, quantity, unit,
                            unit_price, discount_percent, created_at, updated_at)
SELECT d.id AS document_id,
       m.id AS material_id,
       l."DescriptionClear" AS description,
       COALESCE(l."Quantity", 0) AS quantity,
       COALESCE(l."UnitId", 'U') AS unit,
       COALESCE(l."PurchasePrice", 0) AS unit_price,
       COALESCE(l."DiscountRate", 0) AS discount_percent,
       NOW(), NOW()
FROM "SaleDocumentLine" l
JOIN documents d ON d.document_id = l."DocumentId"
LEFT JOIN materials m ON m.reference = l."ItemId"
ON CONFLICT DO NOTHING;

COMMIT;
