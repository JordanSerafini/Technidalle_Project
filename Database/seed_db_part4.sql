BEGIN;

-- Insertion des lignes pour les documents (devis et factures)
INSERT INTO document_lines (document_id, material_id, description, quantity, unit, unit_price, sort_order) VALUES
-- Devis pour le projet PRJ-2023-002 (DEV-2023-002)
(1, 1, 'Carrelage marbre 60x60 pour parties communes', 200, 'm²', 45.90, 1),
(1, 2, 'Carrelage bois 20x120 pour murs', 180, 'm²', 29.90, 2),
(1, 3, 'Mortier colle rapide', 1200, 'kg', 1.20, 3),
(1, 4, 'Chape anhydrite', 5000, 'kg', 0.85, 4),
(1, 5, 'Joint époxy', 120, 'ml', 2.50, 5),
(1, 7, 'Plinthe marbre', 80, 'ml', 12.90, 6),
(1, NULL, 'Main d''œuvre pose carrelage', 380, 'h', 45.00, 7),
(1, NULL, 'Main d''œuvre pose chape', 120, 'h', 50.00, 8),

-- Facture premier acompte pour le projet PRJ-2023-002 (FAC-2023-003)
(2, 1, 'Carrelage marbre 60x60 pour parties communes', 200, 'm²', 45.90, 1),
(2, 2, 'Carrelage bois 20x120 pour murs', 90, 'm²', 29.90, 2),
(2, 3, 'Mortier colle rapide', 600, 'kg', 1.20, 3),
(2, 4, 'Chape anhydrite', 2500, 'kg', 0.85, 4),
(2, NULL, 'Main d''œuvre pose carrelage (50%)', 190, 'h', 45.00, 5),
(2, NULL, 'Main d''œuvre pose chape (50%)', 60, 'h', 50.00, 6),

-- Facture solde pour le projet PRJ-2023-002 (FAC-2023-004)
(3, 2, 'Carrelage bois 20x120 pour murs (solde)', 90, 'm²', 29.90, 1),
(3, 3, 'Mortier colle rapide (solde)', 600, 'kg', 1.20, 2),
(3, 4, 'Chape anhydrite (solde)', 2500, 'kg', 0.85, 3),
(3, 5, 'Joint époxy', 120, 'ml', 2.50, 4),
(3, 7, 'Plinthe marbre', 80, 'ml', 12.90, 5),
(3, NULL, 'Main d''œuvre pose carrelage (50%)', 190, 'h', 45.00, 6),
(3, NULL, 'Main d''œuvre pose chape (50%)', 60, 'h', 50.00, 7),

-- Devis pour le projet PRJ-2023-003 (DEV-2023-003)
(5, 1, 'Carrelage marbre 60x60 pour parties communes', 180, 'm²', 45.90, 1),
(5, 2, 'Carrelage bois 20x120 pour murs', 150, 'm²', 29.90, 2),
(5, 3, 'Mortier colle rapide', 1000, 'kg', 1.20, 3),
(5, 4, 'Chape anhydrite', 4000, 'kg', 0.85, 4),
(5, 5, 'Joint époxy', 100, 'ml', 2.50, 5),
(5, 7, 'Plinthe marbre', 90, 'ml', 12.90, 6),
(5, NULL, 'Main d''œuvre pose carrelage', 420, 'h', 45.00, 7),
(5, NULL, 'Main d''œuvre pose chape', 150, 'h', 50.00, 8),

-- Facture premier acompte pour le projet PRJ-2023-003 (FAC-2023-005)
(6, 1, 'Carrelage marbre 60x60 pour parties communes', 180, 'm²', 45.90, 1),
(6, 2, 'Carrelage bois 20x120 pour murs', 75, 'm²', 29.90, 2),
(6, 3, 'Mortier colle rapide', 500, 'kg', 1.20, 3),
(6, 4, 'Chape anhydrite', 2000, 'kg', 0.85, 4),
(6, NULL, 'Main d''œuvre pose carrelage (50%)', 210, 'h', 45.00, 5),
(6, NULL, 'Main d''œuvre pose chape (50%)', 75, 'h', 50.00, 6),

-- Facture solde pour le projet PRJ-2023-003 (FAC-2023-006)
(7, 2, 'Carrelage bois 20x120 pour murs (solde)', 75, 'm²', 29.90, 1),
(7, 3, 'Mortier colle rapide (solde)', 500, 'kg', 1.20, 2),
(7, 4, 'Chape anhydrite (solde)', 2000, 'kg', 0.85, 3),
(7, 5, 'Joint époxy', 100, 'ml', 2.50, 4),
(7, 7, 'Plinthe marbre', 90, 'ml', 12.90, 5),
(7, NULL, 'Main d''œuvre pose carrelage (50%)', 210, 'h', 45.00, 6),
(7, NULL, 'Main d''œuvre pose chape (50%)', 75, 'h', 50.00, 7),

-- Devis pour le projet PRJ-2023-004 (DEV-2023-004)
(8, 1, 'Carrelage marbre 60x60 pour sol', 90, 'm²', 45.90, 1),
(8, 2, 'Carrelage bois 20x120 pour murs', 130, 'm²', 29.90, 2),
(8, 3, 'Mortier colle rapide', 600, 'kg', 1.20, 3),
(8, 4, 'Chape anhydrite', 2500, 'kg', 0.85, 4),
(8, 5, 'Joint époxy', 60, 'ml', 2.50, 5),
(8, 7, 'Plinthe marbre', 70, 'ml', 12.90, 6),
(8, NULL, 'Main d''œuvre pose carrelage', 350, 'h', 45.00, 7),
(8, NULL, 'Main d''œuvre pose chape', 100, 'h', 50.00, 8),

-- Facture premier acompte pour le projet PRJ-2023-004 (FAC-2023-007)
(9, 1, 'Carrelage marbre 60x60 pour sol', 90, 'm²', 45.90, 1),
(9, 2, 'Carrelage bois 20x120 pour murs', 65, 'm²', 29.90, 2),
(9, 3, 'Mortier colle rapide', 300, 'kg', 1.20, 3),
(9, 4, 'Chape anhydrite', 1250, 'kg', 0.85, 4),
(9, NULL, 'Main d''œuvre pose carrelage (50%)', 175, 'h', 45.00, 5),
(9, NULL, 'Main d''œuvre pose chape (50%)', 50, 'h', 50.00, 6),

-- Facture solde pour le projet PRJ-2023-004 (FAC-2023-008)
(10, 2, 'Carrelage bois 20x120 pour murs (solde)', 65, 'm²', 29.90, 1),
(10, 3, 'Mortier colle rapide (solde)', 300, 'kg', 1.20, 2),
(10, 4, 'Chape anhydrite (solde)', 1250, 'kg', 0.85, 3),
(10, 5, 'Joint époxy', 60, 'ml', 2.50, 4),
(10, 7, 'Plinthe marbre', 70, 'ml', 12.90, 5),
(10, NULL, 'Main d''œuvre pose carrelage (50%)', 175, 'h', 45.00, 6),
(10, NULL, 'Main d''œuvre pose chape (50%)', 50, 'h', 50.00, 7),

-- Devis pour le projet PRJ-2024-001 (DEV-2024-001)
(11, 1, 'Carrelage marbre 60x60 pour sol', 35, 'm²', 45.90, 1),
(11, 2, 'Carrelage bois 20x120 pour murs', 50, 'm²', 29.90, 2),
(11, 3, 'Mortier colle rapide', 300, 'kg', 1.20, 3),
(11, 4, 'Chape anhydrite', 1200, 'kg', 0.85, 4),
(11, 5, 'Joint époxy', 30, 'ml', 2.50, 5),
(11, 7, 'Plinthe marbre', 40, 'ml', 12.90, 6),
(11, NULL, 'Main d''œuvre pose carrelage', 160, 'h', 45.00, 7),
(11, NULL, 'Main d''œuvre pose chape', 50, 'h', 50.00, 8),

-- Facture premier acompte pour le projet PRJ-2024-001 (FAC-2024-001)
(12, 1, 'Carrelage marbre 60x60 pour sol', 35, 'm²', 45.90, 1),
(12, 2, 'Carrelage bois 20x120 pour murs', 25, 'm²', 29.90, 2),
(12, 3, 'Mortier colle rapide', 150, 'kg', 1.20, 3),
(12, 4, 'Chape anhydrite', 600, 'kg', 0.85, 4),
(12, NULL, 'Main d''œuvre pose carrelage (50%)', 80, 'h', 45.00, 5),
(12, NULL, 'Main d''œuvre pose chape (50%)', 25, 'h', 50.00, 6),

-- Facture solde pour le projet PRJ-2024-001 (FAC-2024-002) 
(13, 2, 'Carrelage bois 20x120 pour murs (solde)', 25, 'm²', 29.90, 1),
(13, 3, 'Mortier colle rapide (solde)', 150, 'kg', 1.20, 2),
(13, 4, 'Chape anhydrite (solde)', 600, 'kg', 0.85, 3),
(13, 5, 'Joint époxy', 30, 'ml', 2.50, 4),
(13, 7, 'Plinthe marbre', 40, 'ml', 12.90, 5),
(13, NULL, 'Main d''œuvre pose carrelage (50%)', 80, 'h', 45.00, 6),
(13, NULL, 'Main d''œuvre pose chape (50%)', 25, 'h', 50.00, 7);

-- Mise à jour des montants totaux dans la table documents basée sur les lignes
UPDATE documents 
SET amount = (
    SELECT SUM(total_ht) 
    FROM document_lines 
    WHERE document_lines.document_id = documents.id
)
WHERE EXISTS (
    SELECT 1 
    FROM document_lines 
    WHERE document_lines.document_id = documents.id
);

COMMIT; 