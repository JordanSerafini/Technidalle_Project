import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const documentsQueries = {
  documents_by_type: {
    questions: [
      'Quels sont les documents de type [TYPE] ?',
      'Liste des [TYPE]',
      'Tous les [TYPE]',
      'Documents [TYPE]',
      'Rechercher [TYPE]',
      'Voir les [TYPE]',
      'Afficher [TYPE]',
      'Consulter [TYPE]',
      'Lister [TYPE]',
      'Trouver [TYPE]',
    ],
    prisma: async (type: string) => {
      return await prisma.documents.findMany({
        where: {
          type: type as any,
        },
        select: {
          reference: true,
          status: true,
          issue_date: true,
          due_date: true,
          amount: true,
          payment_status: true,
          projects: {
            select: {
              name: true,
              reference: true,
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
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    description: 'Liste des documents filtrés par type',
    parameters: [
      {
        name: 'TYPE',
        description: 'Type de document (devis, facture, bon_de_commande, etc.)',
      },
    ],
  },

  documents_by_status: {
    questions: [
      'Quels sont les documents avec le statut [STATUS] ?',
      'Documents [STATUS]',
      'Liste des documents [STATUS]',
      'Rechercher documents [STATUS]',
      'Voir documents [STATUS]',
      'Afficher documents [STATUS]',
      'Consulter documents [STATUS]',
      'Lister documents [STATUS]',
      'Trouver documents [STATUS]',
      'Documents en statut [STATUS]',
    ],
    prisma: async (status: string) => {
      return await prisma.documents.findMany({
        where: {
          status: status as any,
        },
        select: {
          type: true,
          reference: true,
          issue_date: true,
          due_date: true,
          amount: true,
          payment_status: true,
          projects: {
            select: {
              name: true,
              reference: true,
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
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    description: 'Liste des documents filtrés par statut',
    parameters: [
      {
        name: 'STATUS',
        description: 'Statut du document (brouillon, en_attente, valide, etc.)',
      },
    ],
  },

  documents_by_date_range: {
    questions: [
      'Quels sont les documents entre [START_DATE] et [END_DATE] ?',
      'Documents entre [START_DATE] et [END_DATE]',
      'Liste des documents de [START_DATE] à [END_DATE]',
      'Rechercher documents période [START_DATE] [END_DATE]',
      'Voir documents période [START_DATE] [END_DATE]',
      'Afficher documents période [START_DATE] [END_DATE]',
      'Consulter documents période [START_DATE] [END_DATE]',
      'Lister documents période [START_DATE] [END_DATE]',
      'Trouver documents période [START_DATE] [END_DATE]',
      'Documents créés entre [START_DATE] et [END_DATE]',
    ],
    prisma: async (startDate: string, endDate: string) => {
      return await prisma.documents.findMany({
        where: {
          issue_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
          due_date: true,
          amount: true,
          payment_status: true,
          projects: {
            select: {
              name: true,
              reference: true,
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
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    description: 'Liste des documents créés dans une période donnée',
    parameters: [
      {
        name: 'START_DATE',
        description: 'Date de début (YYYY-MM-DD)',
      },
      {
        name: 'END_DATE',
        description: 'Date de fin (YYYY-MM-DD)',
      },
    ],
  },

  document_details: {
    questions: [
      'Détails du document [REFERENCE]',
      'Informations document [REFERENCE]',
      'Voir document [REFERENCE]',
      'Afficher document [REFERENCE]',
      'Consulter document [REFERENCE]',
      'Document [REFERENCE]',
      'Fiche document [REFERENCE]',
      'Détails [REFERENCE]',
      'Info [REFERENCE]',
      'Voir [REFERENCE]',
    ],
    prisma: async (reference: string) => {
      return await prisma.documents.findFirst({
        where: {
          reference: reference,
        },
        select: {
          type: true,
          status: true,
          issue_date: true,
          due_date: true,
          amount: true,
          tva_rate: true,
          payment_status: true,
          payment_date: true,
          payment_method: true,
          discount_rate: true,
          discount_amount: true,
          amount_paid: true,
          balance_due: true,
          legal_mentions: true,
          notes: true,
          file_path: true,
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
              email: true,
              phone: true,
            },
          },
          document_lines: {
            select: {
              description: true,
              quantity: true,
              unit: true,
              unit_price: true,
              discount_percent: true,
              discount_amount: true,
              tax_rate: true,
              total_ht: true,
              materials: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
          document_tags: {
            select: {
              tags: {
                select: {
                  label: true,
                  color: true,
                },
              },
            },
          },
        },
      });
    },
    description: "Détails complets d'un document spécifique",
    parameters: [
      {
        name: 'REFERENCE',
        description: 'Référence du document',
      },
    ],
  },

  documents_by_client: {
    questions: [
      'Quels sont les documents du client [CLIENT] ?',
      'Documents client [CLIENT]',
      'Liste des documents de [CLIENT]',
      'Rechercher documents client [CLIENT]',
      'Voir documents client [CLIENT]',
      'Afficher documents client [CLIENT]',
      'Consulter documents client [CLIENT]',
      'Lister documents client [CLIENT]',
      'Trouver documents client [CLIENT]',
      'Documents associés à [CLIENT]',
    ],
    prisma: async (client: string) => {
      return await prisma.documents.findMany({
        where: {
          clients: {
            OR: [
              { firstname: { contains: client, mode: 'insensitive' } },
              { lastname: { contains: client, mode: 'insensitive' } },
              { company_name: { contains: client, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
          due_date: true,
          amount: true,
          payment_status: true,
          projects: {
            select: {
              name: true,
              reference: true,
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
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    description: 'Liste des documents associés à un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom ou raison sociale du client',
      },
    ],
  },
};
