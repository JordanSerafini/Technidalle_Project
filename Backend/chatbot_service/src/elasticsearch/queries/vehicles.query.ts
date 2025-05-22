import { PrismaService } from '../../prisma/prisma.service';

interface VehicleStatistics {
  name: string;
  registration_number: string;
  type: string;
  fuel_type: string;
  total_quantity: number;
  total_cost: number;
  total_distance: number;
  average_consumption: number | null;
  cost_per_km: number | null;
}

// Interfaces pour les nouvelles fonctionnalités
interface VehicleEfficiency {
  name: string;
  type: string;
  brand: string;
  model: string;
  fuel_type: string;
  consumption: number;
  cost_per_km: number;
  distance_analyzed: number;
}

interface IncidentByType {
  [key: string]: number;
}

export const getVehiclesQueries = (prismaService: PrismaService) => ({
  vehicles_list: {
    keywords: [
      'véhicule',
      'voiture',
      'camion',
      'utilitaire',
      'flotte',
      'parc',
      'automobile',
      'transport',
    ],
    questions: [
      'Liste des véhicules',
      'Tous les véhicules',
      'Flotte de véhicules',
      'Véhicules disponibles',
      'Parc automobile',
      'Quels véhicules avons-nous ?',
      'Inventaire des véhicules',
      'Nos véhicules',
      'Parc de véhicules',
      'Liste de la flotte',
    ],
    prisma: async () => {
      return await prismaService.vehicles.findMany({
        select: {
          name: true,
          type: true,
          brand: true,
          model: true,
          registration_number: true,
          year_of_manufacture: true,
          status: true,
          mileage: true,
          fuel_type: true,
        },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste complète des véhicules de la flotte',
  },

  vehicle_details: {
    keywords: [
      'véhicule',
      'détail',
      'fiche',
      'information',
      'spécification',
      'caractéristique',
      'technique',
      'immatriculation',
    ],
    questions: [
      'Détails du véhicule [VEHICLE]',
      'Information sur [VEHICLE]',
      'Fiche véhicule [VEHICLE]',
      'Caractéristiques de [VEHICLE]',
      'Spécifications [VEHICLE]',
      'Données [VEHICLE]',
      'Détails [VEHICLE]',
      'Fiche technique [VEHICLE]',
      'Info [VEHICLE]',
      'Détails sur [VEHICLE]',
    ],
    prisma: async (vehicle: string) => {
      return await prismaService.vehicles.findFirst({
        where: {
          OR: [
            { name: { contains: vehicle, mode: 'insensitive' } },
            { registration_number: { contains: vehicle, mode: 'insensitive' } },
          ],
        },
        select: {
          name: true,
          type: true,
          brand: true,
          model: true,
          registration_number: true,
          year_of_manufacture: true,
          purchase_date: true,
          purchase_price: true,
          status: true,
          mileage: true,
          fuel_type: true,
          fuel_capacity: true,
          average_consumption: true,
          next_technical_control: true,
          insurance_number: true,
          insurance_expiry_date: true,
          notes: true,
          vehicle_maintenance: {
            select: {
              maintenance_type: true,
              maintenance_date: true,
              mileage_at_maintenance: true,
              next_maintenance_date: true,
              next_maintenance_mileage: true,
            },
            orderBy: {
              maintenance_date: 'desc',
            },
            take: 5,
          },
          vehicle_incidents: {
            select: {
              incident_date: true,
              incident_type: true,
              description: true,
              severity: true,
              resolution_status: true,
            },
            orderBy: {
              incident_date: 'desc',
            },
            take: 5,
          },
          vehicle_refueling: {
            select: {
              refuel_date: true,
              mileage: true,
              quantity: true,
              price_per_liter: true,
              total_cost: true,
            },
            orderBy: {
              refuel_date: 'desc',
            },
            take: 5,
          },
        },
      });
    },
    response_format: 'object',
    description: 'Informations détaillées sur un véhicule spécifique',
    parameters: [
      {
        name: 'VEHICLE',
        description: "Nom ou numéro d'immatriculation du véhicule",
      },
    ],
  },

  available_vehicles: {
    keywords: [
      'disponible',
      'libre',
      'utilisable',
      'prêt',
      'non réservé',
      'véhicule',
      'flotte',
      'parc',
    ],
    questions: [
      'Véhicules disponibles',
      'Quels véhicules sont libres ?',
      'Véhicules non réservés',
      'Disponibilité des véhicules',
      'Véhicules libres',
      'Quels véhicules peut-on utiliser ?',
      'Véhicules non utilisés',
      'Disponibilité de la flotte',
      "Véhicules prêts à l'emploi",
      'Flotte disponible',
    ],
    prisma: async () => {
      return await prismaService.vehicles.findMany({
        where: {
          status: 'disponible',
        },
        select: {
          name: true,
          type: true,
          brand: true,
          model: true,
          registration_number: true,
          fuel_type: true,
          mileage: true,
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste des véhicules actuellement disponibles pour utilisation',
  },

  vehicles_maintenance_due: {
    keywords: [
      'entretien',
      'maintenance',
      'révision',
      'contrôle',
      'inspection',
      'réparation',
      'technique',
      'vérification',
    ],
    questions: [
      'Véhicules nécessitant un entretien',
      'Entretiens à prévoir',
      'Maintenance véhicules à planifier',
      'Véhicules à réviser',
      'Prochaines maintenances',
      'Révisions à prévoir',
      'Entretiens de véhicules à venir',
      'Maintenance programmée',
      "Véhicules ayant besoin d'entretien",
      'Planning des révisions',
    ],
    prisma: async () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      return await prismaService.vehicles.findMany({
        where: {
          OR: [
            { next_technical_control: { lte: nextMonth } },
            {
              vehicle_maintenance: {
                some: {
                  next_maintenance_date: { lte: nextMonth },
                },
              },
            },
          ],
        },
        select: {
          name: true,
          registration_number: true,
          next_technical_control: true,
          mileage: true,
          vehicle_maintenance: {
            select: {
              maintenance_type: true,
              maintenance_date: true,
              next_maintenance_date: true,
              next_maintenance_mileage: true,
            },
            orderBy: {
              next_maintenance_date: 'asc',
            },
            take: 1,
          },
        },
        orderBy: [{ next_technical_control: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste des véhicules nécessitant un entretien dans le mois à venir',
  },

  vehicle_reservations: {
    keywords: [
      'réservation',
      'planning',
      'calendrier',
      'utilisation',
      'occupation',
      'attribution',
      'emploi',
      'programme',
    ],
    questions: [
      'Réservations de véhicules',
      'Planning des véhicules',
      'Qui utilise quel véhicule ?',
      "Calendrier d'utilisation des véhicules",
      'Réservations à venir',
      "Programme d'utilisation de la flotte",
      'Véhicules réservés',
      'Planning de la flotte',
      'Utilisation des véhicules',
      'Calendrier des réservations',
    ],
    prisma: async () => {
      const now = new Date();

      return await prismaService.vehicle_reservations.findMany({
        where: {
          start_date: {
            gte: now,
          },
        },
        select: {
          start_date: true,
          end_date: true,
          purpose: true,
          status: true,
          vehicles: {
            select: {
              name: true,
              registration_number: true,
              type: true,
            },
          },
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
        },
        orderBy: {
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des réservations de véhicules à venir',
  },

  vehicle_by_staff: {
    keywords: [
      'véhicule',
      'réservation',
      'utilisateur',
      'personnel',
      'employé',
      'attribution',
      'conducteur',
      'chauffeur',
    ],
    questions: [
      'Véhicules utilisés par [STAFF]',
      'Quels véhicules utilise [STAFF] ?',
      'Réservations véhicules de [STAFF]',
      'Planning véhicule pour [STAFF]',
      'Utilisation de la flotte par [STAFF]',
      'Véhicules réservés par [STAFF]',
      'Historique véhicules [STAFF]',
      'Véhicules attribués à [STAFF]',
      'Programme véhicules [STAFF]',
      'Calendrier véhicules [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prismaService.vehicle_reservations.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          start_date: true,
          end_date: true,
          purpose: true,
          status: true,
          vehicles: {
            select: {
              name: true,
              registration_number: true,
              type: true,
              brand: true,
              model: true,
            },
          },
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
        },
        orderBy: {
          start_date: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description:
      'Liste des véhicules utilisés par un membre du personnel spécifique',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  fuel_consumption_statistics: {
    keywords: [
      'carburant',
      'consommation',
      'essence',
      'diesel',
      'coût',
      'économie',
      'rendement',
      'efficacité',
    ],
    questions: [
      'Statistiques de consommation de carburant',
      'Consommation moyenne de la flotte',
      'Analyse de la consommation carburant',
      'Performance carburant',
      'Coût carburant par véhicule',
      'Consommation par véhicule',
      'Rendement carburant',
      'Statistiques essence/diesel',
      'Efficacité énergétique flotte',
      'Économie de carburant',
    ],
    prisma: async () => {
      // Récupérer les trois derniers mois de données de ravitaillement
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const refuelingData = await prismaService.vehicle_refueling.findMany({
        where: {
          refuel_date: {
            gte: threeMonthsAgo,
          },
        },
        select: {
          vehicles: {
            select: {
              id: true,
              name: true,
              registration_number: true,
              type: true,
              fuel_type: true,
            },
          },
          refuel_date: true,
          mileage: true,
          quantity: true,
          price_per_liter: true,
          total_cost: true,
        },
        orderBy: {
          refuel_date: 'desc',
        },
      });

      // Organiser les données par véhicule
      const vehiclesMap = new Map();

      refuelingData.forEach((refuel) => {
        const vehicleId = refuel.vehicles.id;

        if (!vehiclesMap.has(vehicleId)) {
          vehiclesMap.set(vehicleId, {
            name: refuel.vehicles.name,
            registration_number: refuel.vehicles.registration_number,
            type: refuel.vehicles.type,
            fuel_type: refuel.vehicles.fuel_type,
            refuelings: [],
            total_quantity: 0,
            total_cost: 0,
            total_distance: 0,
          });
        }

        const vehicleData = vehiclesMap.get(vehicleId);
        vehicleData.refuelings.push(refuel);
        vehicleData.total_quantity += Number(refuel.quantity);
        vehicleData.total_cost += Number(refuel.total_cost);

        // Trier les refuelings par kilométrage pour calculer la distance
        vehicleData.refuelings.sort((a, b) => a.mileage - b.mileage);
      });

      // Calculer les statistiques
      const statistics: VehicleStatistics[] = [];

      vehiclesMap.forEach((vehicle) => {
        if (vehicle.refuelings.length > 1) {
          const firstMileage = vehicle.refuelings[0].mileage;
          const lastMileage =
            vehicle.refuelings[vehicle.refuelings.length - 1].mileage;
          vehicle.total_distance = lastMileage - firstMileage;

          statistics.push({
            name: vehicle.name,
            registration_number: vehicle.registration_number,
            type: vehicle.type,
            fuel_type: vehicle.fuel_type,
            total_quantity: Math.round(vehicle.total_quantity * 100) / 100, // Arrondi à 2 décimales
            total_cost: Math.round(vehicle.total_cost * 100) / 100, // Arrondi à 2 décimales
            total_distance: vehicle.total_distance,
            average_consumption:
              vehicle.total_distance > 0
                ? Math.round(
                    (vehicle.total_quantity / vehicle.total_distance) *
                      100 *
                      100,
                  ) / 100 // L/100km
                : null,
            cost_per_km:
              vehicle.total_distance > 0
                ? Math.round(
                    (vehicle.total_cost / vehicle.total_distance) * 1000,
                  ) / 1000 // Coût par km
                : null,
          });
        }
      });

      return statistics.sort(
        (a, b) => (b.average_consumption || 0) - (a.average_consumption || 0),
      );
    },
    response_format: 'table',
    description:
      'Analyse statistique de la consommation de carburant de la flotte sur les 3 derniers mois',
  },

  vehicle_incidents_report: {
    keywords: [
      'incident',
      'accident',
      'panne',
      'sinistre',
      'dommage',
      'problème',
      'réparation',
      'défaillance',
    ],
    questions: [
      'Rapport des incidents véhicules',
      'Incidents sur la flotte',
      'Problèmes de véhicules',
      'Historique des incidents',
      'Pannes récentes',
      'Accidents véhicules',
      'Véhicules endommagés',
      'Problèmes techniques véhicules',
      'État des réparations véhicules',
      'Suivi des incidents',
    ],
    prisma: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      return await prismaService.vehicle_incidents.findMany({
        where: {
          incident_date: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          incident_date: true,
          incident_type: true,
          location: true,
          description: true,
          severity: true,
          mileage: true,
          cost_of_repairs: true,
          reported_to_insurance: true,
          resolution_status: true,
          resolution_date: true,
          vehicles: {
            select: {
              name: true,
              registration_number: true,
              type: true,
            },
          },
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
        orderBy: {
          incident_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Rapport des incidents de véhicules des 6 derniers mois',
  },

  technical_control_due: {
    keywords: [
      'contrôle technique',
      'CT',
      'vérification',
      'inspection',
      'obligatoire',
      'réglementaire',
    ],
    questions: [
      'Véhicules avec contrôle technique à prévoir',
      'Quels véhicules doivent passer le contrôle technique ?',
      'Prochains contrôles techniques',
      'CT à prévoir',
      'Contrôles techniques en retard',
    ],
    prisma: async () => {
      const twoMonthsAhead = new Date();
      twoMonthsAhead.setMonth(twoMonthsAhead.getMonth() + 2);
      
      return await prismaService.vehicles.findMany({
        where: {
          next_technical_control: {
            lte: twoMonthsAhead,
          },
        },
        select: {
          name: true,
          registration_number: true,
          brand: true,
          model: true,
          next_technical_control: true,
          mileage: true,
        },
        orderBy: {
          next_technical_control: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des véhicules dont le contrôle technique arrive à échéance dans les 2 mois',
  },

  maintenance_history: {
    keywords: [
      'historique',
      'entretien',
      'maintenance',
      'réparation',
      'révision',
      'service',
    ],
    questions: [
      'Historique d\'entretien du véhicule [VEHICLE]',
      'Maintenances passées pour [VEHICLE]',
      'Réparations effectuées sur [VEHICLE]',
      'Carnet d\'entretien [VEHICLE]',
      'Quels entretiens ont été réalisés sur [VEHICLE] ?',
    ],
    prisma: async (vehicle: string) => {
      return await prismaService.vehicle_maintenance.findMany({
        where: {
          vehicles: {
            OR: [
              { name: { contains: vehicle, mode: 'insensitive' } },
              { registration_number: { contains: vehicle, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          maintenance_date: true,
          maintenance_type: true,
          description: true,
          mileage_at_maintenance: true,
          cost: true,
          performed_by: true,
        },
        orderBy: {
          maintenance_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Historique complet des entretiens et réparations d\'un véhicule spécifique',
    parameters: [
      {
        name: 'VEHICLE',
        description: 'Nom ou numéro d\'immatriculation du véhicule',
      },
    ],
  },

  maintenance_cost_by_vehicle: {
    keywords: [
      'coût',
      'dépense',
      'entretien',
      'budget',
      'réparation',
      'investissement',
    ],
    questions: [
      'Coûts d\'entretien par véhicule',
      'Quel est le véhicule le plus cher à entretenir ?',
      'Dépenses d\'entretien de la flotte',
      'Comparaison des coûts d\'entretien',
      'Budget maintenance par véhicule',
    ],
    prisma: async () => {
      const maintenanceData = await prismaService.vehicle_maintenance.findMany({
        select: {
          vehicles: {
            select: {
              id: true,
              name: true,
              registration_number: true,
              type: true,
            },
          },
          cost: true,
          maintenance_date: true,
        },
      });

      const vehicleCosts = new Map();
      
      maintenanceData.forEach((maintenance) => {
        const vehicleId = maintenance.vehicles.id;
        const cost = Number(maintenance.cost);
        
        if (!vehicleCosts.has(vehicleId)) {
          vehicleCosts.set(vehicleId, {
            name: maintenance.vehicles.name,
            registration_number: maintenance.vehicles.registration_number,
            type: maintenance.vehicles.type,
            total_cost: 0,
            maintenance_count: 0,
            last_maintenance: null,
          });
        }
        
        const vehicleData = vehicleCosts.get(vehicleId);
        vehicleData.total_cost += cost;
        vehicleData.maintenance_count += 1;
        
        // Update last maintenance date if needed
        if (!vehicleData.last_maintenance || 
            new Date(maintenance.maintenance_date) > new Date(vehicleData.last_maintenance)) {
          vehicleData.last_maintenance = maintenance.maintenance_date;
        }
      });
      
      return Array.from(vehicleCosts.values())
        .map(v => ({
          name: v.name,
          registration_number: v.registration_number,
          type: v.type,
          total_cost: Math.round(v.total_cost * 100) / 100,
          maintenance_count: v.maintenance_count,
          average_cost: Math.round((v.total_cost / v.maintenance_count) * 100) / 100,
          last_maintenance: v.last_maintenance,
        }))
        .sort((a, b) => b.total_cost - a.total_cost);
    },
    response_format: 'table',
    description: 'Analyse des coûts d\'entretien cumulés par véhicule',
  },

  most_used_vehicles: {
    keywords: [
      'utilisation',
      'populaire',
      'fréquent',
      'réservation',
      'demande',
      'usage',
    ],
    questions: [
      'Véhicules les plus utilisés',
      'Quels sont les véhicules les plus réservés ?',
      'Véhicules à forte demande',
      'Utilisation des véhicules par fréquence',
      'Top des réservations de véhicules',
    ],
    prisma: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const reservations = await prismaService.vehicle_reservations.findMany({
        where: {
          start_date: {
            gte: sixMonthsAgo,
          },
        },
        select: {
          vehicle_id: true,
          vehicles: {
            select: {
              name: true,
              registration_number: true,
              type: true,
            },
          },
          start_date: true,
          end_date: true,
        },
      });
      
      const usageByVehicle = new Map();
      
      reservations.forEach((reservation) => {
        const vehicleId = reservation.vehicle_id;
        
        if (!usageByVehicle.has(vehicleId)) {
          usageByVehicle.set(vehicleId, {
            name: reservation.vehicles.name,
            registration_number: reservation.vehicles.registration_number,
            type: reservation.vehicles.type,
            reservation_count: 0,
            total_hours: 0,
          });
        }
        
        const vehicleData = usageByVehicle.get(vehicleId);
        vehicleData.reservation_count += 1;
        
        // Calculate duration in hours
        if (reservation.end_date && reservation.start_date) {
          const durationHours = (new Date(reservation.end_date).getTime() - 
                                 new Date(reservation.start_date).getTime()) / 
                                (1000 * 60 * 60);
          vehicleData.total_hours += durationHours;
        }
      });
      
      return Array.from(usageByVehicle.values())
        .map(v => ({
          name: v.name,
          registration_number: v.registration_number,
          type: v.type,
          reservation_count: v.reservation_count,
          total_hours: Math.round(v.total_hours * 10) / 10,
          average_duration: v.reservation_count > 0 ? 
            Math.round((v.total_hours / v.reservation_count) * 10) / 10 : 0,
        }))
        .sort((a, b) => b.reservation_count - a.reservation_count);
    },
    response_format: 'table',
    description: 'Classement des véhicules les plus utilisés au cours des 6 derniers mois',
  },

  expiring_insurance: {
    keywords: [
      'assurance',
      'expiration',
      'échéance',
      'renouvellement',
      'couverture',
      'police',
    ],
    questions: [
      'Véhicules avec assurance à renouveler',
      'Assurances à échéance',
      'Quand expiren les assurances véhicules ?',
      'Renouvellement d\'assurance à prévoir',
      'Véhicules sans couverture bientôt',
    ],
    prisma: async () => {
      const threeMonthsAhead = new Date();
      threeMonthsAhead.setMonth(threeMonthsAhead.getMonth() + 3);
      
      return await prismaService.vehicles.findMany({
        where: {
          insurance_expiry_date: {
            lte: threeMonthsAhead,
            gte: new Date(),
          },
        },
        select: {
          name: true,
          registration_number: true,
          insurance_number: true,
          insurance_expiry_date: true,
        },
        orderBy: {
          insurance_expiry_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des véhicules dont l\'assurance expire dans les 3 mois à venir',
  },

  highest_mileage_vehicles: {
    keywords: [
      'kilométrage',
      'compteur',
      'distance',
      'usure',
      'utilisation',
      'ancien',
    ],
    questions: [
      'Véhicules avec le plus de kilomètres',
      'Kilométrage élevé',
      'Quel véhicule a le plus roulé ?',
      'Classement kilométrage flotte',
      'Véhicules les plus utilisés en distance',
    ],
    prisma: async () => {
      return await prismaService.vehicles.findMany({
        select: {
          name: true,
          registration_number: true,
          brand: true,
          model: true,
          type: true,
          year_of_manufacture: true,
          mileage: true,
        },
        orderBy: {
          mileage: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Top 10 des véhicules ayant le kilométrage le plus élevé',
  },

  project_vehicle_usage: {
    keywords: [
      'projet',
      'chantier',
      'véhicule',
      'allocation',
      'attribution',
      'utilisation',
    ],
    questions: [
      'Véhicules utilisés pour le projet [PROJECT]',
      'Quel véhicule pour le chantier [PROJECT] ?',
      'Réservations véhicules projet [PROJECT]',
      'Transport pour [PROJECT]',
      'Véhicules attribués à [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prismaService.vehicle_reservations.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { reference: { contains: project, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          vehicles: {
            select: {
              name: true,
              registration_number: true,
              type: true,
            },
          },
          start_date: true,
          end_date: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          purpose: true,
        },
        orderBy: {
          start_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des véhicules utilisés pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  vehicle_incident_statistics: {
    keywords: [
      'incident',
      'statistique',
      'accident',
      'dommage',
      'analyse',
      'type',
    ],
    questions: [
      'Statistiques d\'incidents par type de véhicule',
      'Quels véhicules ont le plus d\'accidents ?',
      'Analyse des incidents véhicules',
      'Fréquence des incidents par véhicule',
      'Véhicules à problèmes fréquents',
    ],
    prisma: async () => {
      const incidents = await prismaService.vehicle_incidents.findMany({
        select: {
          vehicles: {
            select: {
              id: true,
              name: true,
              registration_number: true,
              type: true,
            },
          },
          incident_type: true,
          severity: true,
          cost_of_repairs: true,
        },
      });
      
      // Analyse par type de véhicule
      const statsByType = new Map();
      
      incidents.forEach((incident) => {
        const vehicleType = incident.vehicles.type;
        
        if (!statsByType.has(vehicleType)) {
          statsByType.set(vehicleType, {
            type: vehicleType,
            incident_count: 0,
            total_cost: 0,
            by_severity: {
              faible: 0,
              moyen: 0,
              grave: 0,
            },
            by_type: {} as IncidentByType,
          });
        }
        
        const typeStats = statsByType.get(vehicleType);
        typeStats.incident_count += 1;
        
        // Add cost if available
        if (incident.cost_of_repairs) {
          typeStats.total_cost += Number(incident.cost_of_repairs);
        }
        
        // Count by severity
        if (incident.severity) {
          const severity = incident.severity.toLowerCase();
          if (severity === 'faible' || severity === 'moyen' || severity === 'grave') {
            typeStats.by_severity[severity] += 1;
          }
        }
        
        // Count by incident type
        const incidentType = incident.incident_type;
        if (!typeStats.by_type[incidentType]) {
          typeStats.by_type[incidentType] = 0;
        }
        typeStats.by_type[incidentType] += 1;
      });
      
      return Array.from(statsByType.values())
        .map(stats => ({
          type: stats.type,
          incident_count: stats.incident_count,
          total_cost: Math.round(stats.total_cost * 100) / 100,
          average_cost: stats.incident_count > 0 ? 
            Math.round((stats.total_cost / stats.incident_count) * 100) / 100 : 0,
          severity_distribution: `Faible: ${stats.by_severity.faible}, Moyen: ${stats.by_severity.moyen}, Grave: ${stats.by_severity.grave}`,
          most_common_issue: Object.entries(stats.by_type as IncidentByType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => `${type}: ${count}`)
            .slice(0, 2)
            .join(', '),
        }))
        .sort((a, b) => b.incident_count - a.incident_count);
    },
    response_format: 'table',
    description: 'Analyse statistique des incidents par type de véhicule',
  },

  refueling_history: {
    keywords: [
      'carburant',
      'ravitaillement',
      'plein',
      'essence',
      'diesel',
      'historique',
    ],
    questions: [
      'Historique des pleins pour [VEHICLE]',
      'Ravitaillements du véhicule [VEHICLE]',
      'Carburant consommé par [VEHICLE]',
      'Quand le dernier plein pour [VEHICLE] ?',
      'Dépenses carburant [VEHICLE]',
    ],
    prisma: async (vehicle: string) => {
      return await prismaService.vehicle_refueling.findMany({
        where: {
          vehicles: {
            OR: [
              { name: { contains: vehicle, mode: 'insensitive' } },
              { registration_number: { contains: vehicle, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          refuel_date: true,
          mileage: true,
          quantity: true,
          price_per_liter: true,
          total_cost: true,
          fuel_type: true,
          station: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
        orderBy: {
          refuel_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Historique complet des ravitaillements d\'un véhicule spécifique',
    parameters: [
      {
        name: 'VEHICLE',
        description: 'Nom ou numéro d\'immatriculation du véhicule',
      },
    ],
  },

  vehicle_efficiency_comparison: {
    keywords: [
      'comparaison',
      'efficacité',
      'consommation',
      'carburant',
      'économie',
      'performance',
    ],
    questions: [
      'Comparer l\'efficacité des véhicules',
      'Quel type de véhicule est le plus économique ?',
      'Véhicules les plus économes en carburant',
      'Comparaison de consommation par type',
      'Performance énergétique de la flotte',
    ],
    prisma: async () => {
      // Récupérer les données de ravitaillement avec kilométrage
      const refuelingData = await prismaService.vehicle_refueling.findMany({
        select: {
          vehicles: {
            select: {
              id: true,
              name: true,
              type: true,
              brand: true,
              model: true,
              fuel_type: true,
            },
          },
          mileage: true,
          quantity: true,
          total_cost: true,
        },
        orderBy: {
          mileage: 'asc',
        },
      });
      
      // Organiser par véhicule
      const vehiclesMap = new Map();
      
      refuelingData.forEach((refuel) => {
        const vehicleId = refuel.vehicles.id;
        
        if (!vehiclesMap.has(vehicleId)) {
          vehiclesMap.set(vehicleId, {
            id: vehicleId,
            name: refuel.vehicles.name,
            type: refuel.vehicles.type,
            brand: refuel.vehicles.brand,
            model: refuel.vehicles.model,
            fuel_type: refuel.vehicles.fuel_type,
            refuelings: [],
          });
        }
        
        const vehicleData = vehiclesMap.get(vehicleId);
        vehicleData.refuelings.push({
          mileage: refuel.mileage,
          quantity: Number(refuel.quantity),
          cost: Number(refuel.total_cost),
        });
      });
      
      // Calculer les efficacités par véhicule
      const efficiency: VehicleEfficiency[] = [];
      
      vehiclesMap.forEach((vehicle) => {
        if (vehicle.refuelings.length > 1) {
          // Trier par kilométrage
          vehicle.refuelings.sort((a, b) => a.mileage - b.mileage);
          
          const firstMileage = vehicle.refuelings[0].mileage;
          const lastMileage = vehicle.refuelings[vehicle.refuelings.length - 1].mileage;
          const distance = lastMileage - firstMileage;
          
          if (distance > 0) {
            const totalQuantity = vehicle.refuelings
              .slice(1) // Skip first entry as we don't know previous usage
              .reduce((sum, r) => sum + r.quantity, 0);
              
            const totalCost = vehicle.refuelings
              .slice(1)
              .reduce((sum, r) => sum + r.cost, 0);
              
            const consumption = (totalQuantity / distance) * 100; // L/100km
            const costPerKm = totalCost / distance;
            
            efficiency.push({
              name: vehicle.name,
              type: vehicle.type,
              brand: vehicle.brand,
              model: vehicle.model,
              fuel_type: vehicle.fuel_type,
              consumption: Math.round(consumption * 100) / 100,
              cost_per_km: Math.round(costPerKm * 1000) / 1000,
              distance_analyzed: distance,
            });
          }
        }
      });
      
      // Trier par efficacité (consommation)
      return efficiency.sort((a, b) => a.consumption - b.consumption);
    },
    response_format: 'table',
    description: 'Comparaison de l\'efficacité énergétique et économique des véhicules',
  }
});
