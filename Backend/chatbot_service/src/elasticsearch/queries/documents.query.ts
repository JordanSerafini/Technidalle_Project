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

  documents_recently_modified: {
    keywords: [
      'document',
      'modifié',
      'récent',
      'mise à jour',
      'changement',
      'actualisé',
      'édité',
    ],
    questions: [
      'Quels documents ont été récemment modifiés ?',
      'Documents récemment mis à jour',
      'Dernières modifications de documents',
      'Documents modifiés récemment',
      'Changements récents dans les documents',
      'Documents actualisés récemment',
      'Dernières mises à jour documentaires',
      'Documents édités récemment',
      'Modifications récentes',
      'Derniers documents modifiés',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
          amount: true,
          updated_at: true,
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
          updated_at: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Liste des 10 documents les plus récemment modifiés',
  },

  payments_received_by_period: {
    keywords: [
      'paiement',
      'reçu',
      'période',
      'encaissement',
      'règlement',
      'facture payée',
      'recette',
      'entrée',
      'trésorerie',
    ],
    questions: [
      'Quels paiements ont été reçus entre [START_DATE] et [END_DATE] ?',
      'Paiements reçus de [START_DATE] à [END_DATE]',
      'Règlements entre [START_DATE] et [END_DATE]',
      'Factures payées période [START_DATE] [END_DATE]',
      'Encaissements de [START_DATE] à [END_DATE]',
      'Recettes entre [START_DATE] et [END_DATE]',
      'Entrées de trésorerie [START_DATE] [END_DATE]',
      'Liste des paiements [START_DATE] [END_DATE]',
      'Montants reçus période [START_DATE] [END_DATE]',
      'Argent encaissé entre [START_DATE] et [END_DATE]',
    ],
    prisma: async (startDate: string, endDate: string) => {
      return await prisma.documents.findMany({
        where: {
          type: 'facture',
          payment_status: 'paye',
          payment_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        select: {
          reference: true,
          issue_date: true,
          payment_date: true,
          amount: true,
          payment_method: true,
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
          payment_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des paiements reçus pendant une période donnée',
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

  documents_with_multiple_tags: {
    keywords: [
      'document',
      'tags',
      'étiquettes',
      'multiples',
      'plusieurs',
      'combinaison',
      'recherche avancée',
    ],
    questions: [
      'Quels documents ont les tags [TAG1] et [TAG2] ?',
      'Documents avec tags [TAG1] et [TAG2]',
      'Rechercher documents tags [TAG1] [TAG2]',
      'Documents étiquetés [TAG1] et [TAG2]',
      'Filtrer par tags [TAG1] [TAG2]',
      'Documents avec plusieurs tags [TAG1] [TAG2]',
      'Recherche avancée tags [TAG1] [TAG2]',
      'Combinaison de tags [TAG1] [TAG2]',
      'Documents multitags [TAG1] [TAG2]',
      'Trouver documents tags [TAG1] et [TAG2]',
    ],
    prisma: async (tag1: string, tag2: string) => {
      return await prisma.documents.findMany({
        where: {
          AND: [
            {
              document_tags: {
                some: {
                  tags: {
                    label: {
                      contains: tag1,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
            {
              document_tags: {
                some: {
                  tags: {
                    label: {
                      contains: tag2,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
          ],
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
    description: 'Liste des documents possédant deux tags spécifiques',
    parameters: [
      {
        name: 'TAG1',
        description: 'Premier tag à rechercher',
      },
      {
        name: 'TAG2',
        description: 'Second tag à rechercher',
      },
    ],
  },

  partially_paid_invoices: {
    keywords: [
      'facture',
      'partiellement',
      'payée',
      'acompte',
      'paiement partiel',
      'règlement incomplet',
      'solde restant',
    ],
    questions: [
      'Quelles factures sont partiellement payées ?',
      'Factures avec paiement partiel',
      'Factures réglées partiellement',
      'Liste des factures avec acompte',
      'Factures avec règlement incomplet',
      'Paiements partiels',
      'Factures en cours de règlement',
      'Factures avec solde restant',
      'Acomptes versés',
      'Factures avec reste à payer',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          type: 'facture',
          payment_status: 'partiel',
        },
        select: {
          reference: true,
          issue_date: true,
          due_date: true,
          amount: true,
          amount_paid: true,
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
    description: 'Liste des factures partiellement payées avec montant restant dû',
  },

  documents_by_payment_method: {
    keywords: [
      'document',
      'paiement',
      'moyen',
      'méthode',
      'mode',
      'règlement',
      'type paiement',
    ],
    questions: [
      'Quels documents ont été payés par [PAYMENT_METHOD] ?',
      'Paiements par [PAYMENT_METHOD]',
      'Documents réglés en [PAYMENT_METHOD]',
      'Factures payées par [PAYMENT_METHOD]',
      'Liste des règlements par [PAYMENT_METHOD]',
      'Transactions par [PAYMENT_METHOD]',
      'Mode de paiement [PAYMENT_METHOD]',
      'Méthode de règlement [PAYMENT_METHOD]',
      'Documents avec paiement [PAYMENT_METHOD]',
      'Rechercher paiements [PAYMENT_METHOD]',
    ],
    prisma: async (paymentMethod: string) => {
      return await prisma.documents.findMany({
        where: {
          payment_method: {
            contains: paymentMethod,
            mode: 'insensitive',
          },
          payment_status: {
            in: ['paye', 'partiel'],
          },
        },
        select: {
          type: true,
          reference: true,
          issue_date: true,
          payment_date: true,
          amount: true,
          amount_paid: true,
          payment_method: true,
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
          payment_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des documents payés avec une méthode de paiement spécifique',
    parameters: [
      {
        name: 'PAYMENT_METHOD',
        description: 'Méthode de paiement (virement, carte, chèque, espèces, etc.)',
      },
    ],
  },

  documents_by_small_projects: {
    keywords: [
      'document',
      'petit',
      'projet',
      'mini',
      'court',
      'rapide',
      'simple',
    ],
    questions: [
      'Quels documents sont associés à de petits projets ?',
      'Documents des petits projets',
      'Documents projets simples',
      'Liste des documents pour petits chantiers',
      'Documents des mini-projets',
      'Facturation petits projets',
      'Devis pour petits travaux',
      'Documents des travaux rapides',
      'Projets courts documents',
      'Petites interventions documents',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          projects: {
            estimated_duration: {
              lt: 7 // Projets de moins d'une semaine
            }
          }
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
              estimated_duration: true,
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
    description: 'Liste des documents associés à des projets de courte durée (moins d\'une semaine)',
  },

  documents_by_payment_amount_range: {
    keywords: [
      'document',
      'montant',
      'intervalle',
      'entre',
      'prix',
      'fourchette',
      'coût',
      'plage',
      'valeur',
    ],
    questions: [
      'Quels documents ont un montant entre [MIN_AMOUNT] et [MAX_AMOUNT] ?',
      'Documents entre [MIN_AMOUNT] et [MAX_AMOUNT] euros',
      'Factures de [MIN_AMOUNT] à [MAX_AMOUNT] euros',
      'Devis entre [MIN_AMOUNT] et [MAX_AMOUNT] euros',
      'Documents dans la fourchette [MIN_AMOUNT]-[MAX_AMOUNT] euros',
      'Trouver documents de [MIN_AMOUNT] à [MAX_AMOUNT] euros',
      'Liste des documents entre [MIN_AMOUNT] et [MAX_AMOUNT] euros',
      'Facturations de [MIN_AMOUNT] à [MAX_AMOUNT] euros',
      'Montants entre [MIN_AMOUNT] et [MAX_AMOUNT] euros',
      'Rechercher documents entre [MIN_AMOUNT] et [MAX_AMOUNT] euros',
    ],
    prisma: async (minAmount: string, maxAmount: string) => {
      return await prisma.documents.findMany({
        where: {
          amount: {
            gte: parseFloat(minAmount),
            lte: parseFloat(maxAmount),
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
      });
    },
    response_format: 'table',
    description: 'Liste des documents dont le montant est compris dans une fourchette spécifique',
    parameters: [
      {
        name: 'MIN_AMOUNT',
        description: 'Montant minimum en euros',
      },
      {
        name: 'MAX_AMOUNT',
        description: 'Montant maximum en euros',
      },
    ],
  },

  client_document_statistics: {
    keywords: [
      'client',
      'statistique',
      'document',
      'résumé',
      'bilan',
      'synthèse',
      'récapitulatif',
    ],
    questions: [
      'Quelles sont les statistiques de documents pour le client [CLIENT] ?',
      'Bilan documentaire client [CLIENT]',
      'Résumé des documents client [CLIENT]',
      'Synthèse client [CLIENT]',
      'Statistiques client [CLIENT]',
      'Récapitulatif documents [CLIENT]',
      'Analyse documents client [CLIENT]',
      'Résumé activité client [CLIENT]',
      'Chiffres client [CLIENT]',
      'Activité documentaire [CLIENT]',
    ],
    prisma: async (client: string) => {
      // Trouver le client d'abord
      const clientData = await prisma.clients.findFirst({
        where: {
          OR: [
            { firstname: { contains: client, mode: 'insensitive' } },
            { lastname: { contains: client, mode: 'insensitive' } },
            { company_name: { contains: client, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          company_name: true,
        },
      });

      if (!clientData) {
        return { error: 'Client non trouvé' };
      }

      // Requête pour tous les documents du client
      const documents = await prisma.documents.findMany({
        where: {
          client_id: clientData.id,
        },
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          payment_status: true,
          issue_date: true,
        },
      });

      // Analyser les données
      const currentYear = new Date().getFullYear();
      
      // Initialiser les statistiques
      const stats = {
        client_name: clientData.company_name || `${clientData.firstname} ${clientData.lastname}`,
        total_documents: documents.length,
        total_amount: 0,
        paid_amount: 0,
        unpaid_amount: 0,
        documents_by_type: {} as Record<string, number>,
        documents_by_status: {} as Record<string, number>,
        documents_current_year: 0,
        invoices_paid_on_time: 0,
        invoices_paid_late: 0,
        average_payment_time: 0, // Jours moyens pour payer
      };

      // Calculer les statistiques
      let totalPaymentDays = 0;
      let paidInvoicesCount = 0;

      documents.forEach(doc => {
        // Montants
        const amount = Number(doc.amount || 0);
        stats.total_amount += amount;

        if (doc.payment_status === 'paye') {
          stats.paid_amount += amount;
          paidInvoicesCount++;
        } else {
          stats.unpaid_amount += amount;
        }

        // Compter par type
        if (doc.type && !stats.documents_by_type[doc.type]) {
          stats.documents_by_type[doc.type] = 0;
        }
        if (doc.type) {
          stats.documents_by_type[doc.type]++;
        }

        // Compter par statut
        if (doc.status && !stats.documents_by_status[doc.status]) {
          stats.documents_by_status[doc.status] = 0;
        }
        if (doc.status) {
          stats.documents_by_status[doc.status]++;
        }

        // Documents de l'année en cours
        if (doc.issue_date && new Date(doc.issue_date).getFullYear() === currentYear) {
          stats.documents_current_year++;
        }
      });

      return stats;
    },
    response_format: 'object',
    description: 'Statistiques et résumé des documents pour un client spécifique',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom ou raison sociale du client',
      },
    ],
  },

  document_history_for_project: {
    keywords: [
      'document',
      'historique',
      'projet',
      'chronologie',
      'timeline',
      'évolution',
      'suivi',
    ],
    questions: [
      'Quel est l\'historique des documents pour le projet [PROJECT] ?',
      'Chronologie documents projet [PROJECT]',
      'Timeline projet [PROJECT]',
      'Historique documentaire [PROJECT]',
      'Évolution documents [PROJECT]',
      'Suivi documents projet [PROJECT]',
      'Documents projet [PROJECT] par date',
      'Historique projet [PROJECT]',
      'Progression documentaire [PROJECT]',
      'Documents créés pour [PROJECT]',
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
          amount: true,
          payment_status: true,
          created_at: true,
          updated_at: true,
          projects: {
            select: {
              name: true,
              reference: true,
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
    response_format: 'timeline',
    description: 'Chronologie des documents créés pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  documents_requiring_action: {
    keywords: [
      'document',
      'action',
      'requise',
      'nécessaire',
      'intervention',
      'urgent',
      'attention',
      'traiter',
    ],
    questions: [
      'Quels documents nécessitent une action ?',
      'Documents requérant attention',
      'Documents à traiter',
      'Actions nécessaires sur documents',
      'Documents avec action requise',
      'Liste des documents urgents',
      'Documents nécessitant intervention',
      'Actions en attente sur documents',
      'Documents prioritaires',
      'Documents à gérer',
    ],
    prisma: async () => {
      const today = new Date();
      
      // Requête combinant plusieurs critères de documents nécessitant action
      const results = await Promise.all([
        // Devis en attente de validation
        prisma.documents.findMany({
          where: {
            type: 'devis',
            status: 'en_attente',
          },
          select: {
            id: true,
            type: true,
            reference: true,
            issue_date: true,
            due_date: true,
            amount: true,
            projects: {
              select: {
                name: true,
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
        }),
        
        // Factures échues non payées
        prisma.documents.findMany({
          where: {
            type: 'facture',
            payment_status: 'non_payé',
            due_date: {
              lt: today,
            },
          },
          select: {
            id: true,
            type: true,
            reference: true,
            issue_date: true,
            due_date: true,
            amount: true,
            projects: {
              select: {
                name: true,
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
        }),
        
        // Documents brouillons à finaliser
        prisma.documents.findMany({
          where: {
            status: 'brouillon',
          },
          select: {
            id: true,
            type: true,
            reference: true,
            issue_date: true,
            due_date: true,
            amount: true,
            projects: {
              select: {
                name: true,
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
        }),
      ]);
      
      // Combiner les résultats et ajouter un champ action_required
      const devisEnAttente = results[0].map(doc => ({
        ...doc,
        action_required: 'Relance client',
      }));
      
      const facturesEchues = results[1].map(doc => ({
        ...doc,
        action_required: 'Relance paiement',
      }));
      
      const brouillons = results[2].map(doc => ({
        ...doc,
        action_required: 'Finaliser document',
      }));
      
      // Combiner tous les résultats
      return [...devisEnAttente, ...facturesEchues, ...brouillons];
    },
    response_format: 'table',
    description: 'Liste des documents nécessitant une action (relance, finalisation, etc.)',
  },

  cancelled_or_refused_documents: {
    keywords: ['annulé', 'refusé', 'abandon', 'rejeté'],
    questions: [
      'Quels documents ont été annulés ou refusés ?',
      'Documents rejetés',
      'Liste des refus ou annulations',
    ],
    description: 'Liste des documents dont le statut est annulé ou refusé',
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          status: { in: ['refuse', 'annule'] },
        },
        select: {
          type: true,
          reference: true,
          status: true,
          issue_date: true,
          clients: {
            select: { firstname: true, lastname: true },
          },
        },
        orderBy: { issue_date: 'desc' },
      });
    },
    response_format: 'table',
  },
  documents_signed: {
    keywords: ['document', 'signé', 'signature', 'électronique'],
    questions: [
      'Quels documents ont été signés ?',
      'Documents avec signature électronique',
      'Documents signés par le client',
      'Liste des documents signés',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          signed_by_client: true,
        },
        select: {
          type: true,
          reference: true,
          signed_date: true,
          electronic_signature_path: true,
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
            },
          },
          projects: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          signed_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Documents signés électroniquement par les clients',
  },
  documents_without_lines: {
    keywords: ['vide', 'document', 'sans ligne', 'incomplet'],
    questions: [
      'Quels documents n\'ont pas de ligne ?',
      'Documents vides',
      'Documents sans contenu',
      'Liste des documents incomplets',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          document_lines: {
            none: {},
          },
        },
        select: {
          reference: true,
          type: true,
          issue_date: true,
          amount: true,
          clients: {
            select: {
              company_name: true,
              firstname: true,
              lastname: true,
            },
          },
          projects: {
            select: {
              name: true,
            },
          },
        },
      });
    },
    response_format: 'table',
    description: 'Documents créés sans lignes associées',
  },
  documents_with_discount: {
    keywords: ['remise', 'réduction', 'rabais', 'discount'],
    questions: [
      'Quels documents ont des remises ?',
      'Documents avec rabais',
      'Remises appliquées',
      'Réductions sur documents',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          OR: [
            { discount_rate: { gt: 0 } },
            { discount_amount: { gt: 0 } },
          ],
        },
        select: {
          reference: true,
          type: true,
          issue_date: true,
          discount_rate: true,
          discount_amount: true,
          amount: true,
          clients: {
            select: {
              company_name: true,
              firstname: true,
              lastname: true,
            },
          },
        },
        orderBy: {
          issue_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des documents avec remises ou réductions',
  },
  documents_by_project_and_type: {
    keywords: [
      'document',
      'projet',
      'type',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels sont les documents de type [TYPE] pour le projet [PROJECT] ?',
      'Liste des [TYPE] du projet [PROJECT]',
      'Documents [TYPE] du projet [PROJECT]',
      'Rechercher [TYPE] du projet [PROJECT]',
      'Voir les [TYPE] du projet [PROJECT]',
      'Afficher [TYPE] du projet [PROJECT]',
      'Consulter [TYPE] du projet [PROJECT]',
      'Lister [TYPE] du projet [PROJECT]',
      'Trouver [TYPE] du projet [PROJECT]',
    ],
    description: 'Liste des documents filtrés par type et projet',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Référence du projet',
      },
      {
        name: 'TYPE',
        description: 'Type de document (devis, facture, bon_de_commande, etc.)',
      },
    ],
    prisma: async (project: string, type: string) => {
      return await prisma.documents.findMany({
        where: {
          type: type as document_type,
          projects: {
            reference: project,
          },
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
  },
  documents_with_material: {
    keywords: [
      'document',
      'matériel',
      'matériau',
      'produit',
      'élément',
      'composant',
      'rechercher',
      'consulter',
    ],
    questions: [
      'Quels documents contiennent le matériau [MATERIAL] ?',
      'Documents avec matériau [MATERIAL]',
      'Liste des documents contenant [MATERIAL]',
      'Rechercher documents avec [MATERIAL]',
      'Voir documents avec [MATERIAL]',
      'Afficher documents avec [MATERIAL]',
      'Consulter documents avec [MATERIAL]',
      'Lister documents avec [MATERIAL]',
      'Trouver documents avec [MATERIAL]',
      'Documents associés à [MATERIAL]',
    ],
    description: 'Liste des documents contenant un matériau spécifique',
    parameters: [
      { name: 'MATERIAL', description: 'Nom ou référence du matériau' },
    ],
    prisma: async (material: string) => {
      return await prisma.documents.findMany({
        where: {
          document_lines: {
            some: {
              materials: {
                OR: [
                  { name: { contains: material, mode: 'insensitive' } },
                  { reference: { contains: material, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
        select: {
          reference: true,
          type: true,
          issue_date: true,
          amount: true,
          document_lines: {
            where: {
              materials: {
                OR: [
                  { name: { contains: material, mode: 'insensitive' } },
                  { reference: { contains: material, mode: 'insensitive' } },
                ],
              },
            },
            select: {
              description: true,
              quantity: true,
              unit_price: true,
              materials: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
      });
    },
    response_format: 'table',
  },
  documents_by_material: {
    keywords: ['document', 'matériel', 'matériau', 'produit', 'élément'],
    questions: [
      'Quels documents contiennent le matériau [MATERIAL] ?',
      'Documents associés au produit [MATERIAL]',
      'Liste des documents avec [MATERIAL]',
    ],
    prisma: async (material: string) => {
      return await prisma.documents.findMany({
        where: {
          document_lines: {
            some: {
              materials: {
                name: {
                  contains: material,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
        select: {
          reference: true,
          type: true,
          amount: true,
          issue_date: true,
          projects: {
            select: { name: true, reference: true },
          },
          clients: {
            select: { firstname: true, lastname: true, company_name: true },
          },
        },
        orderBy: { issue_date: 'desc' },
      });
    },
    parameters: [
      { name: 'MATERIAL', description: 'Nom du matériau recherché' },
    ],
    response_format: 'table',
    description: 'Liste des documents contenant un matériau spécifique',
  },
  documents_approved_by_staff: {
    keywords: ['validé', 'approuvé', 'staff', 'employé'],
    questions: [
      'Quels documents ont été validés par [STAFF] ?',
      'Documents approuvés par [STAFF]',
      'Liste des documents validés par [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.documents.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          reference: true,
          type: true,
          status: true,
          issue_date: true,
          projects: {
            select: { name: true, reference: true },
          },
          staff: {
            select: { firstname: true, lastname: true },
          },
        },
        orderBy: { issue_date: 'desc' },
      });
    },
    parameters: [
      { name: 'STAFF', description: 'Nom ou prénom de l\'employé' },
    ],
    response_format: 'table',
    description: 'Liste des documents approuvés par un membre du staff',
  },
  delivery_documents_by_month: {
    keywords: ['livraison', 'mois', 'bon de livraison', 'documents logistique'],
    questions: [
      'Quels sont les bons de livraison du mois de [MONTH] ?',
      'Livraisons effectuées en [MONTH]',
    ],
    prisma: async (month: string) => {
      const monthIndex = new Date(`${month} 1, ${new Date().getFullYear()}`).getMonth();
      const year = new Date().getFullYear();
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
  
      return await prisma.documents.findMany({
        where: {
          type: 'bon_de_livraison',
          delivery_date: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        select: {
          reference: true,
          delivery_date: true,
          amount: true,
          projects: { select: { name: true, reference: true } },
        },
        orderBy: { delivery_date: 'asc' },
      });
    },
    parameters: [{ name: 'MONTH', description: 'Mois (ex: janvier)' }],
    response_format: 'table',
    description: 'Liste des documents de livraison par mois',
  },
  rejected_or_cancelled_documents: {
    keywords: ['refusé', 'annulé', 'rejeté', 'abandon'],
    questions: [
      'Quels documents ont été annulés ou refusés ?',
      'Liste des documents rejetés',
      'Documents abandonnés',
    ],
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          status: { in: ['refuse', 'annule'] },
        },
        select: {
          reference: true,
          type: true,
          status: true,
          issue_date: true,
          amount: true,
          projects: { select: { name: true, reference: true } },
        },
        orderBy: { issue_date: 'desc' },
      });
    },
    response_format: 'table',
    description: 'Liste des documents refusés ou annulés',
  },
  invoices_total_by_client: {
    keywords: [
      'facture',
      'client',
      'total',
      'montant',
      'chiffre',
      'affaires',
      'bilan',
      'somme',
      'revenu',
      'facturation',
    ],
    questions: [
      'Quel est le montant total des factures par client ?',
      'Total des factures par client',
      'Chiffre d\'affaires par client',
      'Facturation totale par client',
      'Bilan des factures par client',
      'Somme des factures par client',
      'Revenu par client',
      'Total de la facturation par client',
      'Statistiques de facturation par client',
      'Factures cumulées par client',
    ],
    description: 'Montant total des factures par client',
    prisma: async () => {
      const results = await prisma.documents.groupBy({
        by: ['client_id'],
        where: {
          type: 'facture',
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });
  
      const enriched = await Promise.all(results.map(async (r) => {
        const client = await prisma.clients.findUnique({ where: { id: r.client_id ?? undefined } });
        return {
          client_name: client?.company_name || `${client?.firstname} ${client?.lastname}`,
          total_amount: r._sum.amount ?? 0,
          number_of_invoices: r._count._all,
        };
      }));
  
      return enriched;
    },
    response_format: 'table',
  },
  documents_due_this_week: {
    keywords: [
      'document',
      'échéance',
      'semaine',
      'paiement',
      'attente',
      'calendrier',
      'date limite',
      'délai',
      'urgent',
      'prioritaire',
    ],
    questions: [
      'Quels documents sont dus cette semaine ?',
      'Échéances de la semaine',
      'Documents à échéance cette semaine',
      'Factures dues cette semaine',
      'Paiements attendus cette semaine',
      'Documents arrivant à échéance cette semaine',
      'Factures à payer cette semaine',
      'Échéances de la semaine en cours',
      'Calendrier des paiements de la semaine',
      'Documents avec date limite cette semaine',
    ],
    description: 'Documents dont l\'échéance est prévue cette semaine',
    prisma: async () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
  
      return await prisma.documents.findMany({
        where: {
          due_date: {
            gte: today,
            lte: nextWeek,
          },
        },
        select: {
          id: true,
          type: true,
          reference: true,
          due_date: true,
          amount: true,
          status: true,
        },
        orderBy: {
          due_date: 'asc',
        },
      });
    },
    response_format: 'table',
  },
  average_payment_delay_by_client: {
    keywords: [
      'paiement',
      'délai',
      'retard',
      'client',
      'moyenne',
      'délai moyen',
      'temps',
      'échéance',
      'règlement',
      'performance',
    ],
    questions: [
      'Quel est le délai moyen de paiement par client ?',
      'Délais de paiement moyens par client',
      'Retards de paiement moyens par client',
      'Temps moyen de règlement par client',
      'Performance de paiement par client',
      'Délais de règlement moyens',
      'Retards moyens de paiement',
      'Temps moyen avant paiement',
      'Délais de paiement clients',
      'Moyenne des retards de paiement',
    ],
    description: 'Délai moyen de paiement par client',
    prisma: async () => {
      const paidInvoices = await prisma.documents.findMany({
        where: {
          type: 'facture',
          payment_status: 'paye',
          payment_date: { not: null },
          due_date: { not: null },
        },
        select: {
          payment_date: true,
          due_date: true,
          client_id: true,
        },
      });
  
      const delays: Record<number, { total: number; count: number }> = {};
  
      paidInvoices.forEach((inv) => {
        if (!inv.client_id) return;
        const delay = (new Date(inv.payment_date!).getTime() - new Date(inv.due_date!).getTime()) / (1000 * 60 * 60 * 24);
        if (!delays[inv.client_id]) delays[inv.client_id] = { total: 0, count: 0 };
        delays[inv.client_id].total += delay;
        delays[inv.client_id].count += 1;
      });
  
      const enriched = await Promise.all(Object.entries(delays).map(async ([clientId, data]) => {
        const client = await prisma.clients.findUnique({ where: { id: parseInt(clientId) } });
        return {
          client_name: client?.company_name || `${client?.firstname} ${client?.lastname}`,
          average_delay: (data.total / data.count).toFixed(2),
        };
      }));
  
      return enriched;
    },
    response_format: 'table',
  },
  documents_from_projects_without_budget: {
    keywords: [
      'document',
      'projet',
      'budget',
      'sans budget',
      'non défini',
      'manquant',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels documents sont liés à des projets sans budget ?',
      'Documents des projets sans budget',
      'Liste des documents projets sans budget',
      'Documents projets budget non défini',
      'Rechercher documents projets sans budget',
      'Voir documents projets sans budget',
      'Afficher documents projets sans budget',
      'Consulter documents projets sans budget',
      'Lister documents projets sans budget',
      'Trouver documents projets sans budget',
    ],
    description: 'Documents liés à des projets sans budget défini',
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          projects: {
            budget: null,
          },
        },
        select: {
          reference: true,
          type: true,
          amount: true,
          projects: { select: { name: true, reference: true } },
        },
        orderBy: { issue_date: 'desc' },
      });
    },
    response_format: 'table',
  },
  documents_without_materials: {
    keywords: [
      'document',
      'matériel',
      'sans matériel',
      'vide',
      'incomplet',
      'liste',
      'rechercher',
      'consulter',
      'filtrer',
    ],
    questions: [
      'Quels documents ne contiennent aucun matériau ?',
      'Documents sans matériaux',
      'Liste des documents sans matériaux',
      'Documents vides de matériaux',
      'Rechercher documents sans matériaux',
      'Voir documents sans matériaux',
      'Afficher documents sans matériaux',
      'Consulter documents sans matériaux',
      'Lister documents sans matériaux',
      'Trouver documents sans matériaux',
    ],
    description: 'Documents qui ne contiennent aucune ligne de matériau',
    prisma: async () => {
      return await prisma.documents.findMany({
        where: {
          document_lines: {
            none: {
              material_id: {
                not: null,
              },
            },
          },
        },
        select: {
          reference: true,
          type: true,
          issue_date: true,
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
  },
};
