import {
  PrismaClient,
  document_type,
  document_status,
} from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const documentsQueries = {
  documents_by_type: {
    keywords: [
      'document',
      'type',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
      'catégorie',
    ],
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
          type: type as document_type,
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
    response_format: 'table',
    description: 'Liste des documents filtrés par type',
    parameters: [
      {
        name: 'TYPE',
        description: 'Type de document (devis, facture, bon_de_commande, etc.)',
      },
    ],
  },

  documents_by_status: {
    keywords: [
      'document',
      'statut',
      'état',
      'filtre',
      'status',
      'rechercher',
      'consulter',
    ],
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
          status: status as document_status,
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
    response_format: 'table',
    description: 'Liste des documents filtrés par statut',
    parameters: [
      {
        name: 'STATUS',
        description: 'Statut du document (brouillon, en_attente, valide, etc.)',
      },
    ],
  },

  documents_by_date_range: {
    keywords: [
      'document',
      'date',
      'période',
      'intervalle',
      'entre',
      'plage',
      'temporel',
    ],
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
    response_format: 'table',
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
    keywords: [
      'document',
      'détail',
      'information',
      'voir',
      'afficher',
      'consulter',
      'référence',
    ],
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
    response_format: 'object',
    description: "Détails complets d'un document spécifique",
    parameters: [
      {
        name: 'REFERENCE',
        description: 'Référence du document',
      },
    ],
  },

  documents_by_client: {
    keywords: [
      'document',
      'client',
      'associé',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
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
    response_format: 'table',
    description: 'Liste des documents associés à un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom ou raison sociale du client',
      },
    ],
  },

  invoices_to_be_paid: {
    keywords: [
      'facture',
      'paiement',
      'impayé',
      'en attente',
      'solde',
      'dû',
      'non réglé',
    ],
    questions: [
      'Quelles sont les factures à payer ?',
      'Factures en attente de paiement',
      'Factures non payées',
      'Liste des factures impayées',
      'Paiements en attente',
      'Quelles factures restent à payer ?',
      'Factures avec solde dû',
      'Factures non soldées',
      'Factures avec paiement dû',
      'Factures sans paiement',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          type: 'facture',
          payment_status: 'non_payé',
        },
        select: {
          reference: true,
          issue_date: true,
          due_date: true,
          amount: true,
          balance_due: true,
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
        orderBy: [
          {
            due_date: 'asc',
          },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des factures en attente de paiement',
  },

  invoices_overdue: {
    keywords: [
      'facture',
      'retard',
      'échéance',
      'impayé',
      'dépassé',
      'en retard',
      'échu',
    ],
    questions: [
      'Quelles sont les factures en retard ?',
      'Factures en retard de paiement',
      'Paiements en retard',
      'Factures échues non payées',
      'Retards de paiement',
      "Factures dépassant la date d'échéance",
      'Factures impayées échues',
      'Retards de règlement',
      'Factures avec délai dépassé',
      'Factures avec échéance dépassée',
    ],
    prisma: async () => {
      const today = new Date();

      return await prisma.documents.findMany({
        where: {
          type: 'facture',
          payment_status: 'non_payé',
          due_date: {
            lt: today,
          },
        },
        select: {
          reference: true,
          issue_date: true,
          due_date: true,
          amount: true,
          balance_due: true,
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
        },
        orderBy: [
          {
            due_date: 'asc',
          },
        ],
      });
    },
    response_format: 'table',
    description:
      "Liste des factures dont la date d'échéance est dépassée et qui ne sont pas payées",
  },

  documents_due_this_month: {
    keywords: [
      'document',
      'échéance',
      'mois',
      'paiement',
      'attente',
      'calendrier',
      'date limite',
    ],
    questions: [
      'Quels documents sont dus ce mois-ci ?',
      'Échéances du mois',
      'Documents à échéance ce mois',
      'Factures dues ce mois',
      'Paiements attendus ce mois',
      'Documents arrivant à échéance',
      'Factures à payer ce mois',
      'Échéances du mois en cours',
      'Calendrier des paiements du mois',
      'Documents avec date limite ce mois',
    ],
    prisma: async () => {
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
      const lastDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
      );

      return await prisma.documents.findMany({
        where: {
          due_date: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
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
        orderBy: [
          {
            due_date: 'asc',
          },
        ],
      });
    },
    response_format: 'table',
    description:
      "Liste des documents dont la date d'échéance est dans le mois courant",
  },

  documents_recently_created: {
    keywords: [
      'document',
      'récent',
      'créé',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels sont les documents récemment créés ?',
      'Derniers documents ajoutés',
      'Documents récents',
      'Nouveaux documents créés',
      'Documents créés récemment',
      'Dernières créations de documents',
      'Derniers ajouts de documents',
      'Documents les plus récents',
      'Nouveaux documents enregistrés',
      'Créations récentes de documents',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
          amount: true,
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
          created_at: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Liste des 10 documents les plus récemment créés',
  },

  documents_by_project: {
    keywords: [
      'document',
      'projet',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels sont les documents du projet [PROJECT] ?',
      'Documents du projet [PROJECT]',
      'Liste des documents pour [PROJECT]',
      'Tous les documents du projet [PROJECT]',
      'Dossier du projet [PROJECT]',
      'Documents liés au projet [PROJECT]',
      'Paperasse du projet [PROJECT]',
      'Fichiers du projet [PROJECT]',
      'Documentation du projet [PROJECT]',
      'Paperwork projet [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.documents.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { reference: { contains: project, mode: 'insensitive' } },
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
        orderBy: [
          {
            type: 'asc',
          },
          {
            issue_date: 'desc',
          },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des documents associés à un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  quotations_waiting_approval: {
    keywords: [
      'devis',
      'attente',
      'validation',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels devis sont en attente de validation ?',
      "Devis en attente d'approbation",
      'Devis non validés',
      'Liste des devis en attente',
      'Devis à approuver',
      'Devis en cours de décision',
      'Devis sans réponse',
      'Propositions en attente',
      'Devis en suspens',
      'Offres en attente de décision',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          type: 'devis',
          status: 'en_attente',
        },
        select: {
          reference: true,
          issue_date: true,
          due_date: true,
          amount: true,
          validity_period: true,
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
        },
        orderBy: [
          {
            issue_date: 'asc',
          },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des devis en attente de validation client',
  },

  invoices_total_by_month: {
    keywords: [
      'facture',
      'montant',
      'total',
      'mois',
      'chiffre',
      'affaires',
      'bilan',
      'somme',
      'revenu',
      'facturation',
    ],
    questions: [
      'Quel est le montant total des factures par mois ?',
      'Total des factures mensuelles',
      "Chiffre d'affaires mensuel",
      'Facturation mensuelle totale',
      'Bilan mensuel des factures',
      'Somme des factures par mois',
      'Revenu mensuel des factures',
      'Total de la facturation par mois',
      'Statistiques mensuelles de facturation',
      'Factures cumulées par mois',
    ],
    prisma: async () => {
      // Cette requête est plus complexe car il faut regrouper par mois
      const thisYear = new Date().getFullYear();
      const firstDayOfYear = new Date(thisYear, 0, 1);

      const invoices = await prisma.documents.findMany({
        where: {
          type: 'facture',
          issue_date: {
            gte: firstDayOfYear,
          },
        },
        select: {
          issue_date: true,
          amount: true,
          payment_status: true,
        },
      });

      // Créer un tableau pour les 12 mois
      const monthlyTotals = Array(12)
        .fill(0)
        .map(() => ({
          month: 0,
          month_name: '',
          total_amount: 0,
          total_paid: 0,
          total_unpaid: 0,
          count: 0,
        }));

      // Remplir les noms des mois en français
      const monthNames = [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
      ];

      monthlyTotals.forEach((item, index) => {
        item.month = index + 1;
        item.month_name = monthNames[index];
      });

      // Calculer les totaux
      invoices.forEach((invoice) => {
        const month = new Date(invoice.issue_date).getMonth();
        monthlyTotals[month].count += 1;
        monthlyTotals[month].total_amount += Number(invoice.amount || 0);

        if (invoice.payment_status === 'paye') {
          monthlyTotals[month].total_paid += Number(invoice.amount || 0);
        } else {
          monthlyTotals[month].total_unpaid += Number(invoice.amount || 0);
        }
      });

      return monthlyTotals;
    },
    response_format: 'table',
    description:
      "Montant total des factures regroupé par mois pour l'année en cours",
  },

  document_by_reference: {
    keywords: ['document', 'référence', 'rechercher', 'chercher', 'trouver'],
    questions: [
      'Chercher document [REFERENCE]',
      'Trouver document [REFERENCE]',
      'Rechercher [REFERENCE]',
      'Document référence [REFERENCE]',
      'Recherche document [REFERENCE]',
      'Référence [REFERENCE]',
      'Chercher [REFERENCE]',
      'Trouver référence [REFERENCE]',
      'Document [REFERENCE]',
      'Rechercher document [REFERENCE]',
    ],
    prisma: async (reference: string) => {
      return await prisma.documents.findFirst({
        where: {
          reference: {
            contains: reference,
            mode: 'insensitive',
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
      });
    },
    response_format: 'object',
    description:
      'Recherche un document par sa référence (recherche partielle possible)',
    parameters: [
      {
        name: 'REFERENCE',
        description: 'Référence ou partie de la référence du document',
      },
    ],
  },

  quotations_conversion_rate: {
    keywords: [
      'devis',
      'conversion',
      'taux',
      'accepté',
      'refusé',
      'statistiques',
      'performance',
      'combien',
      'ratio',
      'efficacité',
    ],
    questions: [
      'Quel est le taux de conversion des devis ?',
      'Pourcentage de devis acceptés',
      'Conversion des devis en factures',
      'Taux de réussite des devis',
      'Statistiques de conversion des devis',
      'Performance des devis',
      'Combien de devis sont acceptés ?',
      'Ratio devis acceptés/refusés',
      'Efficacité des devis',
      'Taux de transformation devis',
    ],
    prisma: async () => {
      // Obtenir tous les devis
      const allQuotations = await prisma.documents.findMany({
        where: {
          type: 'devis',
          // Exclure les devis brouillons
          status: {
            not: 'brouillon',
          },
        },
        select: {
          reference: true,
          status: true,
          amount: true,
          other_documents_documents_quotation_idTodocuments: {
            select: {
              type: true,
              reference: true,
            },
          },
        },
      });

      const totalQuotations = allQuotations.length;
      let acceptedQuotations = 0;
      let rejectedQuotations = 0;
      let pendingQuotations = 0;
      let convertedToInvoice = 0;
      let totalAmountQuotations = 0;
      let totalAmountAccepted = 0;

      allQuotations.forEach((quotation) => {
        const amount = Number(quotation.amount || 0);
        totalAmountQuotations += amount;

        if (quotation.status === 'valide') {
          acceptedQuotations++;
          totalAmountAccepted += amount;

          // Vérifier si converti en facture
          if (
            quotation.other_documents_documents_quotation_idTodocuments.some(
              (doc) => doc.type === 'facture',
            )
          ) {
            convertedToInvoice++;
          }
        } else if (
          quotation.status === 'refuse' ||
          quotation.status === 'annule'
        ) {
          rejectedQuotations++;
        } else {
          pendingQuotations++;
        }
      });

      return {
        total_quotations: totalQuotations,
        accepted_quotations: acceptedQuotations,
        rejected_quotations: rejectedQuotations,
        pending_quotations: pendingQuotations,
        conversion_rate:
          totalQuotations > 0
            ? (acceptedQuotations / totalQuotations) * 100
            : 0,
        invoice_conversion_rate:
          acceptedQuotations > 0
            ? (convertedToInvoice / acceptedQuotations) * 100
            : 0,
        total_amount_quotations: totalAmountQuotations,
        total_amount_accepted: totalAmountAccepted,
        amount_acceptance_rate:
          totalAmountQuotations > 0
            ? (totalAmountAccepted / totalAmountQuotations) * 100
            : 0,
      };
    },
    response_format: 'object',
    description: 'Statistiques sur le taux de conversion des devis en factures',
  },

  documents_by_tag: {
    keywords: [
      'document',
      'tag',
      'étiquette',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels documents ont le tag [TAG] ?',
      'Documents avec tag [TAG]',
      'Documents étiquetés [TAG]',
      'Liste des documents tag [TAG]',
      'Rechercher documents tag [TAG]',
      'Documents associés au tag [TAG]',
      'Tag [TAG] documents',
      'Voir documents tag [TAG]',
      'Filtrer documents par tag [TAG]',
      'Documents marqués [TAG]',
    ],
    prisma: async (tag: string) => {
      return await prisma.documents.findMany({
        where: {
          document_tags: {
            some: {
              tags: {
                label: {
                  contains: tag,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
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
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des documents associés à un tag spécifique',
    parameters: [
      {
        name: 'TAG',
        description: 'Étiquette/tag à rechercher',
      },
    ],
  },

  expiring_quotations: {
    keywords: [
      'devis',
      'expiration',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels devis arrivent à expiration ?',
      'Devis bientôt expirés',
      'Devis en fin de validité',
      'Offres arrivant à échéance',
      'Devis expirant bientôt',
      'Validité des devis',
      'Devis à relancer',
      'Devis avec validité proche',
      'Devis presque expirés',
      'Date limite des devis',
    ],
    prisma: async () => {
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);

      return await prisma.documents.findMany({
        where: {
          type: 'devis',
          status: 'en_attente',
          AND: [
            {
              issue_date: {
                not: undefined,
              },
            },
            {
              validity_period: {
                not: undefined,
              },
            },
          ],
        },
        select: {
          reference: true,
          issue_date: true,
          validity_period: true,
          amount: true,
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
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des devis qui arrivent bientôt à expiration (dans les 14 jours)',
  },

  highest_value_documents: {
    keywords: [
      'document',
      'montant',
      'élevé',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels sont les documents avec les montants les plus élevés ?',
      'Documents de grande valeur',
      'Plus grosses factures',
      'Documents les plus coûteux',
      'Documents à montant élevé',
      'Factures importantes',
      'Devis importants',
      'Documents avec les plus gros montants',
      'Top des documents par valeur',
      'Classement des documents par montant',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          amount: {
            not: null,
          },
        },
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
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
          amount: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Liste des 10 documents avec les montants les plus élevés',
  },
};
