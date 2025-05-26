import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
      'clients',
      'liste',
      'tous',
      'répertoire',
      'annuaire',
      'afficher',
      'voir',
      'affichage',
      'clientèle',
      'contacts',
      'base clients',
      'clients enregistrés',
      'utilisateurs',
      'acheteurs',
      'consommateurs',
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
      'Qui sont nos clients ?',
      'Montre-moi la liste des clients',
      'Je veux la liste des clients',
      'Donne-moi la liste des clients',
      'Quels clients avons-nous ?',
      'Consulter les clients',
      'Liste complète des clients',
      'Afficher la base client',
      'Montre les clients enregistrés',
      'Quels sont les clients actuels ?',
      'Je souhaite voir nos clients',
      'Peux-tu me lister les clients ?',
      'Qui sont les personnes enregistrées comme clients ?',
      'Affiche tous les contacts clients',
      'Contacts commerciaux enregistrés',
      'Affiche les coordonnées des clients',
      'Quels sont les noms de nos clients ?',
    ],
    prisma: async (options?: { skip?: number; take?: number }) => {
      const { skip = 0, take = 20 } = options || {};
      try {
        return await prismaService.clients.findMany({
          select: {
            id: true,
            firstname: true,
            lastname: true,
            company_name: true,
            email: true,
            phone: true,
            addresses: {
              select: {
                city: true,
                zip_code: true,
                street_name: true,
                street_number: true,
                country: true,
              },
            },
          },
          orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
          skip,
          take,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        return [];
      }
    },
    response_format: 'table',
    description: 'Liste complète des clients avec coordonnées principales',
  },

  client_details: {
    keywords: [
      'client',
      'détail',
      'fiche',
      'information',
      'profil',
      'coordonnées',
      'contact',
      'dossier',
      'identité',
      'infos',
      'recherche',
      'consultation',
    ],
    questions: [
      'Détails du client [CLIENT]',
      'Informations sur [CLIENT]',
      'Fiche client [CLIENT]',
      'Profil de [CLIENT]',
      'Coordonnées de [CLIENT]',
      'Qui est [CLIENT] ?',
      'Infos client [CLIENT]',
      'Contact [CLIENT]',
      'Dossier client [CLIENT]',
      'Montre-moi la fiche de [CLIENT]',
      'Je cherche le client [CLIENT]',
      'Consulter la fiche de [CLIENT]',
      'Accéder au profil de [CLIENT]',
      'Voir les données de [CLIENT]',
      'Affiche-moi les infos de [CLIENT]',
    ],
    prisma: async (client: string | number) => {
      try {
        const whereClause: Prisma.clientsWhereInput =
          typeof client === 'number' || /^\d+$/.test(client as string)
            ? { id: Number(client) }
            : {
                OR: [
                  {
                    firstname: {
                      contains: client as string,
                      mode: 'insensitive',
                    },
                  },
                  {
                    lastname: {
                      contains: client as string,
                      mode: 'insensitive',
                    },
                  },
                  {
                    company_name: {
                      contains: client as string,
                      mode: 'insensitive',
                    },
                  },
                  {
                    email: { contains: client as string, mode: 'insensitive' },
                  },
                  {
                    customer_id: {
                      contains: client as string,
                      mode: 'insensitive',
                    },
                  },
                ],
              };

        const result = await prismaService.clients.findFirst({
          where: whereClause,
          select: {
            id: true,
            firstname: true,
            lastname: true,
            company_name: true,
            email: true,
            phone: true,
            addresses: {
              select: {
                city: true,
                zip_code: true,
                street_name: true,
                street_number: true,
                country: true,
              },
            },
            client_addresses: {
              select: {
                address_type: true,
                addresses: {
                  select: {
                    city: true,
                    zip_code: true,
                    street_name: true,
                    street_number: true,
                    country: true,
                  },
                },
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

        if (!result) return null;

        return {
          ...result,
          nb_projects: Array.isArray(result.projects)
            ? result.projects.length
            : 0,
          nb_documents: Array.isArray(result.documents)
            ? result.documents.length
            : 0,
          nb_events: Array.isArray(result.events) ? result.events.length : 0,
        };
      } catch (error) {
        console.error(
          'Erreur lors de la récupération du détail client:',
          error,
        );
        return null;
      }
    },
    response_format: 'object',
    description:
      'Informations détaillées sur un client spécifique : nom, société, email ou identifiant numérique. Retourne les projets, documents et événements liés.',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom, société, email ou identifiant du client recherché',
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
      'non payé',
      'clients à relancer',
      'échéance dépassée',
      'reliquat',
      'clients en défaut',
    ],
    questions: [
      'Clients avec factures impayées',
      'Factures non réglées par client',
      "Qui n'a pas payé ses factures ?",
      'Clients en retard de paiement',
      'Factures en attente de paiement',
      'Liste des impayés',
      'Quels clients ont des paiements en retard ?',
      'Clients débiteurs à ce jour',
      'Voir les factures non payées',
      'Quels sont les clients à relancer ?',
      'Montre-moi les clients qui doivent encore payer',
      'Factures échues non réglées',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'facture',
              payment_status: 'non_payé',
              due_date: {
                lt: new Date(), // échéance dépassée
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
    description:
      "Liste complète des clients ayant des factures de type 'facture' impayées et arrivées à échéance. Inclut les montants, dates et références.",
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
      'implantation',
      'géolocalisation',
      'agglomération',
      'zone',
      'secteur',
    ],
    questions: [
      'Clients à [CITY]',
      'Quels clients à [CITY] ?',
      'Clients dans la ville de [CITY]',
      'Clientèle à [CITY]',
      'Liste des clients de [CITY]',
      'Clients domiciliés à [CITY]',
      'Qui sont les clients à [CITY] ?',
      'Clients de la ville [CITY]',
      'Trouver les clients à [CITY]',
      'Afficher les clients localisés à [CITY]',
      'Y a-t-il des clients à [CITY] ?',
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
    description:
      'Affiche la liste des clients résidant ou ayant une adresse liée à une ville donnée. Recherche effectuée de façon insensible à la casse.',
    parameters: [
      {
        name: 'CITY',
        description: 'Nom de la ville (partiel ou complet)',
      },
    ],
  },

  recently_active_clients: {
    keywords: [
      'client',
      'actif',
      'activité',
      'récent',
      'dernièrement',
      'interaction',
      'en cours',
      'mise à jour',
      'connecté',
      'modifié',
    ],
    questions: [
      'Clients récemment actifs',
      'Qui a eu une activité récemment ?',
      'Clients actifs les 3 derniers mois',
      'Clients ayant eu des projets récents',
      'Clients avec activité récente',
      'Derniers clients actifs',
      'Liste des clients actifs récemment',
      'Quels clients ont eu des interactions ?',
      'Clients avec projets ou documents récents',
      'Derniers clients en activité',
    ],
    prisma: async () => {
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
      });
    },
    response_format: 'table',
    description:
      'Affiche les clients ayant eu une activité dans les 3 derniers mois : création ou mise à jour de projets, émission de documents ou participation à des événements.',
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
      'liste projets',
      'projets client',
      'chantiers client',
      'travaux client',
      'missions client',
      'afficher projets client',
      'trouver projets client',
      'rechercher projets client',
      'projets par client',
      'projets en cours client',
      'projets terminés client',
      'historique projets client',
      'liste chantiers client',
      'chantiers pour client',
      'jobs client',
      'liste travaux pour client',
      'projets achevés client',
      'projets futurs client',
      'statut projets client',
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
      'Montre-moi les projets de [CLIENT].',
      'Je veux voir les projets du client [CLIENT].',
      'Quels sont les chantiers de [CLIENT] ?',
      'Affiche la liste des projets pour [CLIENT].',
      "Peux-tu me donner l'historique des projets de [CLIENT] ?",
      'Y a-t-il des chantiers en cours pour [CLIENT] ?',
      'Quels projets sont terminés pour [CLIENT] ?',
      'Montre les missions associées à [CLIENT].',
      'Liste les travaux effectués pour [CLIENT].',
      "Quelle est l'activité projet récente de [CLIENT] ?",
      'Je cherche les projets liés à [CLIENT].',
      'Donne-moi la liste complète des projets de [CLIENT].',
      'Pourrais-tu lister les projets du client [CLIENT] ?',
      'Recherche les projets de [CLIENT].',
      'Affiche les projets du client dont le nom est [CLIENT].',
      'Quels sont les statuts des projets de [CLIENT] ?',
      'Montre les projets annulés par [CLIENT].',
      'Y a-t-il des projets futurs planifiés pour [CLIENT] ?',
      'Quels projets sont en préparation pour [CLIENT] ?',
      'Liste les chantiers achevés pour [CLIENT].',
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
      'liste factures',
      'factures client',
      'paiements client',
      'règlements client',
      'afficher factures client',
      'voir factures client',
      'trouver factures client',
      'rechercher factures client',
      'factures par client',
      'factures impayées client',
      'factures payées client',
      'factures en retard client',
      'montant factures client',
      'total factures client',
      'factures récentes client',
      'anciennes factures client',
      'statut factures client',
      'référence facture client',
      'date facture client',
      'factures non payées client',
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
      'Montre-moi les factures de [CLIENT].',
      'Je veux voir les factures du client [CLIENT].',
      'Affiche la liste des factures pour [CLIENT].',
      "Peux-tu me donner l'historique des factures de [CLIENT] ?",
      'Quelles factures sont impayées pour [CLIENT] ?',
      'Montre les paiements effectués par [CLIENT].',
      'Liste les règlements associés à [CLIENT].',
      'Quel est le montant total des factures de [CLIENT] ?',
      'Je cherche les factures impayées de [CLIENT].',
      'Donne-moi la liste complète des factures de [CLIENT].',
      'Pourrais-tu lister les factures du client [CLIENT] ?',
      'Recherche les factures de [CLIENT].',
      'Affiche les factures du client dont le nom est [CLIENT].',
      'Quels sont les statuts des factures de [CLIENT] ?',
      'Montre les factures en retard de [CLIENT].',
      'Y a-t-il des factures récentes pour [CLIENT] ?',
      'Liste les anciennes factures de [CLIENT].',
      'Montre les factures non payées par [CLIENT].',
      'Quel est le statut de la facture [REFERENCE] pour [CLIENT] ?',
      'Quand la facture [REFERENCE] a-t-elle été émise pour [CLIENT] ?',
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
      'projets actifs',
      'chantiers en cours',
      'travaux en cours',
      'missions actives',
      'clients engagés',
      'clients avec projets actifs',
      'liste clients projets actifs',
      'afficher clients projets actifs',
      'voir clients projets actifs',
      'rechercher clients projets actifs',
      'clients avec chantiers en cours',
      'clients ayant projets en cours',
      'clients avec travaux actifs',
      'qui a des chantiers actifs',
      'clients par statut projet actif',
      'clients avec projets non terminés',
      'projets client en cours',
      'chantiers client actifs',
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
      'Montre-moi les clients qui ont des projets en cours.',
      'Je veux voir les clients avec des chantiers actifs.',
      'Affiche la liste des clients ayant des projets actifs.',
      'Peux-tu me donner la liste des clients actuellement engagés dans des projets ?',
      'Qui sont les clients avec une activité de projet en cours ?',
      'Quels clients sont occupés sur des chantiers actuellement ?',
      'Liste les clients avec des travaux en cours.',
      'Montre le portfolio clients avec des projets actifs.',
      'Je cherche les clients ayant des projets non terminés.',
      'Donne-moi la liste des clients avec des chantiers actifs.',
      'Pourrais-tu lister les clients dont les projets sont en cours ?',
      'Recherche les clients avec des projets actifs.',
      'Affiche les clients ayant des travaux en cours.',
      'Quels clients ont des missions actives ?',
      "Montre les clients avec des projets dont le statut est 'en cours'.",
      'Y a-t-il des clients avec de nouveaux projets actifs ?',
      'Liste les clients avec des chantiers qui viennent de démarrer.',
      'Qui sont les clients dont les projets sont en phase active ?',
      'Affiche les clients avec des projets qui ne sont pas encore terminés.',
      'Donne-moi la liste des clients impliqués dans des projets actifs.',
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
    keywords: [
      'sans projet',
      'aucun projet',
      'pas de chantier',
      'clients inactifs projet',
      'clients sans activité projet',
      'clients à relancer projet',
      'clients dormants projet',
      'liste clients sans projet',
      'afficher clients sans projet',
      'voir clients sans projet',
      'rechercher clients sans projet',
      "qui n'ont pas de projets",
      'clients sans projets associés',
      'clients sans travaux',
      'clients sans missions',
      'clients jamais eu de projet',
      'nouveaux clients sans projet',
      'anciens clients sans projet',
      'clients sans activité de projet récente',
    ],
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
      "Montre-moi les clients qui n'ont pas de projets.",
      'Je veux voir les clients sans chantiers.',
      'Affiche la liste des clients sans projet.',
      'Peux-tu me donner la liste des clients inactifs en termes de projets ?',
      'Qui sont les clients sans activité de projet ?',
      "Liste les clients qui n'ont aucun projet associé.",
      'Montre les clients sans travaux en cours ou passés.',
      "Je cherche les clients qui n'ont jamais eu de projet.",
      'Donne-moi la liste complète des clients sans projet.',
      'Pourrais-tu lister les clients sans aucun chantier ?',
      "Recherche les clients qui n'ont pas de projets.",
      'Affiche les clients sans projets du tout.',
      "Quels clients n'ont pas de missions enregistrées ?",
      "Montre les nouveaux clients qui n'ont pas encore de projet.",
      "Y a-t-il des anciens clients qui n'ont plus de projets ?",
      'Liste les clients sans activité de projet récente.',
      'Qui sont les clients dormants sans projet ?',
      "Donne-moi la liste des clients à relancer car ils n'ont pas de projet.",
      'Affiche les clients sans aucun chantier en cours.',
      'Montre les clients sans projets, triés par date de création.',
    ],
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: { none: {} },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      });
    },
    description: "Liste des clients qui n'ont aucun projet associé",
  },

  clients_by_revenue: {
    keywords: [
      'revenu par client',
      "chiffre d'affaires",
      'revenu',
      'CA',
      'facturation',
      'montant',
      'montant total',
      'revenu client',
      'revenu total',
      'revenu annuel',
      'revenu mensuel',
      'revenu trimestriel',
      'chiffre affaires clients',
      'CA clients',
      'revenu clients',
      'classement clients CA',
      'clients rentables',
      'meilleurs clients CA',
      'clients par revenu',
      'volume affaires clients',
      'clients gros CA',
      'clients fort chiffre affaires',
      'top clients revenu',
      'clients importants financièrement',
      'facturation clients élevée',
      'clients à fort potentiel',
      'analyse CA clients',
      'rapport CA clients',
      'performance clients CA',
      'suivi CA clients',
      'tableau CA clients',
      'synthèse CA clients',
    ],
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
      "Montre-moi le classement des clients par chiffre d'affaires.",
      'Je veux voir les clients les plus rentables.',
      'Affiche le top 10 des clients par revenu.',
      "Peux-tu me donner la liste des clients générant le plus de chiffre d'affaires ?",
      'Qui sont nos meilleurs clients en termes financiers ?',
      "Liste les clients avec le plus gros volume d'affaires.",
      'Montre les clients les plus importants financièrement.',
      "Je cherche l'analyse du chiffre d'affaires par client.",
      "Donne-moi le rapport du chiffre d'affaires par client.",
      "Pourrais-tu lister les clients avec un chiffre d'affaires élevé ?",
      'Recherche les clients par revenu.',
      'Affiche les clients les plus rentables selon le CA.',
      'Quels clients ont généré le plus de revenus ce trimestre ?',
      'Montre la performance des clients en termes de CA.',
      'Y a-t-il des clients dont le CA a fortement augmenté ?',
      "Liste les clients à fort potentiel de chiffre d'affaires.",
      'Qui sont les clients avec le plus de facturation ?',
      'Donne-moi une synthèse du CA par client.',
      "Affiche les clients avec un chiffre d'affaires supérieur à [MONTANT] € ?",
      'Quel est le CA généré par le client [CLIENT] ?',
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
      'Montre-moi les clients qui ont plusieurs projets.',
      "Je veux voir les clients avec plus d'un chantier.",
      'Affiche la liste des clients fidèles ayant plusieurs projets.',
      'Peux-tu me donner la liste des clients récurrents avec des projets multiples ?',
      'Qui a plusieurs projets en cours ou terminés ?',
      'Liste les clients avec une forte activité de projet.',
      'Montre le portefeuille clients avec de multiples chantiers.',
      'Je cherche les clients ayant au moins deux projets.',
      'Donne-moi la liste complète des clients avec plusieurs projets.',
      'Pourrais-tu lister les clients qui ont plus de [NOMBRE] projets ?',
      'Recherche les clients avec plusieurs projets associés.',
      'Affiche les clients ayant de nombreux travaux.',
      'Quels clients ont plusieurs missions enregistrées ?',
      'Montre les clients avec une activité soutenue en termes de projets.',
      'Y a-t-il des clients dont la répartition des projets est significative ?',
      'Liste les clients avec des chantiers multiples.',
      'Qui sont les clients les plus fidèles en termes de nombre de projets ?',
      'Donne-moi une analyse des clients multi-projets.',
      'Affiche les clients avec au moins [NOMBRE] projets.',
      'Montre les clients avec plusieurs projets, triés par nombre de projets.',
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
      'clients impayés',
      'clients factures non payées',
      'clients retard paiement',
      'clients débiteurs',
      'clients non réglé',
      'factures non réglées clients',
      'clients à relancer factures',
      'impayés clients liste',
      "qui doit de l'argent",
      'clients mauvais payeurs',
      'risque crédit client',
      'historique paiements client négatif',
      'clients sans règlement enregistré',
      'factures émises non payées',
      'clients avec solde dû',
      'situation paiements clients',
      'clients alerte paiement',
      'recouvrement clients',
      'factures anciennes non payées',
      'suivi impayés clients',
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
      "Montre-moi les clients qui n'ont aucune facture payée.",
      'Je veux voir les clients sans historique de paiement positif.',
      'Affiche la liste des clients à risque financier.',
      'Peux-tu me donner la liste des clients sans facture payée ?',
      "Qui sont les clients qui n'ont jamais effectué de règlement ?",
      "Liste les clients n'ayant effectué aucun paiement.",
      'Montre les clients avec des factures émises mais non payées.',
      'Je cherche les clients avec un solde dû.',
      'Donne-moi la liste complète des clients sans paiement enregistré.',
      "Pourrais-tu lister les clients qui n'ont jamais réglé de facture ?",
      "Recherche les clients avec un historique d'impayés.",
      'Affiche les clients considérés comme mauvais payeurs.',
      'Quels clients sont en situation de risque de crédit ?',
      'Montre les clients sans règlement enregistré.',
      'Y a-t-il des clients avec des factures anciennes toujours impayées ?',
      'Liste les clients nécessitant un suivi pour impayés.',
      'Qui sont les clients en alerte paiement ?',
      'Donne-moi la liste des clients pour le recouvrement.',
      "Affiche les clients qui ont des factures dont le statut est 'non_payé'.",
      'Montre les clients qui ont des factures dues sans paiement.',
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
      'clients à suivre',
      'clients inactifs à relancer',
      'clients sans contact récent',
      'liste clients suivi',
      'afficher clients relancer',
      'voir clients suivi',
      'rechercher clients relance',
      'clients nécessitant attention',
      'clients oubliés',
      'suivi clientèle',
      'plan de relance clients',
      'clients sans interaction',
      'clients peu actifs',
      'identifier clients à relancer',
    ],
    questions: [
      'Quels clients doivent être relancés ?',
      'Clients à recontacter',
      "Qui n'a pas été contacté récemment ?",
      'Liste des clients sans suivi récent',
      'Quels clients nécessitent un suivi ?',
      'Clients sans activité récente mais récents',
      'Montre-moi les clients à relancer.',
      'Je veux voir les clients qui nécessitent un suivi.',
      'Affiche la liste des clients sans contact récent.',
      'Peux-tu me donner la liste des clients inactifs à recontacter ?',
      'Qui sont les clients sans suivi depuis longtemps ?',
      'Liste les clients à qui nous devrions prêter attention.',
      'Montre les clients qui semblent oubliés.',
      'Je cherche les clients pour un plan de relance.',
      'Donne-moi la liste complète des clients à suivre.',
      'Pourrais-tu lister les clients sans aucune interaction récente ?',
      'Recherche les clients peu actifs.',
      'Affiche les clients à identifier pour la relance.',
      "Quels clients ont besoin d'un rappel ?",
      'Montre les clients dont le suivi est nécessaire.',
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
      'clients coordonnées manquantes',
      'clients sans info contact',
      'clients difficiles à joindre',
      'informations contact incomplètes clients',
      'clients à mettre à jour contact',
      'liste clients sans email ou téléphone',
      'afficher clients données manquantes',
      'voir clients contact incomplet',
      'rechercher clients sans coordonnées',
      'qui a contact manquant',
      'vérifier coordonnées clients',
      'clients avec champs contact vides',
      'rapport données manquantes clients',
      'audit informations clients',
    ],
    questions: [
      'Clients sans adresse email',
      'Clients sans téléphone',
      "Qui n'a pas de coordonnées ?",
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
            { phone: { equals: null } },
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
    keywords: [
      'adresses',
      'clients',
      'multiples',
      'plusieurs',
      'domiciles',
      'clients adresses multiples',
      'liste clients adresses multiples',
      'clients avec plusieurs adresses enregistrées',
      "qui a plus d'une adresse",
      'rechercher clients adresses multiples',
      'afficher clients adresses multiples',
      'voir clients adresses multiples',
      'clients avec adresses secondaires',
      'gestion adresses clients multiples',
      'audit adresses clients',
      'rapport clients adresses multiples',
      'clients ayant plusieurs lieux',
      'clients multi-sites',
      'clients avec adresses différentes',
      'identification clients adresses multiples',
      'liste adresses multiples clients',
      'nombre adresses par client',
      'clients avec adresses facturation et livraison différentes',
      'clients avec adresses chantier multiples',
      'clients avec adresses de contact multiples',
    ],
    questions: [
      'Quels clients ont plusieurs adresses ?',
      'Liste des clients avec adresses multiples',
      'Clients avec plusieurs domiciles',
      'Qui a plusieurs adresses ?',
      'Montre-moi les clients qui ont plusieurs adresses enregistrées.',
      'Je veux voir la liste des clients avec adresses multiples.',
      'Affiche les clients possédant plusieurs domiciles.',
      "Peux-tu me donner la liste des clients qui ont plus d'une adresse ?",
      'Qui a plusieurs adresses associées à son compte ?',
      'Liste les clients avec des adresses secondaires.',
      'Montre les clients nécessitant une gestion des adresses multiples.',
      "Je cherche l'audit des adresses clients pour les adresses multiples.",
      'Donne-moi un rapport des clients avec plusieurs adresses.',
      "Pourrais-tu lister les clients ayant plusieurs lieux d'activité ?",
      'Recherche les clients multi-sites.',
      'Affiche les clients avec des adresses différentes.',
      'Quels clients ont une adresse de facturation et de livraison différente ?',
      'Montre les clients avec des adresses de chantier multiples.',
      'Y a-t-il des clients avec plusieurs adresses de contact ?',
      "Donne-moi le nombre d'adresses par client pour les clients avec adresses multiples.",
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
      "Qui n'a pas de projet actif ?",
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
    description: "Clients qui n'ont actuellement aucun projet en cours.",
  },

  clients_with_multiple_contacts: {
    keywords: [
      'contacts',
      'personnes',
      'référents',
      'liens',
      'interlocuteurs',
      'clients multiples contacts',
      'liste clients plusieurs référents',
      "clients avec plus d'un interlocuteur",
      'clients avec plusieurs personnes associées',
      'qui a plusieurs contacts',
      'rechercher clients multiples contacts',
      'afficher clients plusieurs contacts',
      'voir clients multiples interlocuteurs',
      'gestion contacts clients multiples',
      'audit contacts clients',
      'rapport clients plusieurs contacts',
      'clients ayant plusieurs points contact',
      'clients multi-interlocuteurs',
      'identification clients multiples contacts',
      'liste contacts multiples clients',
      'nombre contacts par client',
      'clients avec différents contacts par projet',
      'clients avec contacts facturation et technique différents',
      'clients avec plusieurs rôles contact',
    ],
    questions: [
      'Clients avec plusieurs contacts',
      'Liste des clients avec plusieurs référents',
      "Qui a plus d'un interlocuteur ?",
      'Clients avec plusieurs personnes associées',
      'Montre-moi les clients qui ont plusieurs contacts.',
      'Je veux voir la liste des clients avec plusieurs référents.',
      "Affiche les clients ayant plus d'un interlocuteur.",
      'Peux-tu me donner la liste des clients avec plusieurs personnes associées ?',
      'Qui a plusieurs points de contact dans son entreprise ?',
      'Liste les clients nécessitant une gestion de contacts multiples.',
      'Montre les clients avec des contacts différents selon les projets.',
      "Je cherche l'audit des contacts clients pour les clients multiples.",
      'Donne-moi un rapport des clients avec plusieurs contacts.',
      'Pourrais-tu lister les clients ayant plusieurs rôles de contact définis ?',
      'Recherche les clients multi-interlocuteurs.',
      'Affiche les clients avec des contacts de facturation et techniques différents.',
      'Quels clients ont plusieurs contacts dans leur organisation ?',
      'Montre les clients avec un nombre élevé de contacts.',
      'Y a-t-il des clients avec des informations de contact pour différentes divisions ?',
      'Donne-moi le nombre de contacts enregistrés par client pour les clients avec plusieurs contacts.',
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
      'clients devis récents',
      'derniers devis clients',
      'clients avec proposition commerciale récente',
      'qui a reçu un devis récemment',
      'liste clients devis récent',
      'afficher clients devis récent',
      'voir clients dernier devis',
      'rechercher clients devis récent',
      'clients ayant reçu devis dans le mois',
      'nouveaux devis clients',
      'suivi devis récents clients',
      'rapport devis récents clients',
      'clients avec devis en cours',
      'clients ayant accepté devis récent',
    ],
    questions: [
      'Clients ayant reçu un devis récemment',
      'Derniers devis envoyés aux clients',
      'Clients avec proposition commerciale récente',
      'Qui a reçu un devis récemment ?',
      'Montre-moi les clients ayant reçu un devis récemment.',
      'Je veux voir les derniers devis envoyés aux clients.',
      'Affiche la liste des clients avec une proposition commerciale récente.',
      'Peux-tu me donner la liste des clients qui ont reçu un devis récemment ?',
      'Qui a eu un devis envoyé dans le dernier mois ?',
      'Liste les clients ayant reçu un nouveau devis.',
      'Montre les clients avec un devis en cours.',
      'Je cherche le suivi des devis récents clients.',
      'Donne-moi un rapport des clients avec des devis récents.',
      'Pourrais-tu lister les clients ayant accepté un devis récemment ?',
      'Recherche les clients qui ont reçu leur dernier devis récemment.',
      'Affiche les clients avec une proposition commerciale envoyée récemment.',
      'Quels clients ont un devis récent en attente ?',
      'Montre les clients ayant reçu un devis cette semaine.',
      'Y a-t-il des clients avec plusieurs devis récents ?',
      'Donne-moi les détails des derniers devis envoyés aux clients.',
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
    keywords: [
      'factures',
      'volume',
      'beaucoup',
      'quantité',
      'nombre',
      'clients grand volume facturation',
      'clients avec beaucoup de factures',
      'clients les plus facturés',
      'qui reçoit beaucoup de factures',
      'liste clients volume facturation élevé',
      'afficher clients grand nombre factures',
      'voir clients volume facturation',
      'rechercher clients factures nombreuses',
      'clients avec volume important facturation',
      'analyse volume facturation clients',
      'rapport volume facturation clients',
      'clients avec plus de [NOMBRE] factures',
      'clients par nombre factures',
      'classement clients volume facturation',
      'clients à forte facturation',
      'suivi volume facturation clients',
      'tableau bord volume facturation clients',
      'clients avec beaucoup de factures émises',
      'clients avec volume transaction élevé',
    ],
    questions: [
      'Quels clients ont le plus de factures ?',
      'Clients avec grand volume de facturation',
      'Liste des clients les plus facturés',
      'Qui reçoit beaucoup de factures ?',
      'Montre-moi les clients qui ont le plus de factures.',
      'Je veux voir les clients avec un grand volume de facturation.',
      'Affiche la liste des clients les plus facturés.',
      'Peux-tu me donner la liste des clients qui reçoivent beaucoup de factures ?',
      'Qui a un volume important de facturation ?',
      'Liste les clients avec plus de [NOMBRE] factures.',
      'Montre le classement des clients par volume de facturation.',
      "Je cherche l'analyse du volume de facturation par client.",
      'Donne-moi un rapport du volume de facturation clients.',
      'Pourrais-tu lister les clients à forte facturation ?',
      'Recherche les clients avec un nombre élevé de factures.',
      'Affiche les clients avec beaucoup de factures émises.',
      'Quels clients ont un volume de transaction élevé ?',
      'Montre les clients par nombre de factures.',
      'Y a-t-il des clients avec un volume exceptionnel de facturation ?',
      'Donne-moi la synthèse du volume de facturation clients.',
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
      'clients événements fréquents',
      'clients interactions nombreuses',
      'clients avec beaucoup de rendez-vous',
      "qui a eu beaucoup d'évènements",
      'liste clients événements fréquents',
      'afficher clients interactions',
      'voir clients rendez-vous fréquents',
      'rechercher clients événements fréquents',
      'clients avec forte interaction',
      'clients souvent en contact',
      'suivi événements fréquents clients',
      'rapport événements fréquents clients',
      'clients avec historique interactions riche',
      'clients très engagés',
    ],
    questions: [
      'Clients souvent rencontrés',
      'Clients avec interactions fréquentes',
      'Clients avec le plus de rendez-vous',
      "Qui a eu beaucoup d'évènements ?",
      "Montre-moi les clients qui ont eu beaucoup d'événements.",
      'Je veux voir les clients avec des interactions fréquentes.',
      'Affiche la liste des clients avec le plus de rendez-vous.',
      'Peux-tu me donner la liste des clients souvent rencontrés ?',
      'Qui a une forte interaction avec nous ?',
      "Liste les clients avec un historique d'interactions riche.",
      "Montre les clients très engagés en termes d'événements.",
      'Je cherche le suivi des événements fréquents par client.',
      "Donne-moi un rapport des clients avec beaucoup d'événements.",
      'Pourrais-tu lister les clients avec un grand nombre de rendez-vous ?',
      'Recherche les clients avec des interactions nombreuses.',
      'Affiche les clients qui sont souvent en contact.',
      "Quels clients ont eu le plus d'événements enregistrés ?",
      "Montre les clients avec des interactions fréquentes par type d'événement.",
      "Y a-t-il des clients avec un historique d'événements exceptionnel ?",
      'Donne-moi la synthèse des événements fréquents par client.',
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
                  Math.cos(((longitude - HEADQUARTERS.lon) * Math.PI) / 180),
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
        .filter(
          (client): client is NonNullable<typeof client> => client !== null,
        );
    },
    response_format: 'table',
    description: 'Liste des clients situés à plus de 100km du siège social.',
  },

  clients_without_recent_quotes: {
    keywords: [
      'devis',
      'ancien',
      'manque',
      'jamais reçu',
      'proposition',
      'client',
      'sans devis',
      'pas de devis',
      'devis ancien',
      'proposition commerciale non envoyée',
      'relancer',
      'sans contact devis',
      'pas de proposition récente',
      'aucune offre récente',
      'oubliés devis',
      'clients à cibler devis',
      'clients sans offre récente',
    ],
    questions: [
      'Clients sans devis récent',
      "Qui n'a pas eu de devis depuis 6 mois ?",
      'Clients sans devis envoyé depuis longtemps',
      'Liste des clients oubliés pour les devis',
      "Quels clients n'ont pas reçu de proposition commerciale récemment ?",
      'Liste des clients sans devis émis depuis plus de 6 mois.',
      "Qui sont les clients qui n'ont pas de devis récent ?",
      "Clients à qui on n'a pas envoyé de devis depuis longtemps.",
      'Quels clients sont sans devis récent ?',
      "Recherche les clients qui n'ont pas eu de proposition commerciale depuis longtemps.",
      'Liste les clients qui ont été oubliés pour les devis.',
      'Montre les clients sans activité de devis récente.',
      "Y a-t-il des clients qui n'ont pas reçu de devis au cours des 6 derniers mois ?",
      'Je voudrais voir la liste des clients sans devis récent.',
      'Montre-moi les clients inactifs en termes de devis.',
      "Quels clients n'ont pas eu de proposition commerciale envoyée depuis longtemps ?",
      'Liste des clients à considérer pour une nouvelle offre.',
      "Qui sont les clients qui n'ont aucune offre récente ?",
      'Y a-t-il des clients sans devis émis dans les six derniers mois ?',
      "Quels clients n'ont pas reçu d'offre commerciale récemment ?",
      "Je recherche la liste des clients qui n'ont pas eu de devis récent.",
      "Montre les clients qui n'ont pas reçu de proposition depuis 6 mois.",
      'Liste des clients sans proposition commerciale récente.',
      'Qui sont les clients inactifs concernant les devis récents ?',
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
      "Clients n'ayant reçu aucun devis au cours des 6 derniers mois.",
  },

  clients_with_cancelled_projects: {
    keywords: [
      'annulé',
      'projet',
      'refusé',
      'abandonné',
      'client',
      'chantier annulé',
      'projet client refusé',
      'client projet abandonné',
      'projets annulés client',
      'chantiers refusés par client',
      'qui a annulé un projet',
      'liste projets annulés',
      'afficher projets refusés',
      'voir projets abandonnés',
      'suivi projets annulés',
      'rapport projets annulés',
      'projet stoppé client',
      'fin de projet anticipée client',
      'résiliation projet client',
      'clients ayant mis fin à un projet',
    ],
    questions: [
      'Clients avec projets annulés',
      'Qui a vu ses projets refusés ?',
      'Liste des projets annulés par client',
      'Projets abandonnés par les clients',
      'Quels clients ont eu des chantiers annulés ?',
      'Montre-moi la liste des projets refusés par les clients.',
      'Je veux voir les projets abandonnés par les clients.',
      'Affiche les clients ayant annulé un projet.',
      'Peux-tu me donner la liste des projets annulés pour chaque client ?',
      'Qui sont les clients dont les chantiers ont été refusés ?',
      'Liste les projets clients qui ont été stoppés.',
      'Montre les clients avec une fin de projet anticipée.',
      'Je cherche les clients ayant résilié un projet.',
      'Donne-moi la liste complète des clients avec des projets annulés.',
      'Pourrais-tu lister les clients qui ont abandonné un chantier ?',
      'Recherche les clients avec des projets refusés.',
      'Affiche les clients dont le statut d\'un projet est "annulé".',
      'Quels clients ont eu plusieurs projets annulés ?',
      'Montre les clients par nombre de projets annulés.',
      'Y a-t-il des clients avec un historique de projets refusés ?',
      'Liste les projets annulés récemment par client.',
      "Qui sont les clients à suivre suite à l'annulation d'un projet ?",
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
    keywords: [
      'multi-villes',
      'plusieurs villes',
      'projets dispersés',
      'client',
      'chantiers dans différentes villes',
      'client multi-sites',
      'projets hors siège',
      'activité sur plusieurs localisations',
      'clients géographiquement dispersés',
      'chantiers multiples villes',
      'projets dans plusieurs zones',
      'clients avec adresses de chantier multiples',
      'portefeuille projets multi-villes',
      'suivi clients multi-sites',
    ],
    questions: [
      'Clients avec projets dans plusieurs villes',
      'Liste des clients avec chantiers dispersés',
      'Clients avec chantiers multi-localisés',
      'Qui travaille dans plusieurs villes ?',
      'Quels clients ont des projets actifs dans différentes villes ?',
      'Montre-moi la liste des clients avec des chantiers sur plusieurs sites.',
      "Je veux voir les clients ayant des projets dans plus d'une ville.",
      'Affiche les clients dont les projets sont géographiquement dispersés.',
      'Peux-tu me donner la liste des clients avec des chantiers dans plusieurs localisations ?',
      'Qui sont les clients multi-sites ?',
      'Liste les clients avec des projets en dehors de la ville du siège.',
      'Montre les clients avec une activité sur plusieurs zones géographiques.',
      'Je cherche les clients ayant des adresses de chantier multiples.',
      'Donne-moi la liste complète des clients avec des projets dans plusieurs villes.',
      'Pourrais-tu lister les clients dont le portefeuille projets est multi-villes ?',
      'Recherche les clients avec des chantiers dispersés.',
      'Affiche les clients par nombre de villes où ils ont des projets.',
      'Y a-t-il des clients avec un grand nombre de villes différentes ?',
      'Liste les clients qui nécessitent un suivi multi-sites.',
      'Montre les clients avec des projets dans la ville de [CITY] et une autre ville.',
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
    keywords: [
      'aucun évènement',
      'jamais contacté',
      'zéro interaction',
      'aucune visite',
      'aucun rendez-vous',
      'pas d\'activité',
      'client jamais sollicité',
      'aucune trace d\'événement',
      'client oublié',
      'aucune interaction',
    ],
    questions: [
      'Clients sans événement enregistré',
      'Jamais de contact avec certains clients ?',
      'Clients sans rendez-vous ni visite',
      'Clients oubliés sans évènements',
      'Quels clients n\'ont jamais eu de rendez-vous ?',
      'Liste des clients sans aucune interaction',
      'Qui sont les clients jamais sollicités ?',
      'Montre-moi les clients sans activité événementielle',
      'Quels clients n\'ont aucune trace d\'événement ?',
      'Y a-t-il des clients qui n\'ont jamais eu de visite ou de contact ?',
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
        .filter(
          (client): client is NonNullable<typeof client> => client !== null,
        )
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
    keywords: [
      'sans signature',
      'non signé',
      'document contractuel',
      'contrat',
    ],
    questions: [
      'Clients sans documents contractuels signés',
      "Quels clients n'ont pas signé leurs documents ?",
      'Liste des clients sans signature',
      'Clients avec documents en attente de signature',
    ],
    description: "Liste des clients qui n'ont pas de documents signés",
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
      'Projets clients prévus pour bientôt',
    ],
    description:
      'Liste des clients ayant des projets qui débuteront dans le mois à venir',
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
      'Clients avec beaucoup de refus commerciaux',
    ],
    description:
      'Clients ayant un taux élevé de documents refusés (type devis)',
    response_format: 'table',
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        include: {
          documents: true,
        },
      });

      const clientsWithRejections = clients
        .map((client) => {
          const refusedCount = client.documents.filter(
            (d) => d.type === 'devis' && d.status === 'refuse',
          ).length;
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
        .filter(
          (client): client is NonNullable<typeof client> => client !== null,
        )
        .sort((a, b) => b.refused_count - a.refused_count);

      return clientsWithRejections;
    },
  },

  loyal_clients_by_years: {
    keywords: ['fidèle', 'ancienneté', 'ancien client'],
    questions: [
      'Quels sont les clients les plus anciens ?',
      "Clients avec le plus d'ancienneté",
      'Clients fidèles depuis longtemps',
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
      'Clients sans IBAN',
    ],
    description: "Clients pour lesquels aucune info bancaire n'est renseignée",
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
      'Clients oubliés à relancer',
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
    keywords: [
      'devis sans réponse',
      'sans retour',
      'en attente',
      'non répondu',
    ],
    questions: [
      "Clients n'ayant pas répondu au dernier devis",
      'Devis sans réponse client',
      "Quels clients n'ont pas donné suite à leur devis ?",
      'Devis en attente de réponse client',
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
      "Chantiers en phase d'achèvement",
    ],
    description: "Liste des projets dont l'avancement est supérieur à 80%",
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
        .map((project) => {
          const stagesCount = project.project_stages.length;
          if (stagesCount === 0) return null;

          const avgCompletion =
            project.project_stages.reduce(
              (sum, stage) => sum + (stage.completion_percentage || 0),
              0,
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
        .filter(
          (project): project is NonNullable<typeof project> => project !== null,
        );
    },
  },

  clients_with_paused_projects: {
    keywords: ['arrêt temporaire', 'pause', 'suspendu', 'en attente'],
    questions: [
      'Clients dont les projets ont été stoppés temporairement',
      'Projets en pause',
      'Chantiers suspendus',
      "Quels projets sont actuellement à l'arrêt ?",
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
      "Qui n'a pas travaillé avec nous depuis des années ?",
      'Anciens clients sans activité récente',
    ],
    description: 'Liste des clients inactifs depuis une période spécifiée',
    response_format: 'table',
    prisma: async (years: string = '2') => {
      const yearsNum = parseInt(years);
      const cutoffDate = new Date();
      cutoffDate.setFullYear(
        cutoffDate.getFullYear() - (isNaN(yearsNum) ? 2 : yearsNum),
      );

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
        description: "Nombre d'années d'inactivité (par défaut: 2)",
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
      'Meilleurs clients en terme de parrainage',
    ],
    description:
      "Liste des clients qui ont recommandé ou parrainé d'autres clients",
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

      const keywords = [
        'recommandé par',
        'parrainage',
        'référé par',
        'bouche à oreille',
      ];

      const clientsWithReferrals = clients
        .map((client) => {
          const hasReferralTerms =
            client.notes &&
            keywords.some((keyword) =>
              client.notes?.toLowerCase().includes(keyword.toLowerCase()),
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
        .filter(
          (client): client is NonNullable<typeof client> => client !== null,
        );

      return clientsWithReferrals;
    },
  },

  clients_impacted_by_delays: {
    keywords: ['retard', 'livraison', 'délai', 'impacté'],
    questions: [
      'Clients impactés par des retards de livraison',
      'Projets en retard affectant des clients',
      'Quels clients sont touchés par les retards ?',
      'Retards de projet par client',
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
      'Changements de statut dans le mois',
    ],
    description:
      'Liste des clients dont les projets ont récemment changé de statut',
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
      'Clients les plus complexes à gérer',
    ],
    description:
      'Liste des clients potentiellement plus exigeants basée sur divers indicateurs',
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
        .map((client) => {
          // Calcul d'un score d'exigence basé sur divers indicateurs
          const refusedQuotes = client.documents.filter(
            (d) => d.type === 'devis' && d.status === 'refuse',
          ).length;
          const cancelledProjects = client.projects.filter(
            (p) => p.status === 'annule',
          ).length;
          const eventCount = client.events.length;
          const projectChanges = client.projects.reduce(
            (sum, p) =>
              sum +
              p.project_stages.filter((s) => s.status === 'en_pause').length,
            0,
          );

          // Score pondéré
          const demandScore =
            refusedQuotes * 3 +
            cancelledProjects * 5 +
            projectChanges * 2 +
            (eventCount > 10 ? 2 : 0);

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
        .filter(
          (client): client is NonNullable<typeof client> => client !== null,
        )
        .sort((a, b) => b.demand_score - a.demand_score);
    },
  },

  recently_added_clients: {
    keywords: ['nouveau', 'récent', 'ajout', 'dernier'],
    questions: [
      'Qui a été le dernier client ajouté ?',
      'Derniers clients enregistrés',
      'Clients récemment créés',
      'Nouveaux clients cette semaine',
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
      'Statistiques clients par trimestre',
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
      clients.forEach((client) => {
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
        description:
          "Année pour laquelle calculer l'évolution (par défaut: année en cours)",
        optional: true,
      },
    ],
  },

  // 1. Requêtes basées sur les documents clients :

  clients_by_document_type: {
    keywords: [
      'document',
      'type',
      'bon de commande',
      'fiche technique',
      'plan',
      'client',
    ],
    questions: [
      'Quels clients ont reçu un [DOCUMENT_TYPE] ?',
      'Liste des clients avec [DOCUMENT_TYPE]',
    ],
    description: 'Liste des clients associés à un type de document donné.',
    parameters: [
      {
        name: 'DOCUMENT_TYPE',
        description:
          'Type de document (ex: devis, facture, bon_de_commande, etc.)',
      },
    ],
    prisma: async (documentType: string) => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: documentType as any,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: { type: documentType as any },
            select: { reference: true, issue_date: true, status: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_by_document_status: {
    keywords: [
      'document',
      'statut',
      'valide',
      'refuse',
      'annule',
      'en attente',
      'client',
    ],
    questions: [
      'Clients avec [DOCUMENT_TYPE] au statut [DOCUMENT_STATUS]',
      'Liste des [DOCUMENT_TYPE] [DOCUMENT_STATUS] par client',
    ],
    description:
      'Liste des clients ayant un certain type de document avec un statut spécifique.',
    parameters: [
      {
        name: 'DOCUMENT_TYPE',
        description: 'Type de document',
      },
      {
        name: 'DOCUMENT_STATUS',
        description: 'Statut du document (ex: valide, refuse, annule, etc.)',
      },
    ],
    prisma: async (documentType: string, documentStatus: string) => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: documentType as any,
              status: documentStatus as any,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: { type: documentType as any, status: documentStatus as any },
            select: { reference: true, issue_date: true, amount: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_partially_paid_invoices: {
    keywords: ['facture', 'paiement partiel', 'reste à payer', 'client'],
    questions: [
      'Quels clients ont des factures partiellement payées ?',
      'Factures avec solde dû par client',
    ],
    description:
      'Liste des clients avec des factures qui ne sont ni entièrement payées, ni non payées (solde restant).',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'facture',
              payment_status: { not: 'paye' },
              amount_paid: { gt: 0 },
              // Ne peut pas comparer directement les champs dans where, la logique de solde est dans le SELECT ou post-requête si nécessaire pour affichage
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: {
              type: 'facture',
              payment_status: { not: 'paye' },
              amount_paid: { gt: 0 },
              // amount: { gt: prismaService.documents.fields.amount_paid }, // Cette comparaison n'est pas possible ici
            },
            select: {
              reference: true,
              issue_date: true,
              amount: true,
              amount_paid: true,
              balance_due: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  client_total_quotes: {
    keywords: [
      'total devis',
      'estimation',
      'proposition commerciale',
      'client',
    ],
    questions: [
      'Quel est le total des devis pour le client [CLIENT] ?',
      'Somme des devis du client [CLIENT]',
    ],
    description:
      'Calcule le montant total de tous les devis pour un client spécifique.',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom, email ou ID du client',
      },
    ],
    prisma: async (client: string) => {
      const result = await prismaService.documents.aggregate({
        _sum: { amount: true },
        where: {
          type: 'devis',
          projects: {
            clients: {
              OR: [
                { firstname: { contains: client, mode: 'insensitive' } },
                { lastname: { contains: client, mode: 'insensitive' } },
                { email: { contains: client, mode: 'insensitive' } },
                { id: parseInt(client) || undefined }, // Handle potential non-numeric input
              ],
            },
          },
        },
      });
      return { client: client, total_devis_amount: result._sum.amount };
    },
    response_format: 'object',
  },

  // 2. Requêtes basées sur les projets clients :

  clients_by_project_status: {
    keywords: [
      'projet',
      'chantier',
      'statut',
      'en préparation',
      'terminé',
      'client',
    ],
    questions: [
      'Quels clients ont des projets [PROJECT_STATUS] ?',
      'Liste des chantiers [PROJECT_STATUS] par client',
    ],
    description:
      'Liste des clients ayant au moins un projet avec un statut donné.',
    parameters: [
      {
        name: 'PROJECT_STATUS',
        description: 'Statut du projet (ex: en_cours, terminé, annulé, etc.)',
      },
    ],
    prisma: async (projectStatus: string) => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              status: projectStatus as any,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: { status: projectStatus as any },
            select: {
              name: true,
              reference: true,
              start_date: true,
              end_date: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_projects_completed_in_period: {
    keywords: [
      'projet terminé',
      'chantier fini',
      'période',
      'achevé',
      'client',
    ],
    questions: [
      'Clients avec projets terminés [PERIOD]',
      'Projets achevés pour les clients durant [PERIOD]',
    ],
    description:
      'Liste des clients ayant terminé un projet sur une période donnée.',
    parameters: [
      {
        name: 'PERIOD',
        description: 'Période (ex: ce mois-ci, ce trimestre, cette année)',
      },
    ],
    prisma: async (period: string) => {
      // @TODO: Implémenter la logique de calcul des dates limites en fonction de 'period'
      const startDate = new Date(); // Placeholder
      const endDate = new Date(); // Placeholder

      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              status: 'termine',
              end_date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: {
              status: 'termine',
              end_date: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: { name: true, reference: true, end_date: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_by_payment_method: {
    keywords: [
      'paiement',
      'méthode',
      'client',
      'règlement',
      'mode de paiement',
    ],
    questions: [
      'Quels clients utilisent le mode de paiement [METHOD] ?',
      'Clients ayant payé par [METHOD]',
      'Liste des clients par mode de paiement [METHOD]',
    ],
    description:
      'Liste des clients ayant utilisé un mode de paiement spécifique pour au moins un document.',
    parameters: [
      {
        name: 'METHOD',
        description:
          'Mode de paiement (ex: carte_bancaire, virement, chèque, etc.)',
      },
    ],
    prisma: async (method: string) => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              payment_method: { contains: method, mode: 'insensitive' },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: {
              payment_method: { contains: method, mode: 'insensitive' },
            },
            select: { reference: true, issue_date: true, payment_method: true },
            take: 1, // Show at least one document using this method
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_discounts_by_document_type: {
    keywords: ['remise', 'devis', 'facture', 'client'],
    questions: [
      'Clients avec remises importantes sur [DOCUMENT_TYPE]',
      'Remises cumulées par client sur [DOCUMENT_TYPE]',
    ],
    description:
      'Liste des clients ayant bénéficié de remises importantes sur un type de document spécifique.',
    parameters: [
      {
        name: 'DOCUMENT_TYPE',
        description: 'Type de document (ex: devis, facture)',
      },
    ],
    prisma: async (documentType: string) => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: documentType as any,
              discount_amount: { gt: 0 },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: { type: documentType as any, discount_amount: { gt: 0 } },
            select: {
              reference: true,
              issue_date: true,
              amount: true,
              discount_amount: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_accepted_quotes_in_period: {
    keywords: ['devis', 'accepté', 'période', 'client'],
    questions: [
      'Clients avec devis acceptés [PERIOD]',
      'Devis acceptés par client [PERIOD]',
    ],
    description: 'Liste des clients dont un devis a été accepté récemment.',
    parameters: [
      {
        name: 'PERIOD',
        description: 'Période (ex: ce mois-ci, ce trimestre, cette année)',
      },
    ],
    prisma: async (period: string) => {
      // @TODO: Implémenter la logique de calcul des dates limites en fonction de 'period'
      const startDate = new Date(); // Placeholder
      const endDate = new Date(); // Placeholder

      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'devis',
              status: 'valide',
              signed_date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: {
              type: 'devis',
              status: 'valide',
              signed_date: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: { reference: true, signed_date: true, amount: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_frequent_events_of_type: {
    keywords: ['événement', 'fréquent', 'type', 'client'],
    questions: [
      "Clients avec beaucoup d'événements de type [EVENT_TYPE]",
      "Clients avec un grand nombre d'[EVENT_TYPE]",
    ],
    description:
      "Liste des clients qui ont eu un grand nombre d'événements d'un certain type.",
    parameters: [
      {
        name: 'EVENT_TYPE',
        description:
          "Type d'événement (ex: appel téléphonique, visite technique)",
      },
    ],
    prisma: async (eventType: string) => {
      return await prismaService.clients.findMany({
        where: {
          events: {
            some: {
              event_type: eventType as any,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          events: {
            where: { event_type: eventType as any },
            select: { event_type: true, start_date: true, description: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_by_project_status_in_period: {
    keywords: ['projet', 'statut', 'période', 'client'],
    questions: [
      'Clients dont des projets sont passés au statut [PROJECT_STATUS] [PERIOD]',
      'Projets [PROJECT_STATUS] pour les clients [PERIOD]',
    ],
    description:
      'Liste des clients dont des projets ont changé de statut sur une période donnée.',
    parameters: [
      {
        name: 'PROJECT_STATUS',
        description: 'Statut du projet (ex: en_cours, terminé, annulé)',
      },
      {
        name: 'PERIOD',
        description: 'Période (ex: ce mois-ci, ce trimestre, cette année)',
      },
    ],
    prisma: async (projectStatus: string, period: string) => {
      // @TODO: Implémenter la logique de calcul des dates limites en fonction de 'period'
      const startDate = new Date(); // Placeholder
      const endDate = new Date(); // Placeholder

      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              status: projectStatus as any,
              updated_at: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: {
              status: projectStatus as any,
              updated_at: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: { name: true, reference: true, updated_at: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_without_default_invoice_address: {
    keywords: ['facturation', 'adresse', 'défaut', 'client'],
    questions: [
      'Clients sans adresse de facturation par défaut',
      "Qui n'a pas d'adresse de facturation par défaut ?",
    ],
    description:
      "Liste des clients pour lesquels l'adresse de facturation par défaut n'est pas définie.",
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          client_addresses: {
            none: {
              is_default: true,
              address_type: 'facturation',
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_by_project_reference: {
    keywords: ['projet', 'référence', 'client'],
    questions: [
      'Clients associés au projet [PROJECT_REFERENCE]',
      'Qui est associé au projet [PROJECT_REFERENCE] ?',
    ],
    description:
      "Recherche un client en fournissant la référence d'un de ses projets.",
    parameters: [
      {
        name: 'PROJECT_REFERENCE',
        description: 'Référence du projet',
      },
    ],
    prisma: async (projectReference: string) => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              reference: projectReference,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: { reference: projectReference },
            select: {
              name: true,
              reference: true,
              start_date: true,
              end_date: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_site_reports: {
    keywords: ['rapport', 'chantier', 'ouvert', 'client'],
    questions: [
      'Clients avec des rapports de chantier ouverts',
      'Qui a des rapports de chantier en cours ?',
    ],
    description:
      'Liste des clients dont les projets ou étapes sont associés à des rapports de chantier avec un statut "ouvert".',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              project_stages: {
                some: {
                  site_reports: {
                    some: {
                      status: 'ouvert',
                    },
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
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: {
              project_stages: {
                some: {
                  site_reports: {
                    some: {
                      status: 'ouvert',
                    },
                  },
                },
              },
            },
            select: {
              name: true,
              reference: true,
              project_stages: {
                where: {
                  site_reports: {
                    some: {
                      status: 'ouvert',
                    },
                  },
                },
                select: {
                  name: true,
                  site_reports: {
                    where: {
                      status: 'ouvert',
                    },
                    select: {
                      description: true,
                      created_at: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_low_budget_projects: {
    keywords: ['budget', 'faible', 'projet', 'client'],
    questions: [
      'Clients avec des projets à budget faible',
      'Qui a des projets avec un budget inférieur à [BUDGET] ?',
    ],
    description: 'Liste des clients dont les projets ont un budget faible.',
    parameters: [
      {
        name: 'BUDGET',
        description: 'Budget maximum (par défaut: 10000)',
        optional: true,
      },
    ],
    prisma: async (budget: string = '10000') => {
      const budgetNum = parseInt(budget);
      const maxBudget = isNaN(budgetNum) ? 10000 : budgetNum;

      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              budget: { lt: maxBudget },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: {
              budget: { lt: maxBudget },
            },
            select: {
              name: true,
              reference: true,
              budget: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_without_customer_id: {
    keywords: ['customer_id', 'manquant', 'client'],
    questions: ['Clients sans customer_id', "Qui n'a pas de customer_id ?"],
    description:
      "Liste des clients pour lesquels le champ customer_id n'est pas défini.",
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          customer_id: null,
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_recently_updated: {
    keywords: ['récent', 'mis à jour', 'modifié', 'client'],
    questions: [
      'Clients récemment mis à jour',
      'Qui a été modifié récemment ?',
    ],
    description:
      'Liste des clients dont la fiche a été mise à jour récemment (par exemple, dans les 30 derniers jours).',
    prisma: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      return await prismaService.clients.findMany({
        where: {
          updated_at: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          updated_at: true,
        },
        orderBy: { updated_at: 'desc' },
      });
    },
    response_format: 'table',
  },

  clients_with_high_budget_projects: {
    keywords: ['projet', 'budget', 'coût', 'dépasse', 'client', 'élevé'],
    questions: [
      'Quels clients ont des projets dont le budget dépasse [AMOUNT] € ?',
      'Projets clients avec budget élevé',
    ],
    description:
      'Liste des clients ayant au moins un projet dont le budget est supérieur à un montant spécifié.',
    parameters: [
      {
        name: 'AMOUNT',
        description: 'Montant numérique du budget minimum',
      },
    ],
    prisma: async (amount: number) => {
      return await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              budget: { gt: amount },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            where: { budget: { gt: amount } },
            select: { name: true, reference: true, budget: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  // 3. Requêtes basées sur les événements clients :

  clients_by_event_type: {
    keywords: [
      'événement',
      'rdv',
      'type',
      'réunion chantier',
      'visite technique',
      'client',
      'interaction',
    ],
    questions: [
      'Quels clients ont eu un événement de type [EVENT_TYPE] ?',
      'Liste des clients avec [EVENT_TYPE]',
      'Clients avec événement [EVENT_TYPE]',
    ],
    description: "Liste des clients associés à un type d'événement donné.",
    parameters: [
      {
        name: 'EVENT_TYPE',
        description:
          "Type d'événement (ex: appel_telephonique, reunion_chantier, visite_technique, etc.)",
      },
    ],
    prisma: async (eventType: string) => {
      return await prismaService.clients.findMany({
        where: {
          events: {
            some: {
              event_type: eventType as any,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          events: {
            where: { event_type: eventType as any },
            select: { title: true, start_date: true, location: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_events_in_period: {
    keywords: [
      'événement',
      'rdv',
      'période',
      'contact',
      'client',
      'interaction',
    ],
    questions: [
      'Clients avec événements [PERIOD]',
      'Quels clients ont eu des rendez-vous [PERIOD] ?',
      'Liste des interactions clients sur [PERIOD]',
    ],
    description:
      'Liste des clients ayant eu au moins un événement enregistré sur une période donnée.',
    parameters: [
      {
        name: 'PERIOD',
        description:
          "Période (ex: la semaine dernière, le mois dernier, l'année dernière)",
      },
    ],
    prisma: async (period: string) => {
      // @TODO: Implémenter la logique de calcul des dates limites en fonction de 'period'
      const startDate = new Date(); // Placeholder
      const endDate = new Date(); // Placeholder

      return await prismaService.clients.findMany({
        where: {
          events: {
            some: {
              start_date: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          events: {
            where: {
              start_date: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: { title: true, start_date: true, event_type: true },
            orderBy: { start_date: 'desc' },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_future_events: {
    keywords: [
      'événement',
      'rdv',
      'futur',
      'à venir',
      'planifié',
      'client',
      'prochain',
    ],
    questions: [
      'Quels clients ont des événements à venir ?',
      'Clients avec des rendez-vous planifiés',
      'Liste des clients avec des événements futurs',
      'Qui a un événement planifié bientôt ?',
    ],
    description:
      'Liste des clients ayant au moins un événement dont la date de début est dans le futur.',
    prisma: async () => {
      const now = new Date();
      return await prismaService.clients.findMany({
        where: {
          events: {
            some: {
              start_date: { gt: now },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          events: {
            where: { start_date: { gt: now } },
            select: {
              title: true,
              start_date: true,
              event_type: true,
              location: true,
            },
            orderBy: { start_date: 'asc' },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  // 4. Requêtes basées sur les adresses clients :

  clients_by_address_type: {
    keywords: [
      'adresse',
      'type',
      'facturation',
      'livraison',
      'chantier',
      'client',
      'domicile',
      'siège social',
    ],
    questions: [
      'Quels clients ont une adresse de type [ADDRESS_TYPE] ?',
      'Liste des clients avec une adresse de [ADDRESS_TYPE]',
      'Clients avec adresse [ADDRESS_TYPE]',
    ],
    description: "Liste des clients associés à un type d'adresse spécifique.",
    parameters: [
      {
        name: 'ADDRESS_TYPE',
        description:
          "Type d'adresse (ex: facturation, livraison, chantier, domicile, etc.)",
      },
    ],
    prisma: async (addressType: string) => {
      return await prismaService.clients.findMany({
        where: {
          client_addresses: {
            some: {
              address_type: addressType as any,
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          client_addresses: {
            where: { address_type: addressType as any },
            select: { addresses: true, address_type: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_by_street_name: {
    keywords: ['adresse', 'rue', 'habite', 'client', 'localisé', 'réside'],
    questions: [
      'Quels clients habitent rue [STREET_NAME] ?',
      'Clients dans la rue [STREET_NAME]',
      'Clients résidant rue [STREET_NAME]',
    ],
    description:
      'Liste des clients ayant une adresse principale ou secondaire dans une rue spécifiée.',
    parameters: [
      {
        name: 'STREET_NAME',
        description: 'Nom de la rue',
      },
    ],
    prisma: async (streetName: string) => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            {
              addresses: {
                street_name: { contains: streetName, mode: 'insensitive' },
              },
            },
            {
              client_addresses: {
                some: {
                  addresses: {
                    street_name: { contains: streetName, mode: 'insensitive' },
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
          company_name: true,
          email: true,
          phone: true,
          addresses: {
            select: { street_number: true, street_name: true, city: true },
          },
          client_addresses: {
            select: {
              addresses: {
                select: { street_number: true, street_name: true, city: true },
              },
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  // 5. Requêtes basées sur l'ancienneté et l'activité :

  clients_created_before_date: {
    keywords: [
      'ancienneté',
      'avant',
      'date de création',
      'client',
      'enregistré',
      'créé',
    ],
    questions: [
      'Quels clients ont été créés avant le [DATE] ?',
      'Clients enregistrés avant le [DATE]',
      'Clients créés avant le [DATE]',
    ],
    description:
      'Liste des clients dont la date de création est antérieure à une date donnée.',
    parameters: [
      {
        name: 'DATE',
        description: 'Date limite (format: AAAA-MM-JJ)',
      },
    ],
    prisma: async (date: string) => {
      const cutoffDate = new Date(date);
      return await prismaService.clients.findMany({
        where: {
          created_at: { lt: cutoffDate },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
      });
    },
    response_format: 'table',
  },

  clients_without_any_documents: {
    keywords: [
      'sans document',
      'pas de devis',
      'pas de facture',
      'client vide',
      'aucun document',
    ],
    questions: [
      "Quels clients n'ont aucun document associé ?",
      'Liste des clients sans document',
      'Clients sans aucun document',
    ],
    description:
      'Liste des clients qui ne sont associés à aucun devis, facture ou autre document.',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: { none: {} },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
      });
    },
    response_format: 'table',
  },

  // 6. Requêtes basées sur les interactions avec le personnel :

  clients_by_staff_association: {
    keywords: [
      'associé',
      'personnel',
      'employé',
      'géré par',
      'client',
      'impliquant',
    ],
    questions: [
      'Quels clients sont gérés par [STAFF_NAME] ?',
      'Clients associés à [STAFF_NAME]',
      'Liste des clients avec des projets ou événements impliquant [STAFF_NAME]',
    ],
    description:
      'Liste des clients ayant des projets ou des événements auxquels un membre du personnel spécifique est associé.',
    parameters: [
      {
        name: 'STAFF_NAME',
        description: 'Nom ou prénom du membre du personnel',
      },
    ],
    prisma: async (staffName: string) => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            {
              projects: {
                some: {
                  project_staff: {
                    some: {
                      staff: {
                        OR: [
                          {
                            firstname: {
                              contains: staffName,
                              mode: 'insensitive',
                            },
                          },
                          {
                            lastname: {
                              contains: staffName,
                              mode: 'insensitive',
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            {
              events: {
                some: {
                  staff: {
                    OR: [
                      {
                        firstname: { contains: staffName, mode: 'insensitive' },
                      },
                      {
                        lastname: { contains: staffName, mode: 'insensitive' },
                      },
                    ],
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
          company_name: true,
          email: true,
          phone: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  // 7. Requêtes basées sur les notes clients :

  clients_by_notes_keyword: {
    keywords: [
      'note',
      'commentaire',
      'mot clé',
      'spécifique',
      'client',
      'mentionne',
    ],
    questions: [
      'Clients dont les notes mentionnent [KEYWORD]',
      'Liste des clients avec le mot [KEYWORD] dans leurs notes',
      'Qui a le mot [KEYWORD] dans ses notes ?',
    ],
    description:
      'Liste des clients dont le champ "notes" contient un mot-clé spécifique.',
    parameters: [
      {
        name: 'KEYWORD',
        description: 'Mot-clé à rechercher dans les notes',
      },
    ],
    prisma: async (keyword: string) => {
      return await prismaService.clients.findMany({
        where: {
          notes: { contains: keyword, mode: 'insensitive' },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          notes: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  // 8. Requêtes combinées ou avancées :

  clients_with_accepted_quotes_no_project: {
    keywords: [
      'devis accepté',
      'pas de projet',
      'en attente',
      'client',
      'validé',
      'sans chantier',
    ],
    questions: [
      'Quels clients ont un devis accepté mais pas de projet démarré ?',
      'Clients avec devis validés sans chantier en cours',
      'Liste des clients avec devis accepté mais pas de projet associé',
    ],
    description:
      'Liste des clients ayant au moins un devis accepté mais aucun projet avec un statut indiquant un démarrage (en_cours, en_preparation, en_pause).',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'devis',
              status: 'valide',
            },
          },
          NOT: {
            projects: {
              some: {
                status: { in: ['en_preparation', 'en_cours', 'en_pause'] },
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: { type: 'devis', status: 'valide' },
            select: { reference: true, issue_date: true },
          },
          projects: {
            select: { name: true, status: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_significant_payment_delay: {
    keywords: [
      'retard paiement',
      'impayé répété',
      'mauvais payeur',
      'client',
      'facture en retard',
      'historique impayés',
    ],
    questions: [
      'Quels clients ont un historique de retards de paiement ?',
      'Clients ayant souvent des factures en retard',
      'Liste des clients avec historique de retards de paiement importants',
    ],
    description:
      'Identifier les clients ayant eu un certain nombre (par exemple, 2 ou plus) de factures avec un statut de paiement "non_payé" au-delà de leur date d\'échéance.',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: 'facture',
              payment_status: 'non_payé',
              due_date: { lt: new Date() },
            },
          },
        },
        include: {
          documents: {
            where: {
              type: 'facture',
              payment_status: 'non_payé',
              due_date: { lt: new Date() },
            },
            select: { reference: true, due_date: true, amount: true },
          },
        },
      });
    },
    response_format: 'table',
  },

  clients_with_at_risk_projects: {
    keywords: [
      'projet en retard',
      'avancement faible',
      'date limite proche',
      'client',
      'risque retard',
      'progression lente',
    ],
    questions: [
      "Quels clients ont des projets avec peu d'avancement et une date de fin proche ?",
      'Projets clients avec risque de retard et faible progression',
      'Clients avec projets potentiellement en retard et peu avancés',
    ],
    description:
      "Liste des clients ayant des projets dont la date de fin est dans les 30 prochains jours et dont l'avancement moyen des étapes est inférieur à 50%.",
    prisma: async () => {
      const now = new Date();
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(now.getDate() + 30);

      const projects = await prismaService.projects.findMany({
        where: {
          end_date: {
            gte: now,
            lte: thirtyDaysLater,
          },
          status: { not: 'termine' },
        },
        include: {
          clients: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              company_name: true,
              email: true,
              phone: true,
            },
          },
          project_stages: {
            select: { completion_percentage: true },
          },
        },
      });

      const clientsWithAtRiskProjects = projects
        .filter((project) => {
          const stagesCount = project.project_stages.length;
          if (stagesCount === 0) return false;
          const avgCompletion =
            project.project_stages.reduce(
              (sum, stage) => sum + (stage.completion_percentage || 0),
              0,
            ) / stagesCount;
          return avgCompletion < 50;
        })
        .map((project) => project.clients);

      const uniqueClientsMap = new Map<number, any>();
      clientsWithAtRiskProjects.forEach((client) => {
        if (client) {
          // Ensure client is not null
          uniqueClientsMap.set(client.id, client);
        }
      });

      return Array.from(uniqueClientsMap.values());
    },
    response_format: 'table',
  },

  // 9. Requêtes basées sur des critères combinés ou spécifiques :

  clients_with_discounts_on_document_type: {
    keywords: ['remise', 'devis', 'facture', 'client'],
    questions: [
      'Clients ayant reçu une remise sur un [DOCUMENT_TYPE]',
      'Liste des clients avec remises sur [DOCUMENT_TYPE]',
    ],
    description:
      "Liste des clients ayant bénéficié d'une remise sur un type de document spécifique.",
    parameters: [
      {
        name: 'DOCUMENT_TYPE',
        description: 'Type de document (ex: devis, facture)',
      },
    ],
    prisma: async (documentType: string) => {
      return await prismaService.clients.findMany({
        where: {
          documents: {
            some: {
              type: documentType as any,
              discount_amount: { gt: 0 },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          documents: {
            where: { type: documentType as any, discount_amount: { gt: 0 } },
            select: {
              reference: true,
              issue_date: true,
              amount: true,
              discount_amount: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  clients_with_frequent_events_by_type: {
    keywords: ['événement', 'fréquent', 'type', 'interaction', 'beaucoup'],
    questions: [
      "Clients avec beaucoup d'événements de type [EVENT_TYPE]",
      'Qui a eu beaucoup de [EVENT_TYPE] ?',
    ],
    description:
      "Liste des clients ayant un nombre élevé d'événements d'un type spécifique.",
    parameters: [
      {
        name: 'EVENT_TYPE',
        description:
          "Type d'événement (ex: appel_telephonique, reunion_chantier)",
      },
    ],
    prisma: async (eventType: string) => {
      const clients = await prismaService.clients.findMany({
        include: {
          events: {
            where: { event_type: eventType as any },
            select: { id: true },
          },
        },
      });

      // Filter clients with more than a certain number of events of this type (e.g., > 3)
      const clientsWithFrequentEvents = clients
        .filter((client) => client.events.length > 3) // Threshold can be adjusted
        .map((client) => ({
          id: client.id,
          firstname: client.firstname,
          lastname: client.lastname,
          company_name: client.company_name,
          email: client.email,
          phone: client.phone,
          event_count: client.events.length,
        }))
        .sort((a, b) => b.event_count - a.event_count);

      return clientsWithFrequentEvents;
    },
    response_format: 'table',
  },

  clients_without_default_billing_address: {
    keywords: ['adresse facturation', 'par défaut', 'manquante', 'client'],
    questions: [
      'Clients sans adresse de facturation par défaut',
      "Qui n'a pas d'adresse de facturation principale ?",
    ],
    description:
      "Liste des clients pour lesquels aucune adresse de facturation par défaut n'est définie.",
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          client_addresses: {
            none: {
              OR: [
                { address_type: 'facturation' as any, is_default: true },
                { address_type: 'facturation' as any, is_default: null }, // Consider null as not default
              ],
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          client_addresses: {
            select: { address_type: true, is_default: true, addresses: true },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },

  client_by_project_reference: {
    keywords: ['projet', 'référence', 'client', 'associé à'],
    questions: [
      'Quel client est associé au projet [REFERENCE] ?',
      'Client du projet [REFERENCE]',
    ],
    description:
      'Trouve le client associé à un projet spécifique en utilisant la référence du projet.',
    parameters: [
      {
        name: 'REFERENCE',
        description: 'Référence du projet',
      },
    ],
    prisma: async (reference: string) => {
      const project = await prismaService.projects.findUnique({
        where: { reference: reference },
        select: {
          clients: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              company_name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
      return project ? project.clients : null; // Return the client object or null if project not found
    },
    response_format: 'object', // Or 'table' if you expect multiple clients per ref, but unique reference implies one.
  },

  clients_with_open_site_reports: {
    keywords: [
      'rapport chantier',
      'site report',
      'ouvert',
      'problème',
      'client',
    ],
    questions: [
      'Clients avec rapports de chantier ouverts',
      'Qui a des problèmes signalés sur leurs chantiers ?',
    ],
    description:
      'Liste des clients ayant des projets ou étapes associés à des rapports de chantier non résolus.',
    prisma: async () => {
      const clients = await prismaService.clients.findMany({
        where: {
          projects: {
            some: {
              site_reports: {
                some: {
                  status: 'ouvert', // Assuming 'ouvert' means unresolved
                },
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          projects: {
            select: {
              name: true,
              reference: true,
              site_reports: {
                where: { status: 'ouvert' },
                select: { description: true, status: true },
              },
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
      return clients.filter((client) =>
        client.projects.some((project) => project.site_reports.length > 0),
      );
    },
    response_format: 'table',
  },

  clients_missing_customer_id: {
    keywords: ['customer id', 'manquant', 'identifiant externe', 'client'],
    questions: [
      'Clients sans customer_id',
      "Qui n'a pas d'identifiant client externe ?",
    ],
    description:
      'Liste des clients pour lesquels le champ customer_id est vide ou nul.',
    prisma: async () => {
      return await prismaService.clients.findMany({
        where: {
          OR: [
            { customer_id: { equals: '' } },
            { customer_id: { equals: null } },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
          email: true,
          phone: true,
          customer_id: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
  },
});
