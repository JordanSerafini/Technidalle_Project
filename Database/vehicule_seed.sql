BEGIN;

-- Insertion des véhicules
INSERT INTO vehicles (id, name, type, brand, model, registration_number, year_of_manufacture, purchase_date, purchase_price, status, mileage, fuel_type, fuel_capacity, average_consumption, next_technical_control, insurance_number, insurance_expiry_date, notes) VALUES
(1, 'Utilitaire 1', 'utilitaire', 'Renault', 'Kangoo', 'AA-123-BB', 2021, '2021-05-15', 22000.00, 'disponible', 35000, 'diesel', 60.0, 6.2, '2023-05-15', 'ASS-12345-2023', '2023-12-31', 'Véhicule en bon état'),
(2, 'Utilitaire 2', 'utilitaire', 'Citroën', 'Berlingo', 'CC-456-DD', 2020, '2020-06-20', 20000.00, 'en_mission', 45000, 'diesel', 55.0, 6.5, '2022-06-20', 'ASS-23456-2023', '2023-12-31', 'Véhicule en bon état'),
(3, 'Camion 1', 'camion', 'Mercedes', 'Sprinter', 'EE-789-FF', 2019, '2019-08-10', 35000.00, 'disponible', 55000, 'diesel', 80.0, 9.8, '2023-08-10', 'ASS-34567-2023', '2023-12-31', 'Nécessite une révision prochainement'),
(4, 'Camion 2', 'camion', 'Iveco', 'Daily', 'GG-012-HH', 2018, '2018-10-05', 32000.00, 'en_entretien', 72000, 'diesel', 70.0, 10.2, '2022-10-05', 'ASS-45678-2023', '2023-12-31', 'En réparation - embrayage'),
(5, 'Engin 1', 'engin_chantier', 'Caterpillar', 'Mini Pelle', 'II-345-JJ', 2019, '2019-03-15', 45000.00, 'disponible', 2500, 'diesel', 40.0, 12.0, '2023-03-15', 'ASS-56789-2023', '2023-12-31', 'Petit accrochage sur le côté droit'),
(6, 'Voiture Direction', 'voiture', 'Peugeot', '508', 'KK-678-LL', 2022, '2022-01-10', 38000.00, 'reserve', 15000, 'essence', 65.0, 7.2, '2024-01-10', 'ASS-67890-2023', '2023-12-31', 'Réservé à la direction'),
(7, 'Remorque 1', 'remorque', 'Lider', 'Robust', 'MM-901-NN', 2020, '2020-04-22', 4500.00, 'disponible', 0, NULL, NULL, NULL, '2022-04-22', 'ASS-78901-2023', '2023-12-31', 'Remorque 750kg'),
(8, 'Utilitaire 3', 'utilitaire', 'Ford', 'Transit', 'OO-234-PP', 2021, '2021-09-18', 24000.00, 'disponible', 28000, 'diesel', 70.0, 7.8, '2023-09-18', 'ASS-89012-2023', '2023-12-31', 'Nouvelle révision à planifier'),
(9, 'Voiture Service', 'voiture', 'Renault', 'Clio', 'QQ-567-RR', 2022, '2022-03-05', 18000.00, 'en_mission', 22000, 'essence', 45.0, 5.8, '2024-03-05', 'ASS-90123-2023', '2023-12-31', 'Voiture de service'),
(10, 'Engin 2', 'engin_chantier', 'Bobcat', 'S70', 'SS-890-TT', 2020, '2020-11-12', 28000.00, 'disponible', 1200, 'diesel', 35.0, 9.5, '2022-11-12', 'ASS-01234-2023', '2023-12-31', 'Mini chargeuse compacte')
ON CONFLICT (id) DO NOTHING;

-- Insertion des entretiens de véhicules
INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type, maintenance_date, mileage_at_maintenance, description, cost, performed_by, next_maintenance_date, next_maintenance_mileage, invoice_reference, notes) VALUES
(1, 'Révision', '2022-05-15', 15000, 'Révision des 15 000 km', 350.00, 'Garage Renault Lyon', '2023-05-15', 30000, 'FACT-R-2022-001', 'Révision standard effectuée'),
(1, 'Changement pneus', '2022-11-20', 25000, 'Changement des 4 pneus', 480.00, 'Euromaster', NULL, NULL, 'FACT-E-2022-001', 'Pneus hiver Michelin'),
(2, 'Révision', '2021-06-20', 15000, 'Révision des 15 000 km', 320.00, 'Garage Citroën Lyon', '2022-06-20', 30000, 'FACT-C-2021-001', 'Révision standard effectuée'),
(2, 'Freins', '2022-01-15', 28000, 'Changement plaquettes avant', 220.00, 'Garage Citroën Lyon', NULL, 60000, 'FACT-C-2022-001', 'Changement plaquettes uniquement'),
(3, 'Révision', '2020-08-10', 20000, 'Révision des 20 000 km', 450.00, 'Garage Mercedes Lyon', '2021-08-10', 40000, 'FACT-M-2020-001', 'Révision complète effectuée'),
(3, 'Vidange', '2022-02-05', 42000, 'Vidange moteur + filtres', 280.00, 'Garage Mercedes Lyon', '2023-02-05', 62000, 'FACT-M-2022-001', 'Vidange huile longue durée'),
(4, 'Embrayage', '2023-01-10', 70000, 'Changement embrayage complet', 1200.00, 'Garage Iveco Lyon', NULL, NULL, 'FACT-I-2023-001', 'Remplacement embrayage complet + volant moteur'),
(5, 'Révision', '2021-03-15', 1200, 'Révision annuelle', 580.00, 'Caterpillar Service', '2022-03-15', 2000, 'FACT-CAT-2021-001', 'Révision complète effectuée'),
(6, 'Révision', '2022-12-10', 12000, 'Révision des 12 000 km', 380.00, 'Garage Peugeot Lyon', '2023-12-10', 24000, 'FACT-P-2022-001', 'Révision standard effectuée'),
(8, 'Révision', '2022-09-18', 15000, 'Révision des 15 000 km', 340.00, 'Garage Ford Lyon', '2023-09-18', 30000, 'FACT-F-2022-001', 'Révision standard effectuée');

-- Insertion des pleins d'essence/carburant
INSERT INTO vehicle_refueling (vehicle_id, refuel_date, mileage, quantity, price_per_liter, total_cost, staff_id, fuel_type, station, full_tank, project_id, notes) VALUES
(1, '2023-01-05', 27500, 55.0, 1.850, 101.75, 2, 'diesel', 'TotalEnergies Lyon', true, NULL, 'Plein complet'),
(1, '2023-01-15', 28700, 48.5, 1.820, 88.27, 3, 'diesel', 'Carrefour Lyon', true, 2, 'Plein projet Trois Pins'),
(1, '2023-01-25', 29900, 52.0, 1.880, 97.76, 4, 'diesel', 'TotalEnergies Lyon', true, 2, 'Plein projet Trois Pins'),
(2, '2023-01-03', 38200, 50.0, 1.850, 92.50, 3, 'diesel', 'TotalEnergies Lyon', true, NULL, 'Plein complet'),
(2, '2023-01-18', 39500, 45.0, 1.820, 81.90, 4, 'diesel', 'Carrefour Lyon', true, 3, 'Plein projet Belle Vue'),
(2, '2023-01-28', 40700, 48.0, 1.880, 90.24, 5, 'diesel', 'TotalEnergies Lyon', true, 3, 'Plein projet Belle Vue'),
(3, '2023-01-02', 47500, 75.0, 1.850, 138.75, 9, 'diesel', 'TotalEnergies Lyon', true, NULL, 'Plein complet'),
(3, '2023-01-12', 48900, 68.0, 1.820, 123.76, 10, 'diesel', 'Carrefour Lyon', true, 4, 'Plein projet Riviera'),
(3, '2023-01-22', 50200, 72.0, 1.880, 135.36, 9, 'diesel', 'TotalEnergies Lyon', true, 4, 'Plein projet Riviera'),
(6, '2023-01-08', 12500, 60.0, 1.950, 117.00, 1, 'essence', 'TotalEnergies Lyon', true, NULL, 'Plein direction'),
(6, '2023-01-19', 13800, 55.0, 1.920, 105.60, 1, 'essence', 'Carrefour Lyon', true, NULL, 'Plein direction'),
(8, '2023-01-04', 24500, 65.0, 1.850, 120.25, 2, 'diesel', 'TotalEnergies Lyon', true, NULL, 'Plein complet'),
(8, '2023-01-14', 25800, 60.0, 1.820, 109.20, 3, 'diesel', 'Carrefour Lyon', true, 5, 'Plein projet Martin'),
(8, '2023-01-24', 27100, 62.0, 1.880, 116.56, 4, 'diesel', 'TotalEnergies Lyon', true, 5, 'Plein projet Martin'),
(9, '2023-01-07', 19500, 40.0, 1.950, 78.00, 6, 'essence', 'TotalEnergies Lyon', true, NULL, 'Plein complet'),
(9, '2023-01-17', 20700, 38.0, 1.920, 72.96, 6, 'essence', 'Carrefour Lyon', true, NULL, 'Plein service commercial');

-- Insertion des réservations de véhicules
INSERT INTO vehicle_reservations (vehicle_id, staff_id, project_id, start_date, end_date, starting_mileage, ending_mileage, purpose, status, notes) VALUES
(1, 2, 2, '2023-01-15 07:00:00', '2023-01-15 18:00:00', 28700, 28900, 'Transport matériaux chantier Trois Pins', 'terminée', 'Réservation terminée'),
(1, 3, 2, '2023-01-16 07:00:00', '2023-01-16 18:00:00', 28900, 29100, 'Transport équipe chantier Trois Pins', 'terminée', 'Réservation terminée'),
(1, 4, 2, '2023-01-17 07:00:00', '2023-01-17 18:00:00', 29100, 29300, 'Transport matériaux chantier Trois Pins', 'terminée', 'Réservation terminée'),
(2, 3, 3, '2023-01-18 07:00:00', '2023-01-18 18:00:00', 39500, 39700, 'Transport matériaux chantier Belle Vue', 'terminée', 'Réservation terminée'),
(2, 4, 3, '2023-01-19 07:00:00', '2023-01-19 18:00:00', 39700, 39900, 'Transport équipe chantier Belle Vue', 'terminée', 'Réservation terminée'),
(2, 5, 3, '2023-01-20 07:00:00', '2023-01-20 18:00:00', 39900, 40100, 'Transport matériaux chantier Belle Vue', 'terminée', 'Réservation terminée'),
(3, 9, 4, '2023-01-12 07:00:00', '2023-01-12 18:00:00', 48900, 49100, 'Transport matériaux lourds chantier Riviera', 'terminée', 'Réservation terminée'),
(3, 10, 4, '2023-01-13 07:00:00', '2023-01-13 18:00:00', 49100, 49300, 'Transport équipement chantier Riviera', 'terminée', 'Réservation terminée'),
(3, 9, 4, '2023-01-14 07:00:00', '2023-01-14 18:00:00', 49300, 49500, 'Transport matériaux lourds chantier Riviera', 'terminée', 'Réservation terminée'),
(6, 1, NULL, '2023-01-19 08:00:00', '2023-01-19 17:00:00', 13800, 14000, 'Rendez-vous client potentiel', 'terminée', 'Réservation direction'),
(8, 2, 5, '2023-01-14 07:00:00', '2023-01-14 18:00:00', 25800, 26000, 'Transport matériaux chantier Martin', 'terminée', 'Réservation terminée'),
(8, 3, 5, '2023-01-15 07:00:00', '2023-01-15 18:00:00', 26000, 26200, 'Transport équipe chantier Martin', 'terminée', 'Réservation terminée'),
(8, 4, 5, '2023-01-16 07:00:00', '2023-01-16 18:00:00', 26200, 26400, 'Transport matériaux chantier Martin', 'terminée', 'Réservation terminée'),
(9, 6, NULL, '2023-01-17 08:00:00', '2023-01-17 17:00:00', 20700, 20900, 'Prospection commerciale', 'terminée', 'Réservation service commercial'),
(1, 2, 5, '2023-02-01 07:00:00', '2023-02-01 18:00:00', NULL, NULL, 'Transport matériaux chantier Martin', 'planifiée', 'Réservation à venir'),
(2, 3, 5, '2023-02-02 07:00:00', '2023-02-02 18:00:00', NULL, NULL, 'Transport équipe chantier Martin', 'planifiée', 'Réservation à venir'),
(3, 9, 6, '2023-02-10 07:00:00', '2023-02-10 18:00:00', NULL, NULL, 'Transport équipement lourd chantier Les Roses', 'planifiée', 'Réservation à venir');

-- Insertion des incidents véhicules
INSERT INTO vehicle_incidents (vehicle_id, staff_id, incident_date, incident_type, location, description, severity, mileage, cost_of_repairs, reported_to_insurance, resolution_status, resolution_date, notes) VALUES
(4, 3, '2023-01-10 10:30:00', 'Panne', 'Boulevard Périphérique Lyon', 'Panne d''embrayage sur le périphérique', 'sévère', 70000, 1200.00, false, 'résolu', '2023-01-15', 'Réparation effectuée chez le concessionnaire Iveco'),
(2, 4, '2022-12-05 14:15:00', 'Accrochage', 'Parking client Rue Garibaldi', 'Petite éraflure arrière lors d''une manœuvre', 'mineur', 42000, 180.00, false, 'résolu', '2022-12-10', 'Réparation mineure effectuée'),
(5, 10, '2022-11-20 09:45:00', 'Choc', 'Chantier Belle Vue', 'Choc contre un mur lors d''une manœuvre', 'modéré', 2300, 750.00, true, 'résolu', '2022-12-01', 'Réparation effectuée chez le concessionnaire, prise en charge assurance'),
(1, 2, '2022-10-15 17:30:00', 'Crevaison', 'Autoroute A7', 'Crevaison pneu avant droit', 'mineur', 24000, 120.00, false, 'résolu', '2022-10-16', 'Remplacement du pneu sur place'),
(9, 6, '2023-01-05 08:20:00', 'Vitre brisée', 'Parking public Lyon', 'Vitre arrière brisée, potentiellement acte de vandalisme', 'modéré', 19800, 350.00, true, 'résolu', '2023-01-08', 'Remplacement vitre, déclaration assurance effectuée');



COMMIT;