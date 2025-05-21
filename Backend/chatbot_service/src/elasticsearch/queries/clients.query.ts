import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const clientsQueries = {
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
      return await prisma.clients.findMany({
        select: {
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          mobile: true,
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
      return await prisma.clients.findFirst({
        where: {
          OR: [
            { firstname: { contains: client, mode: 'insensitive' } },
            { lastname: { contains: client, mode: 'insensitive' } },
            { company_name: { contains: client, mode: 'insensitive' } },
            { email: { contains: client, mode: 'insensitive' } },
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
      return await prisma.clients.findMany({
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
      return await prisma.clients.findMany({
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

      return await prisma.clients.findMany({
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

      return await prisma.clients.findMany({
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
      return await prisma.clients.findMany({
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
      return await prisma.projects.findMany({
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
      return await prisma.documents.findMany({
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
      return await prisma.clients.findMany({
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
      return await prisma.clients.findMany({
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
      const clients = await prisma.clients.findMany({
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
      const allClients = await prisma.clients.findMany({
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

      return await prisma.clients.findMany({
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
    prisma: async () => {
      return await prisma.clients.findMany({
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
    prisma: async (client: string) => {
      // Cette requête est complexe car nous n'avons pas de table payments directement dans Prisma
      // Nous allons utiliser les documents payés comme approximation des paiements
      return await prisma.documents.findMany({
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
    prisma: async (zip: string) => {
      return await prisma.clients.findMany({
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
      return await prisma.clients.findMany({
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
};
