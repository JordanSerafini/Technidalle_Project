BEGIN;

-- Insertion des étapes pour le projet PRJ-2023-002
INSERT INTO project_stages (project_id, name, description, start_date, end_date, status, order_index, estimated_duration, actual_duration, completion_percentage, notes) VALUES
(2, 'Démolition parties communes', 'Démolition des anciens revêtements des parties communes', '2023-11-01', '2023-11-05', 'termine', 1, 5, 5, 100, 'Démolition terminée dans les délais'),
(2, 'Préparation sol parties communes', 'Préparation et nivelage du sol des parties communes', '2023-11-06', '2023-11-07', 'termine', 2, 2, 2, 100, 'Sol bien préparé'),
(2, 'Chape parties communes', 'Réalisation de la chape des parties communes', '2023-11-08', '2023-11-10', 'termine', 3, 3, 3, 100, 'Chape réalisée selon les normes'),
(2, 'Carrelage sol parties communes', 'Pose du carrelage au sol des parties communes', '2023-11-11', '2023-11-17', 'termine', 4, 7, 7, 100, 'Carrelage posé avec soin'),
(2, 'Démolition appartement 1', 'Démolition des anciens revêtements appartement 1', '2023-11-18', '2023-11-20', 'termine', 5, 3, 3, 100, 'Démolition terminée'),
(2, 'Préparation sol appartement 1', 'Préparation et nivelage du sol appartement 1', '2023-11-21', '2023-11-22', 'termine', 6, 2, 2, 100, 'Sol bien préparé'),
(2, 'Chape appartement 1', 'Réalisation de la chape appartement 1', '2023-11-23', '2023-11-25', 'termine', 7, 3, 3, 100, 'Chape réalisée selon les normes'),
(2, 'Carrelage sol appartement 1', 'Pose du carrelage au sol appartement 1', '2023-11-26', '2023-12-02', 'termine', 8, 7, 7, 100, 'Carrelage posé avec soin'),
(2, 'Carrelage mur appartement 1', 'Pose du carrelage mural appartement 1', '2023-12-03', '2023-12-07', 'termine', 9, 5, 5, 100, 'Finitions soignées'),
(2, 'Jointoiement appartement 1', 'Jointoiement et finitions appartement 1', '2023-12-08', '2023-12-09', 'termine', 10, 2, 2, 100, 'Jointoiement propre'),
(2, 'Démolition appartement 2', 'Démolition des anciens revêtements appartement 2', '2023-12-10', '2023-12-12', 'termine', 11, 3, 3, 100, 'Démolition terminée'),
(2, 'Préparation sol appartement 2', 'Préparation et nivelage du sol appartement 2', '2023-12-13', '2023-12-14', 'termine', 12, 2, 2, 100, 'Sol bien préparé'),
(2, 'Chape appartement 2', 'Réalisation de la chape appartement 2', '2023-12-15', '2023-12-17', 'termine', 13, 3, 3, 100, 'Chape réalisée selon les normes'),
(2, 'Carrelage sol appartement 2', 'Pose du carrelage au sol appartement 2', '2023-12-18', '2023-12-20', 'termine', 14, 3, 3, 100, 'Carrelage posé avec soin'),
(2, 'Carrelage mur appartement 2', 'Pose du carrelage mural appartement 2', '2023-12-21', '2023-12-22', 'termine', 15, 2, 2, 100, 'Finitions soignées'),
(2, 'Jointoiement appartement 2', 'Jointoiement et finitions appartement 2', '2023-12-23', '2023-12-23', 'termine', 16, 1, 1, 100, 'Jointoiement propre');

-- Insertion des étapes pour le projet PRJ-2023-003
INSERT INTO project_stages (project_id, name, description, start_date, end_date, status, order_index, estimated_duration, actual_duration, completion_percentage, notes) VALUES
(3, 'Démolition parties communes', 'Démolition des anciens revêtements des parties communes', '2023-12-01', '2023-12-05', 'termine', 1, 5, 5, 100, 'Démolition terminée dans les délais'),
(3, 'Préparation sol parties communes', 'Préparation et nivelage du sol des parties communes', '2023-12-06', '2023-12-07', 'termine', 2, 2, 2, 100, 'Sol bien préparé'),
(3, 'Chape parties communes', 'Réalisation de la chape des parties communes', '2023-12-08', '2023-12-10', 'termine', 3, 3, 3, 100, 'Chape réalisée selon les normes'),
(3, 'Carrelage sol parties communes', 'Pose du carrelage au sol des parties communes', '2023-12-11', '2023-12-17', 'termine', 4, 7, 7, 100, 'Carrelage posé avec soin'),
(3, 'Démolition appartement 1', 'Démolition des anciens revêtements appartement 1', '2023-12-18', '2023-12-20', 'termine', 5, 3, 3, 100, 'Démolition terminée'),
(3, 'Préparation sol appartement 1', 'Préparation et nivelage du sol appartement 1', '2023-12-21', '2023-12-22', 'termine', 6, 2, 2, 100, 'Sol bien préparé'),
(3, 'Chape appartement 1', 'Réalisation de la chape appartement 1', '2023-12-23', '2023-12-25', 'termine', 7, 3, 3, 100, 'Chape réalisée selon les normes'),
(3, 'Carrelage sol appartement 1', 'Pose du carrelage au sol appartement 1', '2023-12-26', '2024-01-01', 'termine', 8, 7, 7, 100, 'Carrelage posé avec soin'),
(3, 'Carrelage mur appartement 1', 'Pose du carrelage mural appartement 1', '2024-01-02', '2024-01-06', 'termine', 9, 5, 5, 100, 'Finitions soignées'),
(3, 'Jointoiement appartement 1', 'Jointoiement et finitions appartement 1', '2024-01-07', '2024-01-08', 'termine', 10, 2, 2, 100, 'Jointoiement propre'),
(3, 'Nettoyage et réception', 'Nettoyage final et réception des travaux', '2024-01-09', '2024-01-09', 'termine', 11, 1, 1, 100, 'Client satisfait');

-- Insertion des étapes pour le projet PRJ-2023-004
INSERT INTO project_stages (project_id, name, description, start_date, end_date, status, order_index, estimated_duration, actual_duration, completion_percentage, notes) VALUES
(4, 'Démolition', 'Démolition des anciens revêtements', '2023-12-10', '2023-12-12', 'termine', 1, 3, 3, 100, 'Démolition terminée dans les délais'),
(4, 'Préparation sol', 'Préparation et nivelage du sol', '2023-12-13', '2023-12-14', 'termine', 2, 2, 2, 100, 'Sol bien préparé'),
(4, 'Chape', 'Réalisation de la chape', '2023-12-15', '2023-12-17', 'termine', 3, 3, 3, 100, 'Chape réalisée selon les normes'),
(4, 'Carrelage sol', 'Pose du carrelage au sol', '2023-12-18', '2023-12-24', 'termine', 4, 7, 7, 100, 'Carrelage posé avec soin'),
(4, 'Carrelage mur', 'Pose du carrelage mural', '2023-12-25', '2023-12-29', 'termine', 5, 5, 5, 100, 'Finitions soignées'),
(4, 'Jointoiement', 'Jointoiement et finitions', '2023-12-30', '2023-12-31', 'termine', 6, 2, 2, 100, 'Jointoiement propre'),
(4, 'Nettoyage et réception', 'Nettoyage final et réception des travaux', '2024-01-01', '2024-01-01', 'termine', 7, 1, 1, 100, 'Client satisfait');

-- Insertion des étapes pour le projet PRJ-2024-001
INSERT INTO project_stages (project_id, name, description, start_date, end_date, status, order_index, estimated_duration, actual_duration, completion_percentage, notes) VALUES
(5, 'Démolition', 'Démolition des anciens revêtements', '2024-01-15', '2024-01-17', 'en_cours', 1, 3, 2, 66, 'Démolition en cours'),
(5, 'Préparation sol', 'Préparation et nivelage du sol', '2024-01-18', '2024-01-19', 'non_commencee', 2, 2, NULL, 0, 'À commencer'),
(5, 'Chape', 'Réalisation de la chape', '2024-01-20', '2024-01-22', 'non_commencee', 3, 3, NULL, 0, 'À commencer'),
(5, 'Carrelage sol', 'Pose du carrelage au sol', '2024-01-23', '2024-01-29', 'non_commencee', 4, 7, NULL, 0, 'À commencer'),
(5, 'Carrelage mur', 'Pose du carrelage mural', '2024-01-30', '2024-02-03', 'non_commencee', 5, 5, NULL, 0, 'À commencer'),
(5, 'Jointoiement', 'Jointoiement et finitions', '2024-02-04', '2024-02-05', 'non_commencee', 6, 2, NULL, 0, 'À commencer'),
(5, 'Nettoyage et réception', 'Nettoyage final et réception des travaux', '2024-02-06', '2024-02-06', 'non_commencee', 7, 1, NULL, 0, 'À commencer');

-- Insertion des affectations du personnel aux projets
INSERT INTO project_staff (project_id, staff_id, stage_id, role_description, start_date, end_date, hours_planned, hours_worked) VALUES
-- Projet PRJ-2023-001
(1, 2, 1, 'Chef de chantier', '2023-10-01', '2023-11-15', 180, 180),
(1, 3, 1, 'Technicien senior', '2023-10-01', '2023-11-15', 160, 160),
(1, 4, 1, 'Technicien', '2023-10-01', '2023-11-15', 160, 160),
(1, 5, 1, 'Apprenti', '2023-10-01', '2023-11-15', 120, 120),

-- Projet PRJ-2023-002
(2, 2, 1, 'Chef de chantier', '2023-11-01', '2023-12-20', 200, 200),
(2, 3, 1, 'Technicien senior', '2023-11-01', '2023-12-20', 180, 180),
(2, 4, 1, 'Technicien', '2023-11-01', '2023-12-20', 180, 180),
(2, 5, 1, 'Apprenti', '2023-11-01', '2023-12-20', 140, 140),
(2, 9, 1, 'Carreleur', '2023-11-01', '2023-12-20', 160, 160),
(2, 10, 1, 'Chapiste', '2023-11-01', '2023-12-20', 120, 120),

-- Projet PRJ-2023-003
(3, 2, 1, 'Chef de chantier', '2023-12-01', '2024-01-15', 180, 180),
(3, 3, 1, 'Technicien senior', '2023-12-01', '2024-01-15', 160, 160),
(3, 4, 1, 'Technicien', '2023-12-01', '2024-01-15', 160, 160),
(3, 5, 1, 'Apprenti', '2023-12-01', '2024-01-15', 120, 120),
(3, 9, 1, 'Carreleur', '2023-12-01', '2024-01-15', 140, 140),
(3, 10, 1, 'Chapiste', '2023-12-01', '2024-01-15', 100, 100),

-- Projet PRJ-2023-004
(4, 6, 1, 'Chef de chantier', '2023-12-10', '2024-01-25', 160, 160),
(4, 3, 1, 'Technicien senior', '2023-12-10', '2024-01-25', 140, 140),
(4, 4, 1, 'Technicien', '2023-12-10', '2024-01-25', 140, 140),
(4, 5, 1, 'Apprenti', '2023-12-10', '2024-01-25', 100, 100),
(4, 9, 1, 'Carreleur', '2023-12-10', '2024-01-25', 120, 120),
(4, 10, 1, 'Chapiste', '2023-12-10', '2024-01-25', 80, 80),

-- Projet PRJ-2024-001
(5, 2, 1, 'Chef de chantier', '2024-01-15', '2024-02-28', 180, 60),
(5, 3, 1, 'Technicien senior', '2024-01-15', '2024-02-28', 160, 50),
(5, 4, 1, 'Technicien', '2024-01-15', '2024-02-28', 160, 50),
(5, 5, 1, 'Apprenti', '2024-01-15', '2024-02-28', 120, 40),
(5, 9, 1, 'Carreleur', '2024-01-15', '2024-02-28', 140, 45),
(5, 10, 1, 'Chapiste', '2024-01-15', '2024-02-28', 100, 30);

-- Insertion des documents pour les autres projets
INSERT INTO documents (project_id, client_id, type, reference, status, amount, tva_rate, issue_date, due_date, payment_date, payment_method, notes) VALUES
-- Projet PRJ-2023-002
(2, 4, 'devis', 'DEV-2023-002', 'valide', 75000.00, 20.00, '2023-10-15', '2023-10-30', '2023-10-25', 'virement', 'Devis accepté rapidement'),
(2, 4, 'facture', 'FAC-2023-003', 'valide', 37500.00, 20.00, '2023-11-15', '2023-11-30', '2023-11-28', 'virement', 'Premier acompte payé'),
(2, 4, 'facture', 'FAC-2023-004', 'valide', 37500.00, 20.00, '2023-12-15', '2023-12-30', '2023-12-25', 'virement', 'Solde payé'),

-- Projet PRJ-2023-003
(3, 4, 'devis', 'DEV-2023-003', 'valide', 85000.00, 20.00, '2023-11-15', '2023-11-30', '2023-11-25', 'virement', 'Devis accepté rapidement'),
(3, 4, 'facture', 'FAC-2023-005', 'valide', 42500.00, 20.00, '2023-12-15', '2023-12-30', '2023-12-28', 'virement', 'Premier acompte payé'),
(3, 4, 'facture', 'FAC-2023-006', 'valide', 42500.00, 20.00, '2024-01-15', '2024-01-30', '2024-01-25', 'virement', 'Solde payé'),

-- Projet PRJ-2023-004
(4, 6, 'devis', 'DEV-2023-004', 'valide', 32000.00, 20.00, '2023-11-15', '2023-11-30', '2023-11-25', 'virement', 'Devis accepté rapidement'),
(4, 6, 'facture', 'FAC-2023-007', 'valide', 16000.00, 20.00, '2023-12-15', '2023-12-30', '2023-12-28', 'virement', 'Premier acompte payé'),
(4, 6, 'facture', 'FAC-2023-008', 'valide', 16000.00, 20.00, '2024-01-15', '2024-01-30', '2024-01-25', 'virement', 'Solde payé'),

-- Projet PRJ-2024-001
(5, 8, 'devis', 'DEV-2024-001', 'valide', 15000.00, 20.00, '2023-12-15', '2023-12-30', '2023-12-25', 'virement', 'Devis accepté rapidement'),
(5, 8, 'facture', 'FAC-2024-001', 'valide', 7500.00, 20.00, '2024-01-15', '2024-01-30', '2024-01-28', 'virement', 'Premier acompte payé'),
(5, 8, 'facture', 'FAC-2024-002', 'valide', 7500.00, 20.00, '2024-02-15', '2024-02-28', NULL, NULL, 'En attente de paiement');

COMMIT; 