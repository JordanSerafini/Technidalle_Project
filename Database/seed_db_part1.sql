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
INSERT INTO addresses (id, street_number, street_name, additional_address, zip_code, city, country) VALUES
(1, '25', 'Rue des Roses', 'Appartement 4C', '69001', 'Lyon', 'France'),
(2, '12', 'Avenue Jean Jaurès', NULL, '69007', 'Lyon', 'France'),
(3, '8', 'Rue de la République', 'Étage 2', '69002', 'Lyon', 'France'),
(4, '15', 'Rue de la Charité', 'Porte gauche', '69002', 'Lyon', 'France'),
(5, '78', 'Avenue de Saxe', NULL, '69006', 'Lyon', 'France'),
(6, '3', 'Rue de la Bourse', 'Étage 5', '69002', 'Lyon', 'France'),
(7, '56', 'Rue de la République', NULL, '69002', 'Lyon', 'France'),
(8, '9', 'Place des Terreaux', NULL, '69001', 'Lyon', 'France'),
(9, '112', 'Boulevard de la Guillotière', NULL, '69007', 'Lyon', 'France'),
(10, '45', 'Boulevard de la Croix-Rousse', NULL, '69004', 'Lyon', 'France')
ON CONFLICT (id) DO NOTHING;

-- Insertion du personnel (mise à jour pour utiliser les rôles par nom au lieu d'ID)
INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available) 
SELECT 
    'Thomas', 'Dubois', 't.dubois@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'ADMIN'), 
    '0478901234', '0612345678', 1, '2020-01-15', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'ADMIN');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Marie', 'Laurent', 'm.laurent@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'MANAGER'), 
    '0478901235', '0623456789', 2, '2020-03-01', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'MANAGER');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Pierre', 'Martin', 'p.martin@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'TECHNICIEN_SENIOR'), 
    '0478901236', '0634567890', 3, '2020-06-15', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'TECHNICIEN_SENIOR');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Sophie', 'Bernard', 's.bernard@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'TECHNICIEN'), 
    '0478901237', '0645678901', 4, '2021-01-10', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'TECHNICIEN');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Lucas', 'Petit', 'l.petit@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'APPRENTI'), 
    '0478901238', '0656789012', 5, '2021-09-01', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'APPRENTI');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Emma', 'Robert', 'e.robert@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'COMMERCIAL'), 
    '0478901239', '0667890123', 6, '2021-11-15', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'COMMERCIAL');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Thomas', 'Durand', 't.durand@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'COMPTABLE'), 
    '0478901240', '0678901234', 7, '2022-01-20', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'COMPTABLE');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Julie', 'Moreau', 'j.moreau@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'CHEF_DE_CHANTIER'), 
    '0478901241', '0689012345', 8, '2022-03-10', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'CHEF_DE_CHANTIER');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Antoine', 'Simon', 'a.simon@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'CARRELEUR'), 
    '0478901242', '0690123456', 9, '2022-06-01', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'CARRELEUR');

INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available)
SELECT 
    'Claire', 'Lefebvre', 'c.lefebvre@technidalle.fr', 
    (SELECT id FROM roles WHERE name = 'CHAPISTE'), 
    '0478901243', '0601234567', 10, '2022-09-15', true
WHERE EXISTS (SELECT 1 FROM roles WHERE name = 'CHAPISTE');

-- Insertion des matériaux supplémentaires
INSERT INTO materials (id, name, description, reference, unit, price, stock_quantity, minimum_stock, supplier, supplier_reference) VALUES
(1, 'Carrelage marbre 60x60', 'Carrelage imitation marbre 60x60cm', 'CAR-60-003', 'm²', 65.90, 300, 50, 'Ceramica Italia', 'CI-60-MB'),
(2, 'Carrelage bois 20x120', 'Carrelage imitation bois 20x120cm', 'CAR-20-004', 'm²', 55.90, 400, 80, 'Ceramica Italia', 'CI-20-WD'),
(3, 'Carrelage terrazzo 40x40', 'Carrelage terrazzo 40x40cm', 'CAR-40-005', 'm²', 49.90, 250, 40, 'Ceramica Italia', 'CI-40-TZ'),
(4, 'Mortier colle rapide', 'Mortier colle à prise rapide', 'MOR-003', 'kg', 1.50, 800, 150, 'Lafarge', 'LF-MC-RAP'),
(5, 'Chape anhydrite', 'Chape anhydrite 5cm', 'CHA-002', 'm²', 12.90, 1000, 200, 'Weber', 'WB-CH-AN'),
(6, 'Joint époxy', 'Joint époxy gris', 'JOI-002', 'ml', 3.90, 150, 30, 'Sika', 'SK-JO-EP'),
(7, 'Plinthe marbre', 'Plinthe imitation marbre', 'PLI-002', 'ml', 12.90, 80, 15, 'Ceramica Italia', 'CI-PLI-MB'),
(8, 'Enduit de rebattage rapide', 'Enduit de rebattage à prise rapide', 'END-002', 'kg', 1.80, 400, 80, 'Weber', 'WB-END-RAP'),
(9, 'Ragréage fin', 'Ragréage fin auto-nivelant', 'RAG-002', 'kg', 1.30, 500, 100, 'Lafarge', 'LF-RAG-FIN'),
(10, 'Bande d''étanchéité 15cm', 'Bande d''étanchéité 15cm', 'ETA-002', 'ml', 4.90, 100, 20, 'Sika', 'SK-ETA-15')
ON CONFLICT (id) DO NOTHING;

-- Insertion des adresses pour les clients
INSERT INTO addresses (id, street_number, street_name, additional_address, zip_code, city, country) VALUES
(11, '45', 'Rue Vauban', 'Bâtiment A', '69006', 'Lyon', 'France'),
(12, '28', 'Avenue Foch', NULL, '69006', 'Lyon', 'France'),
(13, '15', 'Rue de Sèze', '3ème étage', '69006', 'Lyon', 'France'),
(14, '10', 'Avenue des Brotteaux', 'Bureau 405', '69006', 'Lyon', 'France'),
(15, '5', 'Place Bellecour', NULL, '69002', 'Lyon', 'France'),
(16, '22', 'Rue de la République', NULL, '69002', 'Lyon', 'France'),
(17, '37', 'Avenue Jean Jaurès', 'Entrée B', '69007', 'Lyon', 'France'),
(18, '18', 'Rue Garibaldi', NULL, '69003', 'Lyon', 'France'),
(19, '42', 'Quai Victor Augagneur', NULL, '69003', 'Lyon', 'France'),
(20, '7', 'Rue de Marseille', NULL, '69007', 'Lyon', 'France')
ON CONFLICT (id) DO NOTHING;

-- Insertion des clients
INSERT INTO clients (id, company_name, firstname, lastname, email, phone, mobile, address_id, siret, notes) VALUES
(1, 'ACME Immobilier', 'Jean', 'Dupont', 'j.dupont@acme-immo.fr', '0472111213', '0612345678', 11, '12345678901234', 'Client régulier depuis 2021'),
(2, 'Groupe Habitat', 'Marie', 'Durand', 'm.durand@groupe-habitat.fr', '0472131415', '0623456789', 12, '23456789012345', 'Projets résidentiels haut de gamme'),
(3, 'Particulier', 'Pierre', 'Martin', 'p.martin@gmail.com', '0472151617', '0634567890', 13, NULL, 'Recommandé par ACME Immobilier'),
(4, 'Résidences Lyon', 'Sophie', 'Petit', 's.petit@residences-lyon.fr', '0472171819', '0645678901', 14, '34567890123456', 'Gestionnaire de résidences'),
(5, 'Particulier', 'Luc', 'Bernard', 'l.bernard@outlook.fr', '0472192021', '0656789012', 15, NULL, 'Appartement en rénovation complète'),
(6, 'LuxRenovation', 'Emma', 'Roux', 'e.roux@luxrenovation.fr', '0472212223', '0667890123', 16, '45678901234567', 'Partenaire sur projets de luxe'),
(7, 'Particulier', 'Thomas', 'Lefebvre', 't.lefebvre@gmail.com', '0472232425', '0678901234', 17, NULL, 'Maison neuve à équiper'),
(8, 'CityConstruct', 'Julie', 'Moreau', 'j.moreau@cityconstruct.fr', '0472252627', '0689012345', 18, '56789012345678', 'Projets urbains multiples'),
(9, 'Particulier', 'Antoine', 'Simon', 'a.simon@free.fr', '0472272829', '0690123456', 19, NULL, 'Rénovation salle de bain urgente'),
(10, 'Immobilière du Rhône', 'Claire', 'Dubois', 'c.dubois@immorhone.fr', '0472293031', '0601234567', 20, '67890123456789', 'Plusieurs immeubles en gestion')
ON CONFLICT (id) DO NOTHING;

-- Insertion des projets supplémentaires
INSERT INTO projects (id, reference, name, description, client_id, address_id, status, start_date, end_date, estimated_duration, budget, actual_cost, margin, priority, notes) VALUES
(1, 'PRJ-2023-001', 'Rénovation appartement Montchat', 'Rénovation complète d''un appartement de 75m²', 3, 3, 'termine', '2023-10-01', '2023-11-15', 45, 45000.00, 43000.00, 2000.00, 2, 'Premier projet terminé avec succès'),
(2, 'PRJ-2023-002', 'Rénovation immeuble Les Trois Pins', 'Rénovation des parties communes et 2 appartements', 4, 4, 'termine', '2023-11-01', '2023-12-15', 45, 75000.00, 72000.00, 3000.00, 2, 'Projet terminé avec satisfaction'),
(3, 'PRJ-2023-003', 'Rénovation immeuble Belle Vue', 'Rénovation des parties communes et 4 appartements', 4, 4, 'termine', '2023-12-01', '2024-01-15', 45, 85000.00, 82000.00, 3000.00, 2, 'Projet terminé avec satisfaction'),
(4, 'PRJ-2023-004', 'Rénovation appartement Riviera', 'Rénovation d''un appartement de 90m²', 6, 6, 'termine', '2023-12-10', '2024-01-25', 45, 32000.00, 30500.00, 1500.00, 3, 'Projet terminé dans les délais'),
(5, 'PRJ-2024-001', 'Rénovation appartement Martin', 'Rénovation d''un appartement de 45m²', 8, 8, 'en_cours', '2024-01-15', '2024-02-28', 45, 15000.00, NULL, NULL, 3, 'En cours de réalisation'),
(6, 'PRJ-2024-009', 'Rénovation immeuble Les Roses', 'Rénovation des parties communes et 2 appartements', 8, 8, 'en_preparation', '2024-05-01', '2024-06-15', 45, 55000.00, NULL, NULL, 3, 'Projet en préparation'),
(7, 'PRJ-2024-010', 'Rénovation appartement Paris Centre', 'Rénovation d''un appartement de 110m²', 10, 10, 'devis_accepte', '2024-07-01', '2024-08-15', 45, 40000.00, NULL, NULL, 3, 'Devis accepté - en attente de planification')
ON CONFLICT (id) DO NOTHING;

COMMIT; 