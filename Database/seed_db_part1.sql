BEGIN;

-- Insertion des rôles
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Administrateur système avec tous les droits'),
('MANAGER', 'Responsable de chantier et gestion des équipes'),
('TECHNICIEN_SENIOR', 'Technicien expérimenté avec responsabilités'),
('TECHNICIEN', 'Technicien de chantier'),
('APPRENTI', 'Apprenti en formation'),
('COMMERCIAL', 'Commercial et gestion des devis'),
('COMPTABLE', 'Gestion comptable et facturation'),
('CHEF_DE_CHANTIER', 'Supervision des chantiers'),
('CARRELEUR', 'Spécialiste carrelage'),
('CHAPISTE', 'Spécialiste chapes et ragréages')
ON CONFLICT (name) DO NOTHING;

-- Insertion des adresses pour le personnel
INSERT INTO addresses (street_number, street_name, additional_address, zip_code, city, country) VALUES
('25', 'Rue des Roses', 'Appartement 4C', '69001', 'Lyon', 'France'),
('12', 'Avenue Jean Jaurès', NULL, '69007', 'Lyon', 'France'),
('8', 'Rue de la République', 'Étage 2', '69002', 'Lyon', 'France'),
('45', 'Boulevard de la Croix-Rousse', NULL, '69004', 'Lyon', 'France'),
('15', 'Rue de la Charité', 'Porte gauche', '69002', 'Lyon', 'France'),
('78', 'Avenue de Saxe', NULL, '69006', 'Lyon', 'France'),
('3', 'Rue de la Bourse', 'Étage 5', '69002', 'Lyon', 'France'),
('56', 'Rue de la République', NULL, '69002', 'Lyon', 'France'),
('9', 'Place des Terreaux', NULL, '69001', 'Lyon', 'France'),
('112', 'Boulevard de la Guillotière', NULL, '69007', 'Lyon', 'France');

-- Insertion du personnel
INSERT INTO staff (firstname, lastname, email, role_id, phone, mobile, address_id, hire_date, is_available) VALUES
('Thomas', 'Dubois', 't.dubois@technidalle.fr', 1, '0478901234', '0612345678', 1, '2020-01-15', true),
('Marie', 'Laurent', 'm.laurent@technidalle.fr', 2, '0478901235', '0623456789', 2, '2020-03-01', true),
('Pierre', 'Martin', 'p.martin@technidalle.fr', 3, '0478901236', '0634567890', 3, '2020-06-15', true),
('Sophie', 'Bernard', 's.bernard@technidalle.fr', 4, '0478901237', '0645678901', 4, '2021-01-10', true),
('Lucas', 'Petit', 'l.petit@technidalle.fr', 5, '0478901238', '0656789012', 5, '2021-09-01', true),
('Emma', 'Robert', 'e.robert@technidalle.fr', 6, '0478901239', '0667890123', 6, '2021-11-15', true),
('Thomas', 'Durand', 't.durand@technidalle.fr', 7, '0478901240', '0678901234', 7, '2022-01-20', true),
('Julie', 'Moreau', 'j.moreau@technidalle.fr', 8, '0478901241', '0689012345', 8, '2022-03-10', true),
('Antoine', 'Simon', 'a.simon@technidalle.fr', 9, '0478901242', '0690123456', 9, '2022-06-01', true),
('Claire', 'Lefebvre', 'c.lefebvre@technidalle.fr', 10, '0478901243', '0601234567', 10, '2022-09-15', true);

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

-- Insertion des projets supplémentaires
INSERT INTO projects (reference, name, description, client_id, address_id, status, start_date, end_date, estimated_duration, budget, actual_cost, margin, priority, notes) VALUES
('PRJ-2023-003', 'Rénovation immeuble Belle Vue', 'Rénovation des parties communes et 4 appartements', 4, 4, 'termine', '2023-12-01', '2024-01-15', 45, 85000.00, 82000.00, 3000.00, 2, 'Projet terminé avec satisfaction'),
('PRJ-2023-004', 'Rénovation appartement Riviera', 'Rénovation d''un appartement de 90m²', 6, 6, 'termine', '2023-12-10', '2024-01-25', 45, 32000.00, 30500.00, 1500.00, 3, 'Projet terminé dans les délais'),
('PRJ-2024-009', 'Rénovation immeuble Les Roses', 'Rénovation des parties communes et 2 appartements', 8, 8, 'en_preparation', '2024-05-01', '2024-06-15', 45, 55000.00, NULL, NULL, 3, 'Projet en préparation'),
('PRJ-2024-010', 'Rénovation appartement Paris Centre', 'Rénovation d''un appartement de 110m²', 10, 10, 'devis_accepte', '2024-07-01', '2024-08-15', 45, 40000.00, NULL, NULL, 3, 'Devis accepté - en attente de planification');

COMMIT; 