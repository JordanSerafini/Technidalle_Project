import { PrismaService } from '../../prisma/prisma.service';

// Type pour les coordonnées géographiques
interface GeoCoordinates {
  lat: number;
  lon: number;
}

// Exporter une fonction factory qui prend le PrismaService en paramètre
export const getClientsQueries = (prismaService: PrismaService) => ({
  clients_list: {
    keywords: [
      'client',
      'liste',
      'tous',
      'répertoire',
      'annuaire',
      'afficher',
      'clientèle',
    ],
    questions: [
      'Liste des clients',
      'Tous les clients',
      'Quels sont nos clients ?',
      'Répertoire clients',
      'Base de clients',
      'Afficher clients',
      'Clients enregistrés',
      'Voir tous les clients',
      'Notre clientèle',
      'Annuaire des clients',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              city: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste complète des clients',
  },

  client_details: {
    keywords: [
      'détail',
      'information',
      'fiche',
      'profil',
      'coordonnées',
      'client',
      'dossier',
    ],
    questions: [
      'Détails du client [CLIENT]',
      'Informations sur [CLIENT]',
      'Fiche client [CLIENT]',
      'Profil de [CLIENT]',
      'Coordonnées de [CLIENT]',
      'Qui est [CLIENT] ?',
      'Informations client [CLIENT]',
      'Contact [CLIENT]',
      'Données de [CLIENT]',
      'Dossier client [CLIENT]',
    ],
    prisma: async (client: string) => {
      return await prismaService.clients.findFirst({
        where: {
          OR: [
            { firstname: { contains: client, mode: 'insensitive' } },
            { lastname: { contains: client, mode: 'insensitive' } },
            { company_name: { contains: client, mode: 'insensitive' } },
            { email: { contains: client, mode: 'insensitive' } },
            { customer_id: { contains: client, mode: 'insensitive' } },
          ],
        },
        include: {
          addresses: true,
          client_addresses: {
            include: {
              addresses: true,
            },
          },
          projects: {
            select: {
              name: true,
              reference: true,
              status: true,
              start_date: true,
              end_date: true,
            },
            orderBy: {
              start_date: 'desc',
            },
          },
          documents: {
            select: {
              type: true,
              reference: true,
              status: true,
              issue_date: true,
              amount: true,
              payment_status: true,
            },
            orderBy: {
              issue_date: 'desc',
            },
          },
          events: {
            where: {
              start_date: {
                gte: new Date(),
              },
            },
            select: {
              title: true,
              start_date: true,
              end_date: true,
              location: true,
            },
            orderBy: {
              start_date: 'asc',
            },
          },
        },
      });
    },
    response_format: 'object',
    description: 'Informations détaillées sur un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom, société ou email du client',
      },
    ],
  },

  clients_with_unpaid_invoices: {
    keywords: [
      'facture',
      'impayé',
      'retard',
      'paiement',
      'non réglé',
      'débiteur',
    ],
    questions: [
      'Clients avec factures impayées',
      'Factures non réglées par client',
      "Qui n'a pas payé ses factures ?",
      'Clients en retard de paiement',
      'Factures en attente de paiement',
      'Clients débiteurs',
      'Paiements clients en retard',
      'Liste des impayés',
      'Clients avec paiements en attente',
      'Factures non payées',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'facture',
              payment_status: 'non_payé',
              due_date: {
                lt: new Date(),
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: {
              type: 'facture',
              payment_status: 'non_payé',
            },
            select: {
              reference: true,
              issue_date: true,
              due_date: true,
              amount: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste des clients avec des factures impayées et en retard',
  },

  clients_by_city: {
    keywords: [
      'ville',
      'localité',
      'client',
      'habiter',
      'localiser',
      'résider',
      'domicile',
    ],
    questions: [
      'Clients à [CITY]',
      'Quels clients à [CITY] ?',
      'Clients dans la ville [CITY]',
      'Clientèle à [CITY]',
      'Clients localisés à [CITY]',
      'Clients habitant à [CITY]',
      'Clients par ville [CITY]',
      'Rechercher clients à [CITY]',
      'Clients de [CITY]',
      'Répertoire clients [CITY]',
    ],
    prisma: async (city: string) => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            {
              addresses: {
                city: {
                  contains: city,
                  mode: 'insensitive',
                },
              },
            },
            {
              client_addresses: {
                some: {
                  addresses: {
                    city: {
                      contains: city,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
        },
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              street_number: true,
              street_name: true,
              zip_code: true,
              city: true,
            },
          },
          client_addresses: {
            select: {
              address_type: true,
              addresses: {
                select: {
                  street_number: true,
                  street_name: true,
                  zip_code: true,
                  city: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste des clients filtrés par ville',
    parameters: [
      {
        name: 'CITY',
        description: 'Nom de la ville',
      },
    ],
  },

  recently_active_clients: {
    keywords: [
      'récent',
      'actif',
      'activité',
      'client',
      'dernièrement',
      'récemment',
      'interaction',
    ],
    questions: [
      'Clients récemment actifs',
      'Clients actifs',
      'Clients récents',
      'Activité client récente',
      'Clients avec activité récente',
      'Derniers clients actifs',
      'Clients avec projets récents',
      'Clients actifs récemment',
      'Dernières interactions clients',
      'Clients avec activité',
    ],
    prisma: async () => {
      // Date il y a 3 mois
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      return await prismaService.clients.findMany({
        where: {
          OR: [
            {
              projects: {
                some: {
                  updated_at: {
                    gte: threeMonthsAgo,
                  },
                },
              },
            },
            {
              documents: {
                some: {
                  issue_date: {
                    gte: threeMonthsAgo,
                  },
                },
              },
            },
            {
              events: {
                some: {
                  start_date: {
                    gte: threeMonthsAgo,
                  },
                },
              },
            },
          ],
        },
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: {
              updated_at: {
                gte: threeMonthsAgo,
              },
            },
            select: {
              name: true,
              status: true,
              updated_at: true,
            },
            orderBy: {
              updated_at: 'desc',
            },
            take: 1,
          },
          documents: {
            where: {
              issue_date: {
                gte: threeMonthsAgo,
              },
            },
            select: {
              type: true,
              reference: true,
              issue_date: true,
            },
            orderBy: {
              issue_date: 'desc',
            },
            take: 1,
          },
          events: {
            where: {
              start_date: {
                gte: threeMonthsAgo,
              },
            },
            select: {
              title: true,
              start_date: true,
            },
            orderBy: {
              start_date: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des clients ayant eu une activité récente (projets, documents ou événements dans les 3 derniers mois)',
  },

  inactive_clients: {
    keywords: [
      'inactif',
      'dormant',
      'perdu',
      'sans activité',
      'relancer',
      'client',
      'ancien',
    ],
    questions: [
      'Clients inactifs',
      'Clients sans activité récente',
      'Clients dormants',
      'Clients à réactiver',
      'Clients perdus',
      'Clients sans projet récent',
      'Clients à relancer',
      'Anciens clients inactifs',
      'Clients sans interaction récente',
      'Base clients inactive',
    ],
    prisma: async () => {
      // Date il y a 6 mois
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      return await prismaService.clients.findMany({
        where: {
          AND: [
            {
              projects: {
                every: {
                  OR: [
                    { updated_at: { lt: sixMonthsAgo } },
                    { updated_at: null },
                  ],
                },
              },
            },
            {
              documents: {
                every: {
                  OR: [
                    { issue_date: { lt: sixMonthsAgo } },
                    { issue_date: undefined },
                  ],
                },
              },
            },
            {
              events: {
                every: {
                  OR: [
                    { start_date: { lt: sixMonthsAgo } },
                    { start_date: undefined },
                  ],
                },
              },
            },
          ],
        },
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          created_at: true,
          projects: {
            select: {
              name: true,
              status: true,
              updated_at: true,
            },
            orderBy: {
              updated_at: 'desc',
            },
            take: 1,
          },
          documents: {
            select: {
              type: true,
              reference: true,
              issue_date: true,
            },
            orderBy: {
              issue_date: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des clients sans activité depuis plus de 6 mois',
  },

  clients_recent: {
    keywords: [
      'récent',
      'nouveau',
      'dernière acquisition',
      'ajouté',
      'créé',
      'enregistré',
      'client',
    ],
    questions: [
      'Quels sont les clients récents ?',
      'Derniers clients ajoutés',
      'Nouveaux clients',
      'Liste des clients récemment créés',
      'Clients les plus récents',
      'Dernières acquisitions clients',
      'Qui sont les nouveaux clients ?',
      'Clients ajoutés récemment',
      'Derniers clients enregistrés',
      'Nouvelles fiches clients',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              city: true,
            },
          },
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Liste des 10 clients les plus récemment ajoutés',
  },

  client_projects: {
    keywords: [
      'projet',
      'chantier',
      'travail',
      'mission',
      'client',
      'associé',
      'activité',
    ],
    questions: [
      'Quels projets a le client [CLIENT] ?',
      'Liste des chantiers du client [CLIENT]',
      'Projets associés à [CLIENT]',
      'Tous les projets de [CLIENT]',
      'Chantiers en cours pour [CLIENT]',
      'Historique des projets de [CLIENT]',
      'Sur quels projets travaille [CLIENT] ?',
      'Projets passés et actuels de [CLIENT]',
      'Activité projet du client [CLIENT]',
      'Que fait [CLIENT] comme projets ?',
    ],
    prisma: async (client: string) => {
      return await prismaService.projects.findMany({
        where: {
          clients: {
            OR: [
              { firstname: { contains: client, mode: 'insensitive' } },
              { lastname: { contains: client, mode: 'insensitive' } },
              { email: { contains: client, mode: 'insensitive' } },
              { id: { equals: parseInt(client) } },
            ],
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          start_date: true,
          end_date: true,
          status: true,
        },
        orderBy: {
          start_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste de tous les projets associés à un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom, email ou ID du client',
      },
    ],
  },

  client_invoices: {
    keywords: [
      'facture',
      'paiement',
      'client',
      'facturation',
      'historique',
      'règlement',
      'émis',
    ],
    questions: [
      'Quelles factures a le client [CLIENT] ?',
      'Liste des factures du client [CLIENT]',
      'Factures associées à [CLIENT]',
      'Tous les paiements de [CLIENT]',
      'Historique de facturation de [CLIENT]',
      'Factures émises pour [CLIENT]',
      'État des factures de [CLIENT]',
      'Combien de factures a [CLIENT] ?',
      'Dossier de facturation [CLIENT]',
      'Factures en cours pour [CLIENT]',
    ],
    prisma: async (client: string) => {
      return await prismaService.documents.findMany({
        where: {
          type: 'facture',
          projects: {
            clients: {
              OR: [
                { firstname: { contains: client, mode: 'insensitive' } },
                { lastname: { contains: client, mode: 'insensitive' } },
                { email: { contains: client, mode: 'insensitive' } },
                { id: { equals: parseInt(client) } },
              ],
            },
          },
        },
        select: {
          id: true,
          reference: true,
          issue_date: true,
          due_date: true,
          amount: true,
          tva_rate: true,
          status: true,
          payment_status: true,
          projects: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste de toutes les factures associées à un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom, email ou ID du client',
      },
    ],
  },

  clients_with_active_projects: {
    keywords: [
      'projet',
      'actif',
      'en cours',
      'engagé',
      'chantier',
      'client',
      'travaux',
    ],
    questions: [
      'Quels clients ont des projets en cours ?',
      'Clients avec chantiers actifs',
      'Liste des clients ayant des projets actifs',
      'Clients actuellement engagés',
      'Clients avec activité en cours',
      'Qui a des projets actifs ?',
      'Clients occupés sur des chantiers',
      'Liste des clients actifs sur des projets',
      'Clients avec travaux en cours',
      'Portfolio clients actifs',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              status: 'en_cours',
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          projects: {
            where: {
              status: 'en_cours',
            },
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          {
            projects: {
              _count: 'desc',
            },
          },
          { lastname: 'asc' },
          { firstname: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description:
      'Liste des clients ayant au moins un projet actif, avec le nombre de projets actifs',
  },

  clients_without_projects: {
    questions: [
      "Quels clients n'ont pas de projets ?",
      'Clients sans chantiers',
      'Liste des clients sans projet',
      'Clients inactifs',
      "Qui n'a aucun projet ?",
      'Clients sans activité',
      'Clients à relancer',
      'Clients sans chantier en cours',
      'Liste des clients dormants',
      'Clients sans aucun projet associé',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            none: {},
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    },
    description: "Liste des clients qui n'ont aucun projet associé",
  },

  clients_by_revenue: {
    questions: [
      "Quels sont les clients avec le plus grand chiffre d'affaires ?",
      'Classement des clients par CA',
      'Clients les plus importants financièrement',
      'Meilleurs clients en termes de facturation',
      'Top 10 des clients par revenu',
      "Clients générant le plus de chiffre d'affaires",
      'Qui sont les clients les plus rentables ?',
      'Classement des meilleurs clients par CA',
      'Clients premium par valeur financière',
      "Clients avec le plus gros volume d'affaires",
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          projects: {
            include: {
              documents: {
                where: {
                  type: 'facture',
                  status: {
                    not: 'annule',
                  },
                },
                select: {
                  amount: true,
                },
              },
            },
          },
        },
      });

      // Calculer le chiffre d'affaires total par client
      const clientsWithRevenue = clients.map((client) => {
        let totalRevenue = 0;
        let invoiceCount = 0;

        client.projects.forEach((project) => {
          project.documents.forEach((doc) => {
            totalRevenue += Number(doc.amount || 0);
            invoiceCount++;
          });
        });

        return {
          id: client.id,
          firstname: client.firstname,
          lastname: client.lastname,
          email: client.email,
          phone: client.phone,
          total_invoices: invoiceCount,
          total_revenue: totalRevenue,
        };
      });

      // Trier par chiffre d'affaires décroissant et prendre les 10 premiers
      return clientsWithRevenue
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
    },
    description: "Top 10 des clients générant le plus de chiffre d'affaires",
  },

  clients_with_multiple_projects: {
    questions: [
      'Quels clients ont plusieurs projets ?',
      "Clients avec plus d'un chantier",
      'Liste des clients fidèles avec plusieurs projets',
      'Clients récurrents',
      'Qui a plusieurs projets ?',
      'Clients multi-projets',
      'Clients fidèles avec projets multiples',
      'Liste des clients avec au moins deux projets',
      'Clients avec une forte activité',
      'Portefeuille clients multi-chantiers',
    ],
    prisma: async () => {
      // D'abord, on récupère tous les clients avec leurs projets
      const allClients = await prismaService.clients.findMany({
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      // Ensuite, on filtre pour ne garder que ceux avec plus d'un projet
      const clientsWithMultipleProjects = allClients
        .filter((client) => client.projects.length > 1)
        .map((client) => ({
          ...client,
          projectCount: client.projects.length,
        }))
        .sort((a, b) => b.projectCount - a.projectCount);

      return clientsWithMultipleProjects;
    },
    description:
      "Liste des clients ayant plus d'un projet, triés par nombre de projets décroissant",
  },

  clients_by_creation_date: {
    questions: [
      'Quels clients ont été créés [PERIOD] ?',
      'Nouveaux clients sur [PERIOD]',
      'Clients ajoutés [PERIOD]',
      'Acquisition de clients [PERIOD]',
      'Qui sont les clients créés durant [PERIOD] ?',
      'Clients enregistrés depuis [PERIOD]',
      'Liste des clients créés ces [PERIOD]',
      'Nouveaux clients des derniers [PERIOD]',
      'Clients datant de moins de [PERIOD]',
      'Création de clients sur [PERIOD]',
    ],
    prisma: async (period: string) => {
      let dateLimit: Date;
      const now = new Date();

      switch (period.toLowerCase()) {
        case '1 month':
        case '1 mois':
          dateLimit = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '3 months':
        case '3 mois':
          dateLimit = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case '6 months':
        case '6 mois':
          dateLimit = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case '1 year':
        case '1 an':
        case '1 année':
          dateLimit = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          // Par défaut, 1 mois
          dateLimit = new Date(now.setMonth(now.getMonth() - 1));
      }

      return await prismaService.clients.findMany({
        where: {
          created_at: {
            gte: dateLimit,
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    },
    description: 'Liste des clients créés sur une période spécifique',
    parameters: [
      {
        name: 'PERIOD',
        description: 'Période (ex: "1 month", "3 months", "1 year")',
        default: '1 month',
      },
    ],
  },

  clients_without_paid_invoices: {
    keywords: [
      'impayé',
      'sans paiement',
      'facture',
      'non réglé',
      'risque',
      'historique',
    ],
    questions: [
      "Quels clients n'ont jamais payé une facture ?",
      'Clients sans paiements enregistrés',
      'Liste des clients à risque financier',
      'Clients sans facture payée',
      "Qui n'a jamais payé de facture ?",
      'Clients sans historique de paiement',
      'Clients sans règlement',
      "Liste des clients n'ayant effectué aucun paiement",
      'Clients avec factures mais sans paiement',
      'Clientèle sans historique de règlement',
    ],
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              documents: {
                some: {
                  type: 'facture',
                },
              },
            },
          },
          NOT: {
            projects: {
              some: {
                documents: {
                  some: {
                    type: 'facture',
                    payment_status: 'paye',
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          projects: {
            select: {
              name: true,
              documents: {
                where: {
                  type: 'facture',
                },
                select: {
                  reference: true,
                  issue_date: true,
                  amount: true,
                  payment_status: true,
                },
              },
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    description: "Liste des clients qui n'ont aucune facture payée",
  },

  clients_payment_history: {
    keywords: [
      'paiement',
      'historique',
      'règlement',
      'transaction',
      'facture',
      'payé',
    ],
    questions: [
      'Historique des paiements du client [CLIENT]',
      'Quels paiements a effectué [CLIENT] ?',
      'Liste des règlements de [CLIENT]',
      'Tous les paiements de [CLIENT]',
      'Paiements historiques de [CLIENT]',
      'Quand [CLIENT] a-t-il payé ses factures ?',
      'Journal des paiements de [CLIENT]',
      'Détail des règlements effectués par [CLIENT]',
      'Historique financier du client [CLIENT]',
      'Transactions de paiement de [CLIENT]',
    ],
    response_format: 'table',
    prisma: async (client: string) => {
      // Cette requête est complexe car nous n'avons pas de table payments directement dans Prisma
      // Nous allons utiliser les documents payés comme approximation des paiements
      return await prismaService.documents.findMany({
        where: {
          type: 'facture',
          payment_status: 'paye',
          projects: {
            clients: {
              OR: [
                { firstname: { contains: client, mode: 'insensitive' } },
                { lastname: { contains: client, mode: 'insensitive' } },
                { email: { contains: client, mode: 'insensitive' } },
                { id: { equals: parseInt(client) } },
              ],
            },
          },
        },
        select: {
          reference: true,
          issue_date: true,
          payment_date: true,
          amount: true,
          status: true,
          projects: {
            select: {
              name: true,
              clients: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
        orderBy: {
          payment_date: 'desc',
        },
      });
    },
    description: 'Liste des paiements effectués par un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom, email ou ID du client',
      },
    ],
  },

  clients_by_zip_code: {
    keywords: [
      'code postal',
      'zip',
      'localisation',
      'adresse',
      'zone',
      'région',
    ],
    questions: [
      'Quels clients habitent dans le code postal [ZIP] ?',
      'Clients du code postal [ZIP]',
      'Liste des clients au code postal [ZIP]',
      'Clients résidant dans le [ZIP]',
      'Qui habite dans la zone [ZIP] ?',
      'Clients localisés dans le code postal [ZIP]',
      'Répertoire clients par code postal [ZIP]',
      'Base client code postal [ZIP]',
      'Clients dans la zone postale [ZIP]',
      'Recherche clients par code postal [ZIP]',
    ],
    response_format: 'table',
    prisma: async (zip: string) => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            {
              addresses: {
                zip_code: {
                  contains: zip,
                  mode: 'insensitive',
                },
              },
            },
            {
              client_addresses: {
                some: {
                  addresses: {
                    zip_code: {
                      contains: zip,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              street_number: true,
              street_name: true,
              zip_code: true,
              city: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    description: 'Liste des clients habitant dans un code postal spécifique',
    parameters: [
      {
        name: 'ZIP',
        description: 'Code postal recherché',
      },
    ],
  },

  clients_all: {
    keywords: [
      'tous',
      'liste',
      'client',
      'complet',
      'intégral',
      'totalité',
      'ensemble',
    ],
    questions: [
      'Liste de tous les clients',
      'Récupérer tous les clients',
      'Affiche tous les clients',
      'Montre-moi tous les clients',
      'Base complète des clients',
      'Tous les clients enregistrés',
      'Qui sont tous les clients ?',
      'Liste intégrale des clients',
      'Répertoire complet des clients',
      'Ensemble des clients',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          addresses: {
            select: {
              city: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste complète de tous les clients enregistrés dans le système',
  },
  clients_needing_follow_up: {
    keywords: [
      'relance',
      'suivi',
      'contact',
      'rappel',
      'client inactif',
      'à recontacter',
    ],
    questions: [
      'Quels clients doivent être relancés ?',
      'Clients à recontacter',
      'Qui n\'a pas été contacté récemment ?',
      'Liste des clients sans suivi récent',
      'Quels clients nécessitent un suivi ?',
      'Clients sans activité récente mais récents',
    ],
    prisma: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      return await prismaService.clients.findMany({
        where: {
          created_at: {
            gte: sixMonthsAgo,
          },
          AND: [
            {
              projects: {
                every: {
                  updated_at: { lt: threeMonthsAgo },
                },
              },
            },
            {
              documents: {
                every: {
                  issue_date: { lt: threeMonthsAgo },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    },
    response_format: 'table',
    description:
      'Clients créés récemment mais sans suivi ou activité depuis 3 mois.',
  },

  clients_missing_contact_info: {
    keywords: [
      'incomplet',
      'sans email',
      'sans téléphone',
      'données manquantes',
      'contact manquant',
    ],
    questions: [
      'Clients sans adresse email',
      'Clients sans téléphone',
      'Qui n\'a pas de coordonnées ?',
      'Liste des clients avec données manquantes',
      'Clients à compléter',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            { email: { equals: '' } }, 
            { email: { equals: undefined } }, 
            { phone: { equals: '' } }, 
            { phone: { equals: null } }
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Clients sans coordonnées de contact complètes (email ou téléphone).',
  },

  clients_with_events_this_week: {
    keywords: ['évènements', 'rdv', 'interactions', 'visite', 'cette semaine'],
    questions: [
      'Quels clients ont des RDV cette semaine ?',
      'Interactions clients cette semaine',
      'Clients planifiés cette semaine',
      'Rendez-vous clients à venir',
      'Qui dois-je voir cette semaine ?',
    ],
    prisma: async () => {
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));

      return await prismaService.clients.findMany({
        where: {
          events: {
            some: {
              start_date: {
                gte: now,
                lte: endOfWeek,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          events: {
            where: {
              start_date: {
                gte: now,
                lte: endOfWeek,
              },
            },
            select: {
              title: true,
              start_date: true,
              location: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Clients avec des évènements planifiés durant la semaine en cours.',
  },
  clients_with_multiple_addresses: {
    keywords: ['adresses', 'clients', 'multiples', 'plusieurs', 'domiciles'],
    questions: [
      'Quels clients ont plusieurs adresses ?',
      'Liste des clients avec adresses multiples',
      'Clients avec plusieurs domiciles',
      'Qui a plusieurs adresses ?',
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          client_addresses: true,
        },
      });
      return clients
        .filter((c) => c.client_addresses.length > 1)
        .map((c) => ({
          id: c.id,
          firstname: c.firstname,
          lastname: c.lastname,
          email: c.email,
          phone: c.phone,
          nb_addresses: c.client_addresses.length,
        }));
    },
    response_format: 'table',
    description: 'Liste des clients possédant plusieurs adresses enregistrées.',
  },

  clients_without_ongoing_projects: {
    keywords: [
      'projets',
      'inactif',
      'pas en cours',
      'aucune activité',
      'sans projet actif',
    ],
    questions: [
      'Clients sans projets en cours',
      'Qui n\'a pas de projet actif ?',
      'Liste des clients sans activité actuelle',
      'Clients inactifs côté projet',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            none: {},
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Clients qui n\'ont actuellement aucun projet en cours.',
  },

  clients_with_multiple_contacts: {
    keywords: ['contacts', 'personnes', 'référents', 'liens', 'interlocuteurs'],
    questions: [
      'Clients avec plusieurs contacts',
      'Liste des clients avec plusieurs référents',
      'Qui a plus d\'un interlocuteur ?',
      'Clients avec plusieurs personnes associées',
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          events: true,
        },
      });
      return clients
        .filter((c) => {
          const emails = new Set(
            c.events
              .map((e) =>
                e.description?.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g),
              )
              .flat()
              .filter(Boolean),
          );
          return emails.size > 1;
        })
        .map((c) => ({
          id: c.id,
          firstname: c.firstname,
          lastname: c.lastname,
          email: c.email,
          phone: c.phone,
          nb_contacts: new Set(
            c.events
              .map((e) =>
                e.description?.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g),
              )
              .flat()
              .filter(Boolean),
          ).size,
        }));
    },
    response_format: 'table',
    description:
      'Clients associés à plusieurs contacts/interlocuteurs identifiables.',
  },

  clients_with_recent_quotes: {
    keywords: [
      'devis',
      'récent',
      'dernier',
      'envoyé',
      'proposition commerciale',
    ],
    questions: [
      'Clients ayant reçu un devis récemment',
      'Derniers devis envoyés aux clients',
      'Clients avec proposition commerciale récente',
      'Qui a reçu un devis récemment ?',
    ],
    prisma: async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'devis',
              issue_date: {
                gte: oneMonthAgo,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          documents: {
            where: {
              type: 'devis',
              issue_date: {
                gte: oneMonthAgo,
              },
            },
            select: {
              reference: true,
              issue_date: true,
              status: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Clients ayant reçu un devis au cours du dernier mois.',
  },
  clients_with_large_invoice_volume: {
    keywords: ['factures', 'volume', 'beaucoup', 'quantité', 'nombre'],
    questions: [
      'Quels clients ont le plus de factures ?',
      'Clients avec grand volume de facturation',
      'Liste des clients les plus facturés',
      'Qui reçoit beaucoup de factures ?',
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          documents: true,
        },
      });

      const clientsWithInvoiceCount = clients
        .map((client) => ({
          id: client.id,
          firstname: client.firstname,
          lastname: client.lastname,
          email: client.email,
          phone: client.phone,
          invoice_count: client.documents.filter((d) => d.type === 'facture')
            .length,
        }))
        .filter((c) => c.invoice_count > 5)
        .sort((a, b) => b.invoice_count - a.invoice_count);
        
      return clientsWithInvoiceCount;
    },
    response_format: 'table',
    description: 'Clients ayant reçu un grand nombre de factures (plus de 5).',
  },

  clients_with_frequent_events: {
    keywords: [
      'évènements',
      'fréquent',
      'interactions',
      'contacts',
      'rendez-vous',
    ],
    questions: [
      'Clients souvent rencontrés',
      'Clients avec interactions fréquentes',
      'Clients avec le plus de rendez-vous',
      'Qui a eu beaucoup d\'évènements ?',
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          events: true,
        },
      });
      return clients
        .map((client) => ({
          id: client.id,
          firstname: client.firstname,
          lastname: client.lastname,
          email: client.email,
          phone: client.phone,
          event_count: client.events.length,
        }))
        .filter((c) => c.event_count > 3)
        .sort((a, b) => b.event_count - a.event_count);
    },
    response_format: 'table',
    description: 'Clients ayant eu plus de 3 interactions ou évènements.',
  },

  clients_far_from_headquarters: {
    keywords: [
      'localisation',
      'loin',
      'géolocalisation',
      'distance',
      'éloignés',
    ],
    questions: [
      'Clients éloignés du siège',
      'Liste des clients les plus éloignés',
      'Qui est loin du bureau principal ?',
      'Clients à plus de 100km du siège',
    ],
    prisma: async () => {
      const HEADQUARTERS: GeoCoordinates = { lat: 45.9, lon: 6.1 }; // Exemple : Annecy
      const clients = await prismaService.clients.findMany({
        include: {
          addresses: true,
        },
      });
      return clients
        .filter((client) => {
          if (!client.addresses?.latitude || !client.addresses?.longitude)
            return false;
          
          const latitude = Number(client.addresses.latitude);
          const longitude = Number(client.addresses.longitude);
          
          const R = 6371;
          const dLat = ((latitude - HEADQUARTERS.lat) * Math.PI) / 180;
          const dLon = ((longitude - HEADQUARTERS.lon) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((HEADQUARTERS.lat * Math.PI) / 180) *
              Math.cos((latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c;
          return d > 100;
        })
        .map((client) => {
          if (!client.addresses) return null;
          
          const latitude = Number(client.addresses.latitude);
          const longitude = Number(client.addresses.longitude);
          
          // Calcul de distance avec la formule haversine
          const distance = Math.round(
            Math.acos(
              Math.sin((HEADQUARTERS.lat * Math.PI) / 180) *
                Math.sin((latitude * Math.PI) / 180) +
                Math.cos((HEADQUARTERS.lat * Math.PI) / 180) *
                  Math.cos((latitude * Math.PI) / 180) *
                  Math.cos(
                    ((longitude - HEADQUARTERS.lon) * Math.PI) / 180,
                  ),
            ) * 6371,
          );
          
          return {
            id: client.id,
            firstname: client.firstname,
            lastname: client.lastname,
            email: client.email,
            phone: client.phone,
            distance_km: distance,
          };
        })
        .filter((client): client is NonNullable<typeof client> => client !== null);
    },
    response_format: 'table',
    description: 'Liste des clients situés à plus de 100km du siège social.',
  },

  clients_without_recent_quotes: {
    keywords: ['devis', 'ancien', 'manque', 'jamais reçu', 'proposition'],
    questions: [
      'Clients sans devis récent',
      'Qui n\'a pas eu de devis depuis 6 mois ?',
      'Clients sans devis envoyé depuis longtemps',
      'Liste des clients oubliés pour les devis',
    ],
    prisma: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      return await prismaService.clients.findMany({
        where: {
          NOT: {
            documents: {
              some: {
                type: 'devis',
                issue_date: { gte: sixMonthsAgo },
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
    response_format: 'table',
    description:
      'Clients n\'ayant reçu aucun devis au cours des 6 derniers mois.',
  },

  clients_with_cancelled_projects: {
    keywords: ['annulé', 'projet', 'refusé', 'abandonné'],
    questions: [
      'Clients avec projets annulés',
      'Qui a vu ses projets refusés ?',
      'Liste des projets annulés par client',
      'Projets abandonnés par les clients',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              status: 'annule',
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          projects: {
            where: {
              status: 'annule',
            },
            select: {
              name: true,
              status: true,
            },
          },
        },
      });
    },
    response_format: 'table',
    description: 'Clients dont certains projets ont été annulés.',
  },

  clients_with_projects_in_multiple_cities: {
    keywords: ['multi-villes', 'plusieurs villes', 'projets dispersés'],
    questions: [
      'Clients avec projets dans plusieurs villes',
      'Liste des clients avec chantiers dispersés',
      'Clients avec chantiers multi-localisés',
      'Qui travaille dans plusieurs villes ?',
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          projects: {
            include: {
              addresses: true,
            },
          },
        },
      });

      return clients
        .map((c) => {
          const cities = new Set(
            c.projects.map((p) => p.addresses?.city).filter(Boolean),
          );
          return { ...c, cityCount: cities.size };
        })
        .filter((c) => c.cityCount > 1)
        .map((c) => ({
          id: c.id,
          firstname: c.firstname,
          lastname: c.lastname,
          email: c.email,
          phone: c.phone,
          city_count: c.cityCount,
        }));
    },
    response_format: 'table',
    description: 'Clients ayant des projets répartis sur plusieurs villes.',
  },

  clients_without_any_events: {
    keywords: ['aucun évènement', 'jamais contacté', 'zéro interaction'],
    questions: [
      'Clients sans événement enregistré',
      'Jamais de contact avec certains clients ?',
      'Clients sans rendez-vous ni visite',
      'Clients oubliés sans évènements',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          events: {
            none: {},
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
    response_format: 'table',
    description: 'Clients sans aucune interaction ou événement enregistré.',
  },

  clients_with_recent_activity_but_no_projects: {
    keywords: ['activité', 'contact', 'événement', 'sans projet'],
    questions: [
      'Clients avec activité récente mais sans projets',
      'Contacts récents sans chantier',
      'Clients actifs mais sans projet démarré',
      'Qui est actif mais sans chantier ?',
    ],
    prisma: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return await prismaService.clients.findMany({
        where: {
          projects: { none: {} },
          events: {
            some: {
              start_date: { gte: threeMonthsAgo },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
    response_format: 'table',
    description:
      'Clients ayant des interactions récentes mais aucun projet associé.',
  },

  clients_with_unusual_invoice_amounts: {
    keywords: ['facture', 'anomalie', 'montant', 'élevé', 'faible'],
    questions: [
      'Clients avec factures au montant anormal',
      'Qui a des factures très élevées ou très faibles ?',
      'Factures suspectes par client',
      'Montants de facturation inhabituels',
    ],
    prisma: async () => {
      const thresholdLow = 10;
      const thresholdHigh = 10000;
      const clients = await prismaService.clients.findMany({
        include: {
          documents: true,
        },
      });
      return clients
        .map((client) => {
          const unusual = client.documents.filter(
            (d) =>
              d.type === 'facture' &&
              (Number(d.amount) < thresholdLow ||
                Number(d.amount) > thresholdHigh),
          );
          return unusual.length
            ? {
                id: client.id,
                firstname: client.firstname,
                lastname: client.lastname,
                email: client.email,
                phone: client.phone,
                invoice_count: unusual.length,
              }
            : null;
        })
        .filter(Boolean);
    },
    response_format: 'table',
    description: 'Clients avec des factures très faibles ou très élevées.',
  },

  clients_with_high_discount_usage: {
    keywords: ['remise', 'réduction', 'client', 'commercial'],
    questions: [
      'Clients ayant reçu le plus de remises',
      'Liste des clients les plus remisés',
      'Qui a bénéficié de réductions importantes ?',
      'Clients avec beaucoup de réductions',
    ],
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          documents: true,
        },
      });
      
      const clientsWithDiscounts = clients
        .map((c) => {
          const totalDiscount = c.documents.reduce(
            (acc, doc) => acc + Number(doc.discount_amount || 0),
            0,
          );
          
          if (totalDiscount > 0) {
            return {
              id: c.id,
              firstname: c.firstname,
              lastname: c.lastname,
              email: c.email,
              phone: c.phone,
              total_discount: totalDiscount,
            };
          }
          return null;
        })
        .filter((client): client is NonNullable<typeof client> => client !== null)
        .sort((a, b) => b.total_discount - a.total_discount);
        
      return clientsWithDiscounts;
    },
    response_format: 'table',
    description: 'Clients ayant reçu le plus de remises cumulées.',
  },

  clients_with_missing_contact_info: {
    keywords: ['incomplet', 'manquant', 'coordonnées', 'informations absentes'],
    questions: [
      'Clients sans email ou téléphone',
      'Informations de contact incomplètes',
      'Clients difficiles à joindre',
      'Coordonnées clients manquantes',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            { email: { equals: '' } },
            { email: { equals: undefined } },
            { phone: { equals: '' } },
            { phone: { equals: undefined } },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des clients sans email ou numéro de téléphone.',
  },

  clients_with_overdue_projects: {
    keywords: ['retard', 'projets', 'échéance dépassée', 'non terminé'],
    questions: [
      'Clients avec projets en retard',
      'Chantiers dépassant les délais',
      'Liste des projets en retard par client',
      'Qui a des projets non terminés à temps ?',
    ],
    prisma: async () => {
      const today = new Date();
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              end_date: { lt: today },
              status: { not: 'termine' },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          projects: {
            where: {
              end_date: { lt: today },
              status: { not: 'termine' },
            },
            select: {
              name: true,
              end_date: true,
              status: true,
            },
          },
        },
      });
    },
    response_format: 'table',
    description:
      'Clients avec projets ayant dépassé la date prévue sans être terminés.',
  },
  clients_without_signed_documents: {
    keywords: ['sans signature', 'non signé', 'document contractuel', 'contrat'],
    questions: [
      'Clients sans documents contractuels signés',
      'Quels clients n\'ont pas signé leurs documents ?',
      'Liste des clients sans signature',
      'Clients avec documents en attente de signature'
    ],
    description: 'Liste des clients qui n\'ont pas de documents signés',
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            none: {
              signed_by_client: true,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
  },

  clients_with_upcoming_projects: {
    keywords: ['à venir', 'prochain', 'démarrage', 'prévu'],
    questions: [
      'Clients avec des projets devant commencer dans le mois',
      'Projets à démarrer prochainement',
      'Quels chantiers vont débuter ce mois-ci ?',
      'Projets clients prévus pour bientôt'
    ],
    description: 'Liste des clients ayant des projets qui débuteront dans le mois à venir',
    response_format: 'table',
    prisma: async () => {
      const now = new Date();
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              start_date: {
                gt: now,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          projects: {
            where: {
              start_date: {
                gt: now,
              },
            },
            select: {
              name: true,
              start_date: true,
            },
          },
        },
      });
    },
  },

  clients_without_quotes: {
    keywords: ['jamais devisé', 'aucun devis', 'client sans devis'],
    questions: [
      'Clients sans devis',
      "Quels clients n'ont jamais reçu de devis ?",
      'Clients sans proposition commerciale',
    ],
    description: 'Clients pour lesquels aucun devis n a été enregistré',
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            none: {
              type: 'devis',
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
  },

  clients_with_projects_needing_attention: {
    keywords: ['suivi', 'projet problématique', 'chantier bloqué', 'alerte'],
    questions: [
      'Quels projets clients ont besoin de suivi ?',
      'Projets clients en alerte',
      'Chantiers nécessitant une attention particulière',
    ],
    description:
      'Clients avec des projets ayant un statut "en_pause" ou des retards',
    response_format: 'table',
    prisma: async () => {
      const now = new Date();
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              OR: [
                { status: 'en_pause' },
                { end_date: { lt: now }, status: { not: 'termine' } },
              ],
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          projects: {
            where: {
              OR: [
                { status: 'en_pause' },
                { end_date: { lt: now }, status: { not: 'termine' } },
              ],
            },
            select: {
              name: true,
              status: true,
              end_date: true,
            },
          },
        },
      });
    },
  },
  clients_with_high_invoice_rejections: {
    keywords: ['refus devis', 'annulation', 'rejet facture'],
    questions: [
      'Clients ayant refusé plusieurs devis',
      'Quels clients rejettent souvent les devis ?',
      'Clients avec beaucoup de refus commerciaux'
    ],
    description: 'Clients ayant un taux élevé de documents refusés (type devis)',
    response_format: 'table',
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          documents: true,
        },
      });
      
      const clientsWithRejections = clients
        .map((client) => {
          const refusedCount = client.documents.filter(d => d.type === 'devis' && d.status === 'refuse').length;
          if (refusedCount >= 2) {
            return {
              id: client.id,
              firstname: client.firstname,
              lastname: client.lastname,
              email: client.email,
              phone: client.phone,
              refused_count: refusedCount,
            };
          }
          return null;
        })
        .filter((client): client is NonNullable<typeof client> => client !== null)
        .sort((a, b) => b.refused_count - a.refused_count);
        
      return clientsWithRejections;
    },
  },
  
  loyal_clients_by_years: {
    keywords: ['fidèle', 'ancienneté', 'ancien client'],
    questions: [
      'Quels sont les clients les plus anciens ?',
      'Clients avec le plus d\'ancienneté',
      'Clients fidèles depuis longtemps'
    ],
    description: 'Classement des clients par ancienneté (date de création)',
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'asc',
        },
        take: 10,
      });
    },
  },
  
  clients_without_bank_info: {
    keywords: ['rib', 'iban', 'coordonnées bancaires'],
    questions: [
      'Clients sans RIB enregistré',
      'Liste des clients sans coordonnées bancaires',
      'Clients sans IBAN'
    ],
    description: 'Clients pour lesquels aucune info bancaire n\'est renseignée',
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          notes: {
            not: {
              contains: 'RIB',
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          notes: true,
        },
      });
    },
  },
  
  clients_with_no_recent_contact: {
    keywords: ['inactif', 'jamais contacté', 'relance', 'oublié'],
    questions: [
      'Clients jamais contactés récemment',
      'Clients sans appel ou événement récent',
      'Clients oubliés à relancer'
    ],
    description: 'Clients sans événement de contact depuis plus de 6 mois',
    response_format: 'table',
    prisma: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
      return await prismaService.clients.findMany({
        where: {
          events: {
            every: {
              start_date: {
                lt: sixMonthsAgo,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
        },
      });
    },
  },


  clients_with_unanswered_quotes: {
    keywords: ['devis sans réponse', 'sans retour', 'en attente', 'non répondu'],
    questions: [
      'Clients n\'ayant pas répondu au dernier devis',
      'Devis sans réponse client',
      'Quels clients n\'ont pas donné suite à leur devis ?',
      'Devis en attente de réponse client'
    ],
    description: 'Liste des clients ayant des devis en attente de réponse',
    response_format: 'table',
    prisma: async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'devis',
              status: 'en_attente',
              issue_date: {
                lt: oneMonthAgo,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          documents: {
            where: {
              type: 'devis',
              status: 'en_attente',
            },
            select: {
              reference: true,
              issue_date: true,
            },
            take: 1,
          },
        },
      });
    },
  },

  projects_near_completion: {
    keywords: ['presque terminé', 'finalisation', 'avancé', 'achèvement'],
    questions: [
      'Chantiers à plus de 80% réalisés',
      'Projets en phase de finalisation',
      'Quels projets sont presque terminés ?',
      'Chantiers en phase d\'achèvement'
    ],
    description: 'Liste des projets dont l\'avancement est supérieur à 80%',
    response_format: 'table',
    prisma: async () => {
      // Trouver les projets avec des étapes complétées à plus de 80% en moyenne
      const projects = await prismaService.projects.findMany({
        include: {
          project_stages: {
            select: {
              completion_percentage: true,
            },
          },
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
            },
          },
        },
      });

      return projects
        .map(project => {
          const stagesCount = project.project_stages.length;
          if (stagesCount === 0) return null;

          const avgCompletion = project.project_stages.reduce(
            (sum, stage) => sum + (stage.completion_percentage || 0), 
            0
          ) / stagesCount;

          if (avgCompletion >= 80) {
            return {
              project_name: project.name,
              reference: project.reference,
              client: project.clients 
                ? `${project.clients.company_name || ''} ${project.clients.firstname} ${project.clients.lastname}`.trim()
                : 'N/A',
              status: project.status,
              completion: Math.round(avgCompletion) + '%',
              end_date: project.end_date,
            };
          }
          return null;
        })
        .filter((project): project is NonNullable<typeof project> => project !== null);
    },
  },

  clients_with_paused_projects: {
    keywords: ['arrêt temporaire', 'pause', 'suspendu', 'en attente'],
    questions: [
      'Clients dont les projets ont été stoppés temporairement',
      'Projets en pause',
      'Chantiers suspendus',
      'Quels projets sont actuellement à l\'arrêt ?'
    ],
    description: 'Liste des clients ayant des projets en pause',
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              status: 'en_pause',
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          company_name: true,
          projects: {
            where: {
              status: 'en_pause',
            },
            select: {
              name: true,
              reference: true,
              start_date: true,
              end_date: true,
              updated_at: true,
            },
          },
        },
      });
    },
  },

  inactive_clients_by_duration: {
    keywords: ['inactif', 'sans activité', 'perdu', 'longtemps'],
    questions: [
      'Clients avec plus de X années sans nouveau projet',
      'Clients inactifs depuis longtemps',
      'Qui n\'a pas travaillé avec nous depuis des années ?',
      'Anciens clients sans activité récente'
    ],
    description: 'Liste des clients inactifs depuis une période spécifiée',
    response_format: 'table',
    prisma: async (years: string = '2') => {
      const yearsNum = parseInt(years);
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - (isNaN(yearsNum) ? 2 : yearsNum));

      return await prismaService.clients.findMany({
        where: {
          AND: [
            // Au moins un projet terminé dans le passé
            {
              projects: {
                some: {
                  status: 'termine',
                },
              },
            },
            // Aucun projet depuis la date limite
            {
              projects: {
                every: {
                  OR: [
                    { start_date: { lt: cutoffDate } },
                    { start_date: null },
                  ],
                },
              },
            },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          company_name: true,
          projects: {
            orderBy: {
              end_date: 'desc',
            },
            take: 1,
            select: {
              name: true,
              end_date: true,
            },
          },
        },
      });
    },
    parameters: [
      {
        name: 'YEARS',
        description: 'Nombre d\'années d\'inactivité (par défaut: 2)',
        optional: true,
      },
    ],
  },

  clients_with_most_referrals: {
    keywords: ['parrainage', 'recommandation', 'bouche à oreille', 'référence'],
    questions: [
      'Clients avec recommandation client',
      'Qui nous a recommandé le plus de clients ?',
      'Clients ayant fait du bouche à oreille',
      'Meilleurs clients en terme de parrainage'
    ],
    description: 'Liste des clients qui ont recommandé ou parrainé d\'autres clients',
    response_format: 'table',
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          company_name: true,
          notes: true,
        },
      });

      const keywords = ['recommandé par', 'parrainage', 'référé par', 'bouche à oreille'];
      
      const clientsWithReferrals = clients
        .map(client => {
          const hasReferralTerms = client.notes && keywords.some(
            keyword => client.notes?.toLowerCase().includes(keyword.toLowerCase())
          );
          
          if (hasReferralTerms) {
            return {
              id: client.id,
              firstname: client.firstname,
              lastname: client.lastname,
              email: client.email,
              company_name: client.company_name,
              notes: client.notes,
            };
          }
          return null;
        })
        .filter((client): client is NonNullable<typeof client> => client !== null);

      return clientsWithReferrals;
    },
  },

  clients_impacted_by_delays: {
    keywords: ['retard', 'livraison', 'délai', 'impacté'],
    questions: [
      'Clients impactés par des retards de livraison',
      'Projets en retard affectant des clients',
      'Quels clients sont touchés par les retards ?',
      'Retards de projet par client'
    ],
    description: 'Liste des clients dont les projets ont pris du retard',
    response_format: 'table',
    prisma: async () => {
      const today = new Date();
      
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              AND: [
                { end_date: { lt: today } },
                { status: { not: 'termine' } },
              ],
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          company_name: true,
          projects: {
            where: {
              AND: [
                { end_date: { lt: today } },
                { status: { not: 'termine' } },
              ],
            },
            select: {
              name: true,
              reference: true,
              end_date: true,
              status: true,
            },
          },
        },
      });
    },
  },

  clients_with_recent_status_change: {
    keywords: ['changement récent', 'statut', 'modification', 'évolution'],
    questions: [
      'Projets clients avec changement de statut récent',
      'Quels projets ont changé de statut récemment ?',
      'Évolution récente des projets clients',
      'Changements de statut dans le mois'
    ],
    description: 'Liste des clients dont les projets ont récemment changé de statut',
    response_format: 'table',
    prisma: async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              updated_at: {
                gte: oneMonthAgo,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          company_name: true,
          projects: {
            where: {
              updated_at: {
                gte: oneMonthAgo,
              },
            },
            select: {
              name: true,
              reference: true,
              status: true,
              updated_at: true,
            },
          },
        },
      });
    },
  },

  most_demanding_clients: {
    keywords: ['exigeant', 'difficile', 'complexe', 'fastidieux'],
    questions: [
      'Quels sont les clients les plus exigeants ?',
      'Clients les plus difficiles',
      'Clients avec beaucoup de modifications demandées',
      'Clients les plus complexes à gérer'
    ],
    description: 'Liste des clients potentiellement plus exigeants basée sur divers indicateurs',
    response_format: 'table',
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          documents: true,
          events: true,
          projects: {
            include: {
              project_stages: true,
            },
          },
        },
      });

      return clients
        .map(client => {
          // Calcul d'un score d'exigence basé sur divers indicateurs
          const refusedQuotes = client.documents.filter(d => d.type === 'devis' && d.status === 'refuse').length;
          const cancelledProjects = client.projects.filter(p => p.status === 'annule').length;
          const eventCount = client.events.length;
          const projectChanges = client.projects.reduce((sum, p) => sum + p.project_stages.filter(s => s.status === 'en_pause').length, 0);
          
          // Score pondéré
          const demandScore = (refusedQuotes * 3) + (cancelledProjects * 5) + (projectChanges * 2) + (eventCount > 10 ? 2 : 0);
          
          if (demandScore >= 5) {
            return {
              id: client.id,
              firstname: client.firstname,
              lastname: client.lastname,
              company_name: client.company_name,
              phone: client.phone,
              demand_score: demandScore,
              refused_quotes: refusedQuotes,
              cancelled_projects: cancelledProjects,
              interaction_count: eventCount,
            };
          }
          return null;
        })
        .filter((client): client is NonNullable<typeof client> => client !== null)
        .sort((a, b) => b.demand_score - a.demand_score);
    },
  },
  
  recently_added_clients: {
    keywords: ['nouveau', 'récent', 'ajout', 'dernier'],
    questions: [
      'Qui a été le dernier client ajouté ?',
      'Derniers clients enregistrés',
      'Clients récemment créés',
      'Nouveaux clients cette semaine'
    ],
    description: 'Liste des clients les plus récemment ajoutés',
    response_format: 'table',
    prisma: async () => {
      return await prismaService.clients.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          company_name: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 5,
      });
    },
  },

  clients_quarterly_evolution: {
    keywords: ['évolution', 'trimestre', 'croissance', 'statistique'],
    questions: [
      'Évolution du nombre de clients par trimestre',
      'Tendance clients par période',
      'Croissance de notre clientèle',
      'Statistiques clients par trimestre'
    ],
    description: 'Évolution du nombre de clients créés par trimestre',
    response_format: 'table',
    prisma: async (year: string = new Date().getFullYear().toString()) => {
      const yearNum = parseInt(year);
      const targetYear = isNaN(yearNum) ? new Date().getFullYear() : yearNum;
      
      const startDate = new Date(targetYear, 0, 1); // 1er janvier de l'année cible
      const endDate = new Date(targetYear, 11, 31); // 31 décembre de l'année cible
      
      const clients = await prismaService.clients.findMany({
        where: {
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          created_at: true,
        },
      });
      
      // Initialiser les compteurs pour chaque trimestre
      const quarters = [
        { name: 'T1', count: 0 },
        { name: 'T2', count: 0 },
        { name: 'T3', count: 0 },
        { name: 'T4', count: 0 },
      ];
      
      // Compter les clients par trimestre
      clients.forEach(client => {
        if (!client.created_at) return;
        
        const month = client.created_at.getMonth();
        if (month >= 0 && month < 3) quarters[0].count++;
        else if (month >= 3 && month < 6) quarters[1].count++;
        else if (month >= 6 && month < 9) quarters[2].count++;
        else quarters[3].count++;
      });
      
      return {
        year: targetYear,
        quarters: quarters,
        total: clients.length,
      };
    },
    parameters: [
      {
        name: 'YEAR',
        description: 'Année pour laquelle calculer l\'évolution (par défaut: année en cours)',
        optional: true,
      },
    ],
  }
});
