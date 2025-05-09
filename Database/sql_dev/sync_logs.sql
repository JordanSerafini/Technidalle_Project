CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(100) NOT NULL, -- ex: 'deals_ebp', 'documents_ebp'
    run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE'
    items_processed INTEGER DEFAULT 0,
    items_succeeded INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    source_entity VARCHAR(255), -- ex: 'dbo.Affaire (postgres_sync)', 'dbo.VenteDocumentEntete (postgres_sync)'
    target_table VARCHAR(255), -- ex: 'projects', 'documents'
    duration_ms BIGINT,
    details TEXT, -- Pour les messages d'erreur, IDs des items échoués, etc.
    error_details TEXT -- Stack trace ou message d'erreur complet en cas d'échec total
);

COMMENT ON TABLE sync_logs IS '''Journal des opérations de synchronisation avec les données externes (ex: EBP)''';
COMMENT ON COLUMN sync_logs.sync_type IS '''Type de données synchronisées''';
COMMENT ON COLUMN sync_logs.source_entity IS '''Table ou vue source des données''';
COMMENT ON COLUMN sync_logs.target_table IS '''Table cible dans la base principale''';
COMMENT ON COLUMN sync_logs.duration_ms IS '''Durée de la synchronisation en millisecondes''';
COMMENT ON COLUMN sync_logs.error_details IS '''Stack trace ou message d''erreur complet en cas d''échec total''';

/* 
-- Cette vue doit être créée manuellement après le démarrage de postgres_sync
-- ou directement dans le code de votre service

CREATE OR REPLACE VIEW synced_ebp_deals AS
SELECT
    a.Id,                                 -- DealInterface.Id
    a.Caption,                            -- DealInterface.Caption
    a.DealDate,                           -- DealInterface.DealDate
    a.PredictedCosts,                     -- DealInterface.PredictedCosts
    a.AccomplishedCosts,                  -- DealInterface.AccomplishedCosts
    a.PredictedGrossMargin,               -- Pour projects.margin (ou a.ProfitsOnGrossMargin)
    a.xx_DateDebut,                       -- DealInterface.xx_DateDebut
    a.xx_DateFin,                         -- DealInterface.xx_DateFin
    a.NotesClear AS Notes,                -- DealInterface.NotesClear (ou a.Notes)
    a.DealState,                          -- DealInterface.DealState
    a.xx_Client AS EbpClientReference,    -- Référence client EBP (peut être un ID ou un nom)
    -- Récupérer le nom complet du client depuis la table Tiers (à adapter)
    -- COALESCE(t.Intitule, t.Nom || ' ' || t.Prenom) AS ClientFullName,
    a.PredictedDuration,                  -- DealInterface.PredictedDuration
    a.xx_Service,                         -- DealInterface.xx_Service
    a.xx_Commercial,                      -- DealInterface.xx_Commercial
    a.xx_Origine_Vente,                   -- DealInterface.xx_Origine_Vente
    -- Ajoutez ici d'autres champs de DealInterface que vous souhaitez exposer
    -- Exemple: convertir l'ensemble de l'enregistrement EBP en JSON pour la colonne ebp_payload
    to_jsonb(a) AS ebp_payload_source
FROM
    "Deals" a -- Adaptez "dbo.Affaire" au nom réel de votre table affaire dans postgres_sync
-- LEFT JOIN
--    dbo.Tiers t ON a.xx_Client = t.Id -- Adaptez la jointure si xx_Client est un ID de la table Tiers
WHERE
    a.sysInvalid = false OR a.sysInvalid IS NULL; -- Exemple de filtre si vous avez un indicateur d'enregistrement valide 
*/ 