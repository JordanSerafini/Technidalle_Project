BEGIN;

-- Insertion des matériaux utilisés pour le projet PRJ-2023-002
INSERT INTO project_materials (project_id, material_id, stage_id, quantity_planned, quantity_used, unit_price, notes) VALUES
(2, 1, 4, 200, 200, 45.90, 'Carrelage sol parties communes utilisé en totalité'),
(2, 2, 9, 180, 180, 29.90, 'Carrelage mural appartement 1 utilisé en totalité'),
(2, 3, 4, 1200, 1200, 1.20, 'Mortier colle utilisé en totalité'),
(2, 4, 3, 5000, 5000, 0.85, 'Chape réalisée selon les normes'),
(2, 5, 10, 120, 120, 2.50, 'Joint silicone utilisé en totalité'),
(2, 1, 8, 95, 95, 45.90, 'Carrelage sol appartement 1 utilisé en totalité'),
(2, 2, 9, 120, 120, 29.90, 'Carrelage mural appartement 1 utilisé en totalité'),
(2, 3, 8, 600, 600, 1.20, 'Mortier colle utilisé en totalité'),
(2, 4, 7, 2500, 2500, 0.85, 'Chape réalisée selon les normes'),
(2, 5, 10, 60, 60, 2.50, 'Joint silicone utilisé en totalité'),
(2, 1, 14, 85, 85, 45.90, 'Carrelage sol appartement 2 utilisé en totalité'),
(2, 2, 15, 90, 90, 29.90, 'Carrelage mural appartement 2 utilisé en totalité'),
(2, 3, 14, 500, 500, 1.20, 'Mortier colle utilisé en totalité'),
(2, 4, 13, 2000, 2000, 0.85, 'Chape réalisée selon les normes'),
(2, 5, 16, 50, 50, 2.50, 'Joint silicone utilisé en totalité');

-- Insertion des matériaux utilisés pour le projet PRJ-2023-003
INSERT INTO project_materials (project_id, material_id, stage_id, quantity_planned, quantity_used, unit_price, notes) VALUES
(3, 1, 4, 180, 180, 45.90, 'Carrelage sol parties communes utilisé en totalité'),
(3, 2, 9, 150, 150, 29.90, 'Carrelage mural appartement 1 utilisé en totalité'),
(3, 3, 4, 1000, 1000, 1.20, 'Mortier colle utilisé en totalité'),
(3, 4, 3, 4000, 4000, 0.85, 'Chape réalisée selon les normes'),
(3, 5, 10, 100, 100, 2.50, 'Joint silicone utilisé en totalité'),
(3, 1, 8, 110, 110, 45.90, 'Carrelage sol appartement 1 utilisé en totalité'),
(3, 2, 9, 140, 140, 29.90, 'Carrelage mural appartement 1 utilisé en totalité'),
(3, 3, 8, 700, 700, 1.20, 'Mortier colle utilisé en totalité'),
(3, 4, 7, 3000, 3000, 0.85, 'Chape réalisée selon les normes'),
(3, 5, 10, 70, 70, 2.50, 'Joint silicone utilisé en totalité');

-- Insertion des matériaux utilisés pour le projet PRJ-2023-004
INSERT INTO project_materials (project_id, material_id, stage_id, quantity_planned, quantity_used, unit_price, notes) VALUES
(4, 1, 4, 90, 90, 45.90, 'Carrelage sol utilisé en totalité'),
(4, 2, 5, 130, 130, 29.90, 'Carrelage mural utilisé en totalité'),
(4, 3, 4, 600, 600, 1.20, 'Mortier colle utilisé en totalité'),
(4, 4, 3, 2500, 2500, 0.85, 'Chape réalisée selon les normes'),
(4, 5, 6, 60, 60, 2.50, 'Joint silicone utilisé en totalité');

-- Insertion des matériaux utilisés pour le projet PRJ-2024-001
INSERT INTO project_materials (project_id, material_id, stage_id, quantity_planned, quantity_used, unit_price, notes) VALUES
(5, 1, 4, 35, NULL, 45.90, 'Carrelage sol à utiliser'),
(5, 2, 5, 50, NULL, 29.90, 'Carrelage mural à utiliser'),
(5, 3, 4, 300, NULL, 1.20, 'Mortier colle à utiliser'),
(5, 4, 3, 1200, NULL, 0.85, 'Chape à réaliser'),
(5, 5, 6, 30, NULL, 2.50, 'Joint silicone à utiliser');

-- Insertion des événements pour le projet PRJ-2023-002
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, status, color) VALUES
('Réunion de chantier Les Trois Pins', 'Réunion de démarrage du projet', 'reunion_chantier', '2023-10-28 09:00:00', '2023-10-28 10:00:00', false, '8 Avenue Victor Hugo, Lyon', 2, 'planifié', '#4CAF50'),
('Livraison matériaux Les Trois Pins', 'Livraison des carreaux et mortier', 'livraison_materiaux', '2023-11-01 08:00:00', '2023-11-01 09:00:00', false, '8 Avenue Victor Hugo, Lyon', 2, 'planifié', '#2196F3'),
('Réception des travaux Les Trois Pins', 'Réception finale des travaux', 'rendez_vous_client', '2023-12-20 14:00:00', '2023-12-20 15:00:00', false, '8 Avenue Victor Hugo, Lyon', 2, 'planifié', '#FFC107');

-- Insertion des événements pour le projet PRJ-2023-003
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, status, color) VALUES
('Réunion de chantier Belle Vue', 'Réunion de démarrage du projet', 'reunion_chantier', '2023-11-28 09:00:00', '2023-11-28 10:00:00', false, '45 Rue de la Paix, Marseille', 3, 'planifié', '#4CAF50'),
('Livraison matériaux Belle Vue', 'Livraison des carreaux et mortier', 'livraison_materiaux', '2023-12-01 08:00:00', '2023-12-01 09:00:00', false, '45 Rue de la Paix, Marseille', 3, 'planifié', '#2196F3'),
('Réception des travaux Belle Vue', 'Réception finale des travaux', 'rendez_vous_client', '2024-01-15 14:00:00', '2024-01-15 15:00:00', false, '45 Rue de la Paix, Marseille', 3, 'planifié', '#FFC107');

-- Insertion des événements pour le projet PRJ-2023-004
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, status, color) VALUES
('Réunion de chantier Riviera', 'Réunion de démarrage du projet', 'reunion_chantier', '2023-12-08 09:00:00', '2023-12-08 10:00:00', false, '78 Rue du Commerce, Lille', 4, 'planifié', '#4CAF50'),
('Livraison matériaux Riviera', 'Livraison des carreaux et mortier', 'livraison_materiaux', '2023-12-10 08:00:00', '2023-12-10 09:00:00', false, '78 Rue du Commerce, Lille', 4, 'planifié', '#2196F3'),
('Réception des travaux Riviera', 'Réception finale des travaux', 'rendez_vous_client', '2024-01-25 14:00:00', '2024-01-25 15:00:00', false, '78 Rue du Commerce, Lille', 4, 'planifié', '#FFC107');

-- Insertion des événements pour le projet PRJ-2024-001
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, status, color) VALUES
('Réunion de chantier Martin', 'Réunion de démarrage du projet', 'reunion_chantier', '2024-01-12 09:00:00', '2024-01-12 10:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 'planifié', '#4CAF50'),
('Livraison matériaux Martin', 'Livraison des carreaux et mortier', 'livraison_materiaux', '2024-01-15 08:00:00', '2024-01-15 09:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 'planifié', '#2196F3'),
('Réception des travaux Martin', 'Réception finale des travaux', 'rendez_vous_client', '2024-02-28 14:00:00', '2024-02-28 15:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 'planifié', '#FFC107');

-- Insertion des rapports de chantier pour le projet PRJ-2023-002
INSERT INTO site_reports (project_id, report_type, description, status) VALUES
(2, 'incident', 'Retard de livraison des carreaux de 1 jour', 'ouvert'),
(2, 'remarque', 'Client très satisfait de la qualité du travail', 'ouvert'),
(2, 'photo', 'Photos de fin de chantier', 'ouvert'),
(2, 'incident', 'Problème d''accès à l''ascenseur pendant 2 heures', 'ouvert'),
(2, 'remarque', 'Bonne coordination entre les équipes', 'ouvert');

-- Insertion des rapports de chantier pour le projet PRJ-2023-003
INSERT INTO site_reports (project_id, report_type, description, status) VALUES
(3, 'incident', 'Retard de livraison des carreaux de 2 jours', 'ouvert'),
(3, 'remarque', 'Client satisfait de la qualité du travail', 'ouvert'),
(3, 'photo', 'Photos de fin de chantier', 'ouvert'),
(3, 'incident', 'Problème d''accès à l''ascenseur pendant 1 heure', 'ouvert'),
(3, 'remarque', 'Bonne coordination entre les équipes', 'ouvert');

-- Insertion des rapports de chantier pour le projet PRJ-2023-004
INSERT INTO site_reports (project_id, report_type, description, status) VALUES
(4, 'incident', 'Retard de livraison des carreaux de 1 jour', 'ouvert'),
(4, 'remarque', 'Client très satisfait de la qualité du travail', 'ouvert'),
(4, 'photo', 'Photos de fin de chantier', 'ouvert');

-- Insertion des rapports de chantier pour le projet PRJ-2024-001
INSERT INTO site_reports (project_id, report_type, description, status) VALUES
(5, 'incident', 'Retard de livraison des carreaux de 1 jour', 'ouvert'),
(5, 'remarque', 'Client pressé pour la fin des travaux', 'ouvert'),
(5, 'photo', 'Photos de début de chantier', 'ouvert');

-- Insertion des tâches pour le projet PRJ-2023-002
INSERT INTO tasks (stage_id, label, description, due_date, status, priority) VALUES
(1, 'Protection sol', 'Mettre en place les bâches de protection', '2023-11-01', 'termine', 1),
(1, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2023-11-02', 'termine', 2),
(1, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2023-11-03', 'termine', 3),
(5, 'Protection sol', 'Mettre en place les bâches de protection', '2023-11-18', 'termine', 1),
(5, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2023-11-19', 'termine', 2),
(5, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2023-11-20', 'termine', 3),
(11, 'Protection sol', 'Mettre en place les bâches de protection', '2023-12-10', 'termine', 1),
(11, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2023-12-11', 'termine', 2),
(11, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2023-12-12', 'termine', 3);

-- Insertion des tâches pour le projet PRJ-2023-003
INSERT INTO tasks (stage_id, label, description, due_date, status, priority) VALUES
(1, 'Protection sol', 'Mettre en place les bâches de protection', '2023-12-01', 'termine', 1),
(1, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2023-12-02', 'termine', 2),
(1, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2023-12-03', 'termine', 3),
(5, 'Protection sol', 'Mettre en place les bâches de protection', '2023-12-18', 'termine', 1),
(5, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2023-12-19', 'termine', 2),
(5, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2023-12-20', 'termine', 3);

-- Insertion des tâches pour le projet PRJ-2023-004
INSERT INTO tasks (stage_id, label, description, due_date, status, priority) VALUES
(1, 'Protection sol', 'Mettre en place les bâches de protection', '2023-12-10', 'termine', 1),
(1, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2023-12-11', 'termine', 2),
(1, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2023-12-12', 'termine', 3);

-- Insertion des tâches pour le projet PRJ-2024-001
INSERT INTO tasks (stage_id, label, description, due_date, status, priority) VALUES
(1, 'Protection sol', 'Mettre en place les bâches de protection', '2024-01-15', 'en_cours', 1),
(1, 'Démolition ancien carrelage', 'Retirer l''ancien carrelage', '2024-01-16', 'non_commencee', 2),
(1, 'Nettoyage chantier', 'Nettoyer le chantier après démolition', '2024-01-17', 'non_commencee', 3);

-- Insertion des pointages pour le projet PRJ-2023-001
INSERT INTO time_logs (staff_id, project_id, stage_id, check_in, check_out, comment, gps_lat, gps_long) VALUES
(2, 1, 1, '2023-10-01 07:30:00', '2023-10-01 17:30:00', 'Travail normal', 48.8566, 2.3522),
(3, 1, 1, '2023-10-01 07:30:00', '2023-10-01 17:30:00', 'Travail normal', 48.8566, 2.3522),
(4, 1, 1, '2023-10-01 07:30:00', '2023-10-01 17:30:00', 'Travail normal', 48.8566, 2.3522),
(5, 1, 1, '2023-10-01 07:30:00', '2023-10-01 17:30:00', 'Travail normal', 48.8566, 2.3522),
(2, 1, 2, '2023-10-04 07:30:00', '2023-10-04 17:30:00', 'Travail normal', 48.8566, 2.3522),
(3, 1, 2, '2023-10-04 07:30:00', '2023-10-04 17:30:00', 'Travail normal', 48.8566, 2.3522),
(4, 1, 2, '2023-10-04 07:30:00', '2023-10-04 17:30:00', 'Travail normal', 48.8566, 2.3522),
(5, 1, 2, '2023-10-04 07:30:00', '2023-10-04 17:30:00', 'Travail normal', 48.8566, 2.3522);

-- Insertion des pointages pour le projet PRJ-2023-002
INSERT INTO time_logs (staff_id, project_id, stage_id, check_in, check_out, comment, gps_lat, gps_long) VALUES
(2, 2, 1, '2023-11-01 07:30:00', '2023-11-01 17:30:00', 'Travail normal', 45.7578, 4.8320),
(3, 2, 1, '2023-11-01 07:30:00', '2023-11-01 17:30:00', 'Travail normal', 45.7578, 4.8320),
(4, 2, 1, '2023-11-01 07:30:00', '2023-11-01 17:30:00', 'Travail normal', 45.7578, 4.8320),
(5, 2, 1, '2023-11-01 07:30:00', '2023-11-01 17:30:00', 'Travail normal', 45.7578, 4.8320),
(9, 2, 1, '2023-11-01 07:30:00', '2023-11-01 17:30:00', 'Travail normal', 45.7578, 4.8320),
(10, 2, 1, '2023-11-01 07:30:00', '2023-11-01 17:30:00', 'Travail normal', 45.7578, 4.8320),
(2, 2, 5, '2023-11-18 07:30:00', '2023-11-18 17:30:00', 'Travail normal', 45.7578, 4.8320),
(3, 2, 5, '2023-11-18 07:30:00', '2023-11-18 17:30:00', 'Travail normal', 45.7578, 4.8320),
(4, 2, 5, '2023-11-18 07:30:00', '2023-11-18 17:30:00', 'Travail normal', 45.7578, 4.8320),
(5, 2, 5, '2023-11-18 07:30:00', '2023-11-18 17:30:00', 'Travail normal', 45.7578, 4.8320),
(9, 2, 5, '2023-11-18 07:30:00', '2023-11-18 17:30:00', 'Travail normal', 45.7578, 4.8320),
(10, 2, 5, '2023-11-18 07:30:00', '2023-11-18 17:30:00', 'Travail normal', 45.7578, 4.8320);

-- Insertion des pointages pour le projet PRJ-2023-003
INSERT INTO time_logs (staff_id, project_id, stage_id, check_in, check_out, comment, gps_lat, gps_long) VALUES
(2, 3, 1, '2023-12-01 07:30:00', '2023-12-01 17:30:00', 'Travail normal', 43.2965, 5.3698),
(3, 3, 1, '2023-12-01 07:30:00', '2023-12-01 17:30:00', 'Travail normal', 43.2965, 5.3698),
(4, 3, 1, '2023-12-01 07:30:00', '2023-12-01 17:30:00', 'Travail normal', 43.2965, 5.3698),
(5, 3, 1, '2023-12-01 07:30:00', '2023-12-01 17:30:00', 'Travail normal', 43.2965, 5.3698),
(9, 3, 1, '2023-12-01 07:30:00', '2023-12-01 17:30:00', 'Travail normal', 43.2965, 5.3698),
(10, 3, 1, '2023-12-01 07:30:00', '2023-12-01 17:30:00', 'Travail normal', 43.2965, 5.3698),
(2, 3, 5, '2023-12-18 07:30:00', '2023-12-18 17:30:00', 'Travail normal', 43.2965, 5.3698),
(3, 3, 5, '2023-12-18 07:30:00', '2023-12-18 17:30:00', 'Travail normal', 43.2965, 5.3698),
(4, 3, 5, '2023-12-18 07:30:00', '2023-12-18 17:30:00', 'Travail normal', 43.2965, 5.3698),
(5, 3, 5, '2023-12-18 07:30:00', '2023-12-18 17:30:00', 'Travail normal', 43.2965, 5.3698),
(9, 3, 5, '2023-12-18 07:30:00', '2023-12-18 17:30:00', 'Travail normal', 43.2965, 5.3698),
(10, 3, 5, '2023-12-18 07:30:00', '2023-12-18 17:30:00', 'Travail normal', 43.2965, 5.3698);

-- Insertion des pointages pour le projet PRJ-2023-004
INSERT INTO time_logs (staff_id, project_id, stage_id, check_in, check_out, comment, gps_lat, gps_long) VALUES
(2, 4, 1, '2023-12-10 07:30:00', '2023-12-10 17:30:00', 'Travail normal', 50.6292, 3.0573),
(3, 4, 1, '2023-12-10 07:30:00', '2023-12-10 17:30:00', 'Travail normal', 50.6292, 3.0573),
(4, 4, 1, '2023-12-10 07:30:00', '2023-12-10 17:30:00', 'Travail normal', 50.6292, 3.0573),
(5, 4, 1, '2023-12-10 07:30:00', '2023-12-10 17:30:00', 'Travail normal', 50.6292, 3.0573),
(9, 4, 1, '2023-12-10 07:30:00', '2023-12-10 17:30:00', 'Travail normal', 50.6292, 3.0573),
(10, 4, 1, '2023-12-10 07:30:00', '2023-12-10 17:30:00', 'Travail normal', 50.6292, 3.0573);

-- Insertion des pointages pour le projet PRJ-2024-001
INSERT INTO time_logs (staff_id, project_id, stage_id, check_in, check_out, comment, gps_lat, gps_long) VALUES
(2, 5, 1, '2024-01-15 07:30:00', '2024-01-15 17:30:00', 'Travail normal', 44.8378, -0.5792),
(3, 5, 1, '2024-01-15 07:30:00', '2024-01-15 17:30:00', 'Travail normal', 44.8378, -0.5792),
(4, 5, 1, '2024-01-15 07:30:00', '2024-01-15 17:30:00', 'Travail normal', 44.8378, -0.5792),
(5, 5, 1, '2024-01-15 07:30:00', '2024-01-15 17:30:00', 'Travail normal', 44.8378, -0.5792),
(9, 5, 1, '2024-01-15 07:30:00', '2024-01-15 17:30:00', 'Travail normal', 44.8378, -0.5792),
(10, 5, 1, '2024-01-15 07:30:00', '2024-01-15 17:30:00', 'Travail normal', 44.8378, -0.5792);

-- Insertion des médias pour les projets
INSERT INTO project_media (project_id, media_type, file_path, description, created_at)
VALUES 
    (2, 'photo', 'data:image/jpeg;base64,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', 'Photo du chantier terminé', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

COMMIT; 