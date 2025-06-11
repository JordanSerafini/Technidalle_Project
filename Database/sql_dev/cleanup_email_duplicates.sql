-- Script de nettoyage des emails dupliqués dans la table clients
-- À exécuter pour résoudre les problèmes de synchronisation liés aux emails

BEGIN;

-- 1. Identifier et corriger les emails dupliqués
-- On garde le client avec l'ID le plus bas et on modifie les autres

WITH duplicated_emails AS (
    SELECT 
        email,
        COUNT(*) as email_count,
        MIN(id) as keep_id
    FROM clients 
    WHERE email NOT LIKE 'no-email-%@technidalle.com'
    GROUP BY email 
    HAVING COUNT(*) > 1
),
clients_to_update AS (
    SELECT 
        c.id,
        c.email,
        c.customer_id,
        de.keep_id,
        CASE 
            WHEN POSITION('@' IN c.email) > 0 THEN
                SUBSTRING(c.email FROM 1 FOR POSITION('@' IN c.email) - 1) || 
                '-' || c.customer_id || 
                SUBSTRING(c.email FROM POSITION('@' IN c.email))
            ELSE
                'no-email-' || c.customer_id || '@technidalle.com'
        END as new_email
    FROM clients c
    INNER JOIN duplicated_emails de ON c.email = de.email
    WHERE c.id != de.keep_id
)
UPDATE clients 
SET 
    email = ctu.new_email,
    updated_at = NOW()
FROM clients_to_update ctu
WHERE clients.id = ctu.id;

-- 2. Corriger les emails invalides qui ne respectent pas la contrainte check
UPDATE clients 
SET 
    email = 'no-email-' || customer_id || '@technidalle.com',
    updated_at = NOW()
WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- 3. Normaliser tous les emails (minuscules, suppression espaces)
UPDATE clients 
SET 
    email = TRIM(LOWER(email)),
    updated_at = NOW()
WHERE email != TRIM(LOWER(email));

-- 4. Afficher un résumé des modifications
DO $$
DECLARE
    duplicates_fixed INTEGER;
    invalid_fixed INTEGER;
    normalized_count INTEGER;
BEGIN
    -- Compter les emails encore dupliqués (devrait être 0)
    SELECT COUNT(*) INTO duplicates_fixed 
    FROM (
        SELECT email, COUNT(*) 
        FROM clients 
        GROUP BY email 
        HAVING COUNT(*) > 1
    ) subq;
    
    -- Compter les emails invalides (devrait être 0)
    SELECT COUNT(*) INTO invalid_fixed
    FROM clients 
    WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    -- Compter le total d'emails
    SELECT COUNT(*) INTO normalized_count FROM clients;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RÉSUMÉ DU NETTOYAGE DES EMAILS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Emails dupliqués restants: %', duplicates_fixed;
    RAISE NOTICE 'Emails invalides restants: %', invalid_fixed;
    RAISE NOTICE 'Total de clients traités: %', normalized_count;
    
    IF duplicates_fixed = 0 AND invalid_fixed = 0 THEN
        RAISE NOTICE '✅ Nettoyage terminé avec succès !';
    ELSE
        RAISE NOTICE '⚠️  Des problèmes persistent, vérifiez les données';
    END IF;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- Vérifications post-nettoyage
SELECT 
    'Clients avec emails dupliqués' as verification,
    COUNT(*) as count
FROM (
    SELECT email, COUNT(*) 
    FROM clients 
    GROUP BY email 
    HAVING COUNT(*) > 1
) duplicates

UNION ALL

SELECT 
    'Clients avec emails invalides' as verification,
    COUNT(*) as count
FROM clients 
WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

UNION ALL

SELECT 
    'Total de clients' as verification,
    COUNT(*) as count
FROM clients; 