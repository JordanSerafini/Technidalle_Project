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

-- Insertion des événements pour le projet PRJ-2024-001 (en cours)
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, staff_id, status, color) VALUES
('Inspection chantier Martin', 'Inspection de l''avancement des travaux', 'visite_technique', '2024-01-20 10:00:00', '2024-01-20 11:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#9C27B0'),
('Formation sécurité Martin', 'Formation sécurité pour l''équipe', 'formation', '2024-01-22 14:00:00', '2024-01-22 16:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#FF5722'),
('Réunion équipe Martin', 'Réunion de coordination hebdomadaire', 'reunion_interne', '2024-01-24 09:00:00', '2024-01-24 10:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#607D8B'),
('Contrôle qualité Martin', 'Contrôle qualité des finitions', 'visite_technique', '2024-01-26 11:00:00', '2024-01-26 12:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 3, 'planifié', '#795548'),
('Livraison matériaux supplémentaires Martin', 'Livraison de carreaux supplémentaires', 'livraison_materiaux', '2024-01-27 08:00:00', '2024-01-27 09:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, NULL, 'planifié', '#2196F3'),
('Réunion client Martin', 'Point d''avancement avec le client', 'rendez_vous_client', '2024-01-29 15:00:00', '2024-01-29 16:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#FFC107'),
('Formation technique Martin', 'Formation sur les nouvelles techniques de pose', 'formation', '2024-01-31 13:00:00', '2024-01-31 15:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 9, 'planifié', '#FF5722'),
('Contrôle sécurité Martin', 'Inspection sécurité du chantier', 'visite_technique', '2024-02-01 10:00:00', '2024-02-01 11:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#9C27B0'),
('Réunion finition Martin', 'Réunion de finition avec l''équipe', 'reunion_interne', '2024-02-03 09:00:00', '2024-02-03 10:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#607D8B'),
('Préparation réception Martin', 'Préparation du chantier pour la réception', 'visite_technique', '2024-02-05 14:00:00', '2024-02-05 15:00:00', false, '23 Boulevard Saint-Michel, Bordeaux', 5, 2, 'planifié', '#795548');

-- Insertion des événements pour un nouveau projet PRJ-2024-002 (à venir)
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, staff_id, status, color) VALUES
('Visite chantier Dubois', 'Première visite du chantier', 'visite_technique', '2024-02-10 10:00:00', '2024-02-10 11:00:00', false, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#4CAF50'),
('Réunion de démarrage Dubois', 'Réunion de démarrage du projet', 'reunion_chantier', '2024-02-12 09:00:00', '2024-02-12 10:00:00', false, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#4CAF50'),
('Formation sécurité Dubois', 'Formation sécurité pour la nouvelle équipe', 'formation', '2024-02-14 14:00:00', '2024-02-14 16:00:00', false, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#FF5722'),
('Livraison matériaux Dubois', 'Livraison des premiers matériaux', 'livraison_materiaux', '2024-02-15 08:00:00', '2024-02-15 09:00:00', false, '15 Rue des Lilas, Paris', 6, NULL, 'planifié', '#2196F3'),
('Début des travaux Dubois', 'Début des travaux de démolition', 'reunion_chantier', '2024-02-17 08:00:00', '2024-02-17 17:00:00', true, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#4CAF50'),
('Réunion équipe Dubois', 'Première réunion d''équipe sur le chantier', 'reunion_interne', '2024-02-19 09:00:00', '2024-02-19 10:00:00', false, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#607D8B'),
('Contrôle qualité Dubois', 'Premier contrôle qualité', 'visite_technique', '2024-02-21 11:00:00', '2024-02-21 12:00:00', false, '15 Rue des Lilas, Paris', 6, 3, 'planifié', '#795548'),
('Réunion client Dubois', 'Point d''avancement avec le client', 'rendez_vous_client', '2024-02-23 15:00:00', '2024-02-23 16:00:00', false, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#FFC107'),
('Formation technique Dubois', 'Formation sur les spécificités du projet', 'formation', '2024-02-26 13:00:00', '2024-02-26 15:00:00', false, '15 Rue des Lilas, Paris', 6, 9, 'planifié', '#FF5722'),
('Inspection chantier Dubois', 'Inspection de l''avancement', 'visite_technique', '2024-02-28 10:00:00', '2024-02-28 11:00:00', false, '15 Rue des Lilas, Paris', 6, 2, 'planifié', '#9C27B0');

-- Insertion des événements pour un nouveau projet PRJ-2024-003 (à venir)
INSERT INTO events (title, description, event_type, start_date, end_date, all_day, location, project_id, staff_id, status, color) VALUES
('Visite chantier Laurent', 'Première visite du chantier', 'visite_technique', '2024-03-05 10:00:00', '2024-03-05 11:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#4CAF50'),
('Réunion de démarrage Laurent', 'Réunion de démarrage du projet', 'reunion_chantier', '2024-03-07 09:00:00', '2024-03-07 10:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#4CAF50'),
('Formation sécurité Laurent', 'Formation sécurité pour la nouvelle équipe', 'formation', '2024-03-09 14:00:00', '2024-03-09 16:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#FF5722'),
('Livraison matériaux Laurent', 'Livraison des premiers matériaux', 'livraison_materiaux', '2024-03-10 08:00:00', '2024-03-10 09:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, NULL, 'planifié', '#2196F3'),
('Début des travaux Laurent', 'Début des travaux de démolition', 'reunion_chantier', '2024-03-12 08:00:00', '2024-03-12 17:00:00', true, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#4CAF50'),
('Réunion équipe Laurent', 'Première réunion d''équipe sur le chantier', 'reunion_interne', '2024-03-14 09:00:00', '2024-03-14 10:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#607D8B'),
('Contrôle qualité Laurent', 'Premier contrôle qualité', 'visite_technique', '2024-03-16 11:00:00', '2024-03-16 12:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 3, 'planifié', '#795548'),
('Réunion client Laurent', 'Point d''avancement avec le client', 'rendez_vous_client', '2024-03-18 15:00:00', '2024-03-18 16:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#FFC107'),
('Formation technique Laurent', 'Formation sur les spécificités du projet', 'formation', '2024-03-20 13:00:00', '2024-03-20 15:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 9, 'planifié', '#FF5722'),
('Inspection chantier Laurent', 'Inspection de l''avancement', 'visite_technique', '2024-03-22 10:00:00', '2024-03-22 11:00:00', false, '8 Avenue des Champs-Élysées, Paris', 7, 2, 'planifié', '#9C27B0');

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
    (2, 'photo', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNc0KETbLI7y_xdOXiugIlnEDxcvcE8b-kJg&s', 'Photo du chantier terminé', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

COMMIT; 