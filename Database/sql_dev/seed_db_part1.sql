BEGIN;

-- Insertion des rôles sans spécifier d'ID (ils seront auto-générés)
INSERT INTO roles (name, description) 
SELECT 'ADMIN', 'Administrateur système avec tous les droits' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');

INSERT INTO roles (name, description) 
SELECT 'MANAGER', 'Responsable de chantier et gestion des équipes' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'MANAGER');

INSERT INTO roles (name, description) 
SELECT 'TECHNICIEN_SENIOR', 'Technicien expérimenté avec responsabilités' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'TECHNICIEN_SENIOR');

INSERT INTO roles (name, description) 
SELECT 'TECHNICIEN', 'Technicien de chantier' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'TECHNICIEN');

INSERT INTO roles (name, description) 
SELECT 'APPRENTI', 'Apprenti en formation' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'APPRENTI');

INSERT INTO roles (name, description) 
SELECT 'COMMERCIAL', 'Commercial et gestion des devis' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'COMMERCIAL');

INSERT INTO roles (name, description) 
SELECT 'COMPTABLE', 'Gestion comptable et facturation' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'COMPTABLE');

INSERT INTO roles (name, description) 
SELECT 'CHEF_DE_CHANTIER', 'Supervision des chantiers' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CHEF_DE_CHANTIER');

INSERT INTO roles (name, description) 
SELECT 'CARRELEUR', 'Spécialiste carrelage' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CARRELEUR');

INSERT INTO roles (name, description) 
SELECT 'CHAPISTE', 'Spécialiste chapes et ragréages' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'CHAPISTE');

-- Insertion des adresses pour le personnel
INSERT INTO addresses (street_number, street_name, additional_address, zip_code, city, country) VALUES
('25', 'Rue des Roses', 'Appartement 4C', '69001', 'Lyon', 'France'),
('12', 'Avenue Jean Jaurès', NULL, '69007', 'Lyon', 'France'),
('8', 'Rue de la République', 'Étage 2', '69002', 'Lyon', 'France'),
('15', 'Rue de la Charité', 'Porte gauche', '69002', 'Lyon', 'France'),
('78', 'Avenue de Saxe', NULL, '69006', 'Lyon', 'France'),
('3', 'Rue de la Bourse', 'Étage 5', '69002', 'Lyon', 'France'),
('56', 'Rue de la République', NULL, '69002', 'Lyon', 'France'),
('9', 'Place des Terreaux', NULL, '69001', 'Lyon', 'France'),
('112', 'Boulevard de la Guillotière', NULL, '69007', 'Lyon', 'France'),
('45', 'Boulevard de la Croix-Rousse', NULL, '69004', 'Lyon', 'France');

-- Insertion du personnel avec une seule requête
WITH inserted_address AS (
  SELECT id, row_number() over () as rn FROM addresses
)
INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available) 
SELECT 
    'Thomas', 'Dubois', 't.dubois@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'ADMIN'), 
    '0478901234', '0612345678', 
    (SELECT id FROM inserted_address WHERE rn = 1),
    '2020-01-15'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN')
UNION ALL
SELECT 
    'Marie', 'Laurent', 'm.laurent@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'MANAGER'), 
    '0478901235', '0623456789',
    (SELECT id FROM inserted_address WHERE rn = 2),
    '2020-03-01'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'MANAGER')
UNION ALL
SELECT 
    'Pierre', 'Martin', 'p.martin@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'TECHNICIEN_SENIOR'), 
    '0478901236', '0634567890',
    (SELECT id FROM inserted_address WHERE rn = 3),
    '2020-06-15'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'TECHNICIEN_SENIOR')
UNION ALL
SELECT 
    'Sophie', 'Bernard', 's.bernard@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'TECHNICIEN'), 
    '0478901237', '0645678901',
    (SELECT id FROM inserted_address WHERE rn = 4),
    '2021-01-10'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'TECHNICIEN')
UNION ALL
SELECT 
    'Lucas', 'Petit', 'l.petit@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'APPRENTI'), 
    '0478901238', '0656789012',
    (SELECT id FROM inserted_address WHERE rn = 5),
    '2021-09-01'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'APPRENTI')
UNION ALL
SELECT 
    'Emma', 'Robert', 'e.robert@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'COMMERCIAL'), 
    '0478901239', '0667890123',
    (SELECT id FROM inserted_address WHERE rn = 6),
    '2020-04-15'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'COMMERCIAL')
UNION ALL
SELECT 
    'Thomas', 'Durand', 't.durand@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'COMPTABLE'), 
    '0478901240', '0678901234',
    (SELECT id FROM inserted_address WHERE rn = 7),
    '2022-01-20'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'COMPTABLE')
UNION ALL
SELECT 
    'Julie', 'Moreau', 'j.moreau@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'CHEF_DE_CHANTIER'), 
    '0478901241', '0689012345',
    (SELECT id FROM inserted_address WHERE rn = 8),
    '2022-03-10'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'CHEF_DE_CHANTIER')
UNION ALL
SELECT 
    'Antoine', 'Simon', 'a.simon@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'CARRELEUR'), 
    '0478901242', '0690123456',
    (SELECT id FROM inserted_address WHERE rn = 9),
    '2022-06-01'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'CARRELEUR')
UNION ALL
SELECT 
    'Claire', 'Lefebvre', 'c.lefebvre@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'CHAPISTE'), 
    '0478901243', '0601234567',
    (SELECT id FROM inserted_address WHERE rn = 10),
    '2022-09-15'::date, true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'CHAPISTE');

-- Insertion des matériaux supplémentaires
INSERT INTO materials (name, description, reference, unit, price, stock_quantity, minimum_stock, supplier, supplier_reference) VALUES
('Carrelage marbre 60x60', 'Carrelage imitation marbre 60x60cm', 'CAR-60-003', 'm²', 65.90, 300, 50, 'Ceramica Italia', 'CI-60-MB'),
('Carrelage bois 20x120', 'Carrelage imitation bois 20x120cm', 'CAR-20-004', 'm²', 55.90, 400, 80, 'Ceramica Italia', 'CI-20-WD'),
('Carrelage terrazzo 40x40', 'Carrelage terrazzo 40x40cm', 'CAR-40-005', 'm²', 49.90, 250, 40, 'Ceramica Italia', 'CI-40-TZ'),
('Mortier colle rapide', 'Mortier colle à prise rapide', 'MOR-003', 'kg', 1.50, 800, 150, 'Lafarge', 'LF-MC-RAP'),
('Chape anhydrite', 'Chape anhydrite 5cm', 'CHA-002', 'm²', 12.90, 1000, 200, 'Weber', 'WB-CH-AN'),
('Joint époxy', 'Joint époxy gris', 'JOI-002', 'ml', 3.90, 150, 30, 'Sika', 'SK-JO-EP'),
('Plinthe marbre', 'Plinthe imitation marbre', 'PLI-002', 'ml', 12.90, 80, 15, 'Ceramica Italia', 'CI-PLI-MB'),
('Enduit de rebattage rapide', 'Enduit de rebattage à prise rapide', 'END-002', 'kg', 1.80, 400, 80, 'Weber', 'WB-END-RAP'),
('Ragréage fin', 'Ragréage fin auto-nivelant', 'RAG-002', 'kg', 1.30, 500, 100, 'Lafarge', 'LF-RAG-FIN'),
('Bande d''étanchéité 15cm', 'Bande d''étanchéité 15cm', 'ETA-002', 'ml', 4.90, 100, 20, 'Sika', 'SK-ETA-15');

-- Insertion des adresses pour les clients
INSERT INTO addresses (street_number, street_name, additional_address, zip_code, city, country) VALUES
('45', 'Rue Vauban', 'Bâtiment A', '69006', 'Lyon', 'France'),
('28', 'Avenue Foch', NULL, '69006', 'Lyon', 'France'),
('15', 'Rue de Sèze', '3ème étage', '69006', 'Lyon', 'France'),
('10', 'Avenue des Brotteaux', 'Bureau 405', '69006', 'Lyon', 'France'),
('5', 'Place Bellecour', NULL, '69002', 'Lyon', 'France'),
('22', 'Rue de la République', NULL, '69002', 'Lyon', 'France'),
('37', 'Avenue Jean Jaurès', 'Entrée B', '69007', 'Lyon', 'France'),
('18', 'Rue Garibaldi', NULL, '69003', 'Lyon', 'France'),
('42', 'Quai Victor Augagneur', NULL, '69003', 'Lyon', 'France'),
('7', 'Rue de Marseille', NULL, '69007', 'Lyon', 'France');

-- Insertion des clients
WITH client_addresses AS (
  SELECT id, row_number() over (order by id) + 10 as rn FROM addresses
  ORDER BY id DESC
  LIMIT 10
)
INSERT INTO clients (company_name, firstname, lastname, email, phone, mobile, address_id, siret, notes) 
SELECT 
    'ACME Immobilier', 'Jean', 'Dupont', 'j.dupont@acme-immo.fr', '0472111213', '0612345678',
    (SELECT id FROM client_addresses WHERE rn = 11),
    '12345678901234', 'Client régulier depuis 2021';

-- Insertion des clients supplémentaires
INSERT INTO clients (company_name, firstname, lastname, email, phone, mobile, address_id, siret, notes) 
VALUES 
('Groupe Trois Pins', 'Pierre', 'Durand', 'p.durand@trois-pins.fr', '0472222222', '0623456789',
 (SELECT id FROM addresses WHERE street_name = 'Avenue Foch' LIMIT 1),
 '98765432109876', 'Client potentiel pour futurs projets'),
 
('Résidences Belle Vue', 'Marie', 'Martin', 'm.martin@belle-vue.fr', '0473333333', '0634567890',
 (SELECT id FROM addresses WHERE street_name = 'Rue de Sèze' LIMIT 1),
 '45678901234567', 'Client fidèle depuis 2020'),
 
('Copropriété Riviera', 'Sophie', 'Leroy', 's.leroy@copro-riviera.fr', '0474444444', '0645678901',
 (SELECT id FROM addresses WHERE street_name = 'Avenue des Brotteaux' LIMIT 1),
 '12345098765432', 'Nouveau client'),
 
('Particulier', 'Jean', 'Martin', 'j.fezmartin@email.com', '0475555555', '0656789012',
 (SELECT id FROM addresses WHERE street_name = 'Place Bellecour' LIMIT 1),
 NULL, 'Client particulier'),
 
('SCI Dubois', 'François', 'Dubois', 'f.dubois@sci-dubois.fr', '0476666666', '0667890123',
 (SELECT id FROM addresses WHERE street_name = 'Rue de la République' AND street_number = '22' LIMIT 1),
 '87654321098765', 'Nouveau client professionnel'),
 
('Cabinet Laurent', 'Philippe', 'Laurent', 'p.laurent@cabinet-laurent.fr', '0477777777', '0678901234',
 (SELECT id FROM addresses WHERE street_name = 'Avenue Jean Jaurès' LIMIT 1),
 '23456789012345', 'Contact via recommandation'),

('SCI Dubois', 'François', 'Dubois', 'f.dubois2222@sci-dubois.fr', '0476666666', '0667890123',
 (SELECT id FROM addresses WHERE street_name = 'Rue de la République' AND street_number = '22' LIMIT 1),
 '87654321098765', 'Nouveau client professionnel'),

('SCI Dubois12', 'Jean', 'Dubois', 'jean.dubois3333@sci-dubois.fr', '0476666666', '0667890123',
 (SELECT id FROM addresses WHERE street_name = 'Rue de la République' AND street_number = '22' LIMIT 1),
 '87654321098765', 'Nouveau client professionnel');

-- Insertion des projets supplémentaires
WITH project_addresses AS (
  SELECT id, row_number() over (order by id) + 20 as rn FROM addresses
  ORDER BY id DESC
  LIMIT 10
)
INSERT INTO projects (reference, name, description, client_id, address_id, status, start_date, end_date, estimated_duration, budget, actual_cost, margin, priority, notes) VALUES
('PRJ-2023-001', 'Rénovation appartement Montchat', 'Rénovation complète d''un appartement de 75m²', 
 (SELECT id FROM clients WHERE company_name = 'ACME Immobilier'),
 (SELECT id FROM project_addresses WHERE rn = 21),
 'termine', '2023-10-01'::date, '2023-11-15'::date, 45, 45000.00, 43000.00, 2000.00, 2, 'Premier projet terminé avec succès'),
 
('PRJ-2023-002', 'Rénovation immeuble Les Trois Pins', 'Rénovation des parties communes et de deux appartements', 
 (SELECT id FROM clients WHERE company_name = 'Groupe Trois Pins'),
 (SELECT id FROM project_addresses WHERE rn = 22),
 'termine', '2023-11-01'::date, '2023-12-20'::date, 50, 75000.00, 72000.00, 3000.00, 2, 'Projet terminé avec succès'),
 
('PRJ-2023-003', 'Rénovation hall Belle Vue', 'Rénovation du hall d''entrée de la résidence', 
 (SELECT id FROM clients WHERE company_name = 'Résidences Belle Vue'),
 (SELECT id FROM project_addresses WHERE rn = 23),
 'termine', '2023-12-01'::date, '2024-01-15'::date, 45, 85000.00, 82000.00, 3000.00, 2, 'Projet terminé avec succès'),
 
('PRJ-2023-004', 'Rénovation salle de bain Riviera', 'Rénovation complète de la salle de bain', 
 (SELECT id FROM clients WHERE company_name = 'Copropriété Riviera'),
 (SELECT id FROM project_addresses WHERE rn = 24),
 'termine', '2023-12-10'::date, '2024-01-25'::date, 45, 32000.00, 30000.00, 2000.00, 2, 'Projet terminé avec succès'),
 
('PRJ-2024-001', 'Rénovation cuisine Martin', 'Rénovation complète de la cuisine', 
 (SELECT id FROM clients WHERE lastname = 'Martin' AND firstname = 'Jean' LIMIT 1),
 (SELECT id FROM project_addresses WHERE rn = 25),
 'en_cours', '2024-01-15'::date, '2024-02-28'::date, 45, 15000.00, NULL, NULL, 2, 'Projet en cours'),
 
('PRJ-2024-002', 'Rénovation salle de bain Dubois', 'Rénovation complète de la salle de bain', 
 (SELECT id FROM clients WHERE company_name = 'SCI Dubois' LIMIT 1),
 (SELECT id FROM project_addresses WHERE rn = 26),
 'devis_accepte', '2024-02-15'::date, '2024-03-30'::date, 45, 25000.00, NULL, NULL, 2, 'Projet à venir'),
 
('PRJ-2024-003', 'Rénovation bureaux Laurent', 'Rénovation des bureaux du cabinet', 
 (SELECT id FROM clients WHERE company_name = 'Cabinet Laurent'),
 (SELECT id FROM project_addresses WHERE rn = 27),
 'devis_accepte', '2024-03-01'::date, '2024-04-15'::date, 45, 40000.00, NULL, NULL, 2, 'Projet à venir');

-- Insertion de 20 projets supplémentaires proches de la date actuelle
INSERT INTO projects (reference, name, description, client_id, address_id, status, start_date, end_date, estimated_duration, budget, actual_cost, margin, priority, notes) VALUES
-- Projets terminés récemment
('PRJ-2024-004', 'Rénovation salle de bain Mercier', 'Rénovation complète d''une salle de bain', 
 (SELECT id FROM clients WHERE company_name = 'ACME Immobilier'),
 (SELECT id FROM addresses WHERE street_name = 'Rue Garibaldi' LIMIT 1),
 'termine', '2024-01-10'::date, '2024-02-15'::date, 35, 18000.00, 17000.00, 1000.00, 2, 'Projet terminé récemment'),

('PRJ-2024-005', 'Carrelage cuisine Blanc', 'Pose de carrelage dans une cuisine', 
 (SELECT id FROM clients WHERE company_name = 'Groupe Trois Pins'),
 (SELECT id FROM addresses WHERE street_name = 'Quai Victor Augagneur' LIMIT 1),
 'termine', '2024-01-20'::date, '2024-02-25'::date, 35, 12000.00, 11500.00, 500.00, 2, 'Carrelage posé avec succès'),

('PRJ-2024-006', 'Rénovation entrée Bertrand', 'Rénovation de l''entrée d''un appartement', 
 (SELECT id FROM clients WHERE company_name = 'Résidences Belle Vue'),
 (SELECT id FROM addresses WHERE street_name = 'Rue de Marseille' LIMIT 1),
 'termine', '2024-02-01'::date, '2024-03-10'::date, 35, 9000.00, 8800.00, 200.00, 2, 'Petite rénovation terminée'),

('PRJ-2024-007', 'Carrelage terrasse Moreau', 'Pose de carrelage sur une terrasse extérieure', 
 (SELECT id FROM clients WHERE company_name = 'Copropriété Riviera'),
 (SELECT id FROM addresses WHERE street_name = 'Rue des Roses' LIMIT 1),
 'termine', '2024-02-10'::date, '2024-03-15'::date, 30, 15000.00, 14500.00, 500.00, 2, 'Terrasse terminée avant le printemps'),

('PRJ-2024-008', 'Rénovation hall Duclos', 'Rénovation du hall d''entrée d''un immeuble', 
 (SELECT id FROM clients WHERE firstname = 'Jean' AND lastname = 'Martin'),
 (SELECT id FROM addresses WHERE street_name = 'Avenue Jean Jaurès' AND street_number = '12' LIMIT 1),
 'termine', '2024-02-15'::date, '2024-03-20'::date, 30, 22000.00, 21000.00, 1000.00, 2, 'Hall d''entrée terminé'),

-- Projets en cours
('PRJ-2024-009', 'Rénovation salle de bain Legrand', 'Rénovation complète d''une salle de bain moderne', 
 (SELECT id FROM clients WHERE company_name = 'SCI Dubois' LIMIT 1),
 (SELECT id FROM addresses WHERE street_name = 'Rue de la République' AND street_number = '8' LIMIT 1),
 'en_cours', '2024-03-01'::date, '2024-04-15'::date, 45, 19500.00, NULL, NULL, 2, 'Projet en cours - 70% réalisé'),

('PRJ-2024-010', 'Carrelage cuisine Petit', 'Pose de carrelage et faïence dans une cuisine', 
 (SELECT id FROM clients WHERE company_name = 'Cabinet Laurent'),
 (SELECT id FROM addresses WHERE street_name = 'Rue de la Charité' LIMIT 1),
 'en_cours', '2024-03-05'::date, '2024-04-20'::date, 45, 13500.00, NULL, NULL, 2, 'Projet en cours - 50% réalisé'),

('PRJ-2024-011', 'Rénovation entrée Faure', 'Rénovation de l''entrée d''un immeuble de standing', 
 (SELECT id FROM clients WHERE company_name = 'ACME Immobilier'),
 (SELECT id FROM addresses WHERE street_name = 'Avenue de Saxe' LIMIT 1),
 'en_cours', '2024-03-10'::date, '2024-04-25'::date, 45, 28000.00, NULL, NULL, 1, 'Projet en cours - 40% réalisé'),

('PRJ-2024-012', 'Carrelage terrasse Roux', 'Pose de carrelage antidérapant sur une terrasse', 
 (SELECT id FROM clients WHERE company_name = 'Groupe Trois Pins'),
 (SELECT id FROM addresses WHERE street_name = 'Rue de la Bourse' LIMIT 1),
 'en_cours', '2024-03-15'::date, '2024-04-20'::date, 35, 16500.00, NULL, NULL, 2, 'Projet en cours - 30% réalisé'),

('PRJ-2024-013', 'Rénovation hall Garnier', 'Rénovation du hall d''entrée et des communs', 
 (SELECT id FROM clients WHERE company_name = 'Résidences Belle Vue'),
 (SELECT id FROM addresses WHERE street_name = 'Place des Terreaux' LIMIT 1),
 'en_cours', '2024-03-20'::date, '2024-05-05'::date, 45, 32000.00, NULL, NULL, 2, 'Projet en cours - 20% réalisé'),

-- Projets à venir prochainement
('PRJ-2024-014', 'Rénovation bureau Simon', 'Rénovation d''un bureau professionnel', 
 (SELECT id FROM clients WHERE company_name = 'Copropriété Riviera'),
 (SELECT id FROM addresses WHERE street_name = 'Boulevard de la Guillotière' LIMIT 1),
 'devis_accepte', '2024-04-01'::date, '2024-05-15'::date, 45, 24000.00, NULL, NULL, 2, 'Démarrage prévu dans les prochains jours'),

('PRJ-2024-015', 'Carrelage piscine Laurent', 'Pose de carrelage autour d''une piscine', 
 (SELECT id FROM clients WHERE firstname = 'Jean' AND lastname = 'Martin' LIMIT 1),
 (SELECT id FROM addresses WHERE street_name = 'Boulevard de la Croix-Rousse' LIMIT 1),
 'devis_accepte', '2024-04-05'::date, '2024-05-20'::date, 45, 22000.00, NULL, NULL, 2, 'Démarrage prévu début avril'),

('PRJ-2024-016', 'Rénovation complète Girard', 'Rénovation complète d''un appartement de 90m²', 
 (SELECT id FROM clients WHERE company_name = 'SCI Dubois' LIMIT 1),
 (SELECT id FROM addresses WHERE street_name = 'Rue Vauban' LIMIT 1),
 'devis_accepte', '2024-04-10'::date, '2024-06-15'::date, 65, 65000.00, NULL, NULL, 1, 'Grand projet à venir'),

('PRJ-2024-017', 'Carrelage commerces Leclerc', 'Pose de carrelage dans des locaux commerciaux', 
 (SELECT id FROM clients WHERE company_name = 'Cabinet Laurent'),
 (SELECT id FROM addresses WHERE street_name = 'Avenue Foch' LIMIT 1),
 'devis_accepte', '2024-04-15'::date, '2024-06-01'::date, 45, 38000.00, NULL, NULL, 2, 'Démarrage mi-avril'),

('PRJ-2024-018', 'Rénovation appartement Brun', 'Rénovation d''un appartement haussmannien', 
 (SELECT id FROM clients WHERE company_name = 'ACME Immobilier'),
 (SELECT id FROM addresses WHERE street_name = 'Rue de Sèze' LIMIT 1),
 'devis_en_cours', '2024-04-20'::date, '2024-06-30'::date, 70, 78000.00, NULL, NULL, 2, 'En attente de validation du client'),

('PRJ-2024-019', 'Carrelage restaurant Fournier', 'Pose de carrelage dans un restaurant', 
 (SELECT id FROM clients WHERE company_name = 'Groupe Trois Pins'),
 (SELECT id FROM addresses WHERE street_name = 'Avenue des Brotteaux' LIMIT 1),
 'devis_en_cours', '2024-04-25'::date, '2024-06-10'::date, 45, 42000.00, NULL, NULL, 2, 'Devis à finaliser'),

('PRJ-2024-020', 'Rénovation studio Dupuis', 'Rénovation complète d''un studio', 
 (SELECT id FROM clients WHERE company_name = 'Résidences Belle Vue'),
 (SELECT id FROM addresses WHERE street_name = 'Place Bellecour' LIMIT 1),
 'devis_en_cours', '2024-05-01'::date, '2024-06-15'::date, 45, 28000.00, NULL, NULL, 2, 'Négociation en cours'),

('PRJ-2024-021', 'Carrelage showroom Perrin', 'Pose de carrelage pour un showroom de luxe', 
 (SELECT id FROM clients WHERE company_name = 'Copropriété Riviera'),
 (SELECT id FROM addresses WHERE street_name = 'Rue de la République' AND street_number = '22' LIMIT 1),
 'prospect', '2024-05-05'::date, '2024-06-20'::date, 45, 48000.00, NULL, NULL, 2, 'Première visite effectuée'),

('PRJ-2024-022', 'Rénovation salon Rey', 'Rénovation d''un salon avec carrelage imitation parquet', 
 (SELECT id FROM clients WHERE firstname = 'Jean' AND lastname = 'Martin' LIMIT 1),
 (SELECT id FROM addresses WHERE street_name = 'Avenue Jean Jaurès' AND street_number = '37' LIMIT 1),
 'prospect', '2024-05-10'::date, '2024-06-25'::date, 45, 18500.00, NULL, NULL, 3, 'Premier contact établi'),

('PRJ-2024-023', 'Carrelage médical Boyer', 'Pose de carrelage technique dans un cabinet médical', 
 (SELECT id FROM clients WHERE company_name = 'SCI Dubois' LIMIT 1),
 (SELECT id FROM addresses WHERE street_name = 'Rue Garibaldi' LIMIT 1),
 'prospect', '2024-05-15'::date, '2024-06-30'::date, 45, 32000.00, NULL, NULL, 3, 'Étude technique en cours');

COMMIT; 