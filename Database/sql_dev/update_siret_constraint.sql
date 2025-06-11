-- Script de mise à jour de la contrainte SIRET
-- Permet d'accepter les SIREN (9 chiffres) et SIRET (14 chiffres)

BEGIN;

-- 1. Supprimer l'ancienne contrainte SIRET
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_siret_check;

-- 2. Ajouter la nouvelle contrainte qui accepte SIREN (9 chiffres) ou SIRET (14 chiffres)
ALTER TABLE clients ADD CONSTRAINT clients_siret_check 
CHECK (siret IS NULL OR siret ~ '^[0-9]{9,14}$');

-- 3. Optionnel : Nettoyer les données SIRET/SIREN existantes
-- (Enlever les espaces, tirets, etc.)
UPDATE clients 
SET siret = regexp_replace(siret, '[^0-9]', '', 'g')
WHERE siret IS NOT NULL 
  AND siret != '' 
  AND length(regexp_replace(siret, '[^0-9]', '', 'g')) BETWEEN 9 AND 14;

-- 4. Optionnel : Mettre à NULL les SIRET invalides
UPDATE clients 
SET siret = NULL
WHERE siret IS NOT NULL 
  AND siret != ''
  AND (length(regexp_replace(siret, '[^0-9]', '', 'g')) < 9 
       OR length(regexp_replace(siret, '[^0-9]', '', 'g')) > 14
       OR length(regexp_replace(siret, '[^0-9]', '', 'g')) BETWEEN 10 AND 13);

-- 5. Vérifier les données après nettoyage
-- Cette requête ne doit retourner aucun résultat si tout est correct
DO $$ 
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM clients 
    WHERE siret IS NOT NULL 
      AND siret != ''
      AND NOT (siret ~ '^[0-9]{9,14}$');
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'ATTENTION: % clients ont encore des SIRET invalides', invalid_count;
    ELSE
        RAISE NOTICE 'SUCCESS: Tous les SIRET sont maintenant valides';
    END IF;
END $$;

COMMIT;

-- Afficher un résumé des données SIRET après mise à jour
SELECT 
    'SIRET valides' as type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT length(siret)::text, ', ') as lengths
FROM clients 
WHERE siret IS NOT NULL AND siret != ''

UNION ALL

SELECT 
    'SIRET NULL/vide' as type,
    COUNT(*) as count,
    'N/A' as lengths
FROM clients 
WHERE siret IS NULL OR siret = ''; 