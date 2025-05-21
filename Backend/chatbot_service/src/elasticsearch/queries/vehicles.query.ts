import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const vehiclesQueries = {
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
      return await prisma.vehicles.findMany({
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
      return await prisma.vehicles.findFirst({
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
      return await prisma.vehicles.findMany({
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

      return await prisma.vehicles.findMany({
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

      return await prisma.vehicle_reservations.findMany({
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
      return await prisma.vehicle_reservations.findMany({
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

      const refuelingData = await prisma.vehicle_refueling.findMany({
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
      const statistics = [];

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

      return await prisma.vehicle_incidents.findMany({
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
};
