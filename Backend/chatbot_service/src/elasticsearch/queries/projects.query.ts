import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const projectsQueries = {
  active_projects: {
    keywords: [
      'projet',
      'chantier',
      'actif',
      'cours',
      'travail',
      'réalisation',
      'activité',
    ],
    questions: [
      'Quels sont les projets en cours ?',
      'Liste des chantiers actifs',
      'Projets en cours',
      'Chantiers en cours',
      'Quels projets sont actifs ?',
      'Projets en cours de réalisation',
      'Chantiers en activité',
      'Projets en cours de travail',
      'Liste des projets actifs',
      'Chantiers en cours de construction',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          status: 'en_cours',
        },
        include: {
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
            },
          },
          project_stages: {
            where: {
              status: {
                not: 'termine',
              },
            },
            select: {
              name: true,
              status: true,
              start_date: true,
              end_date: true,
            },
          },
          project_staff: {
            select: {
              staff: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
        },
        orderBy: {
          start_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets actuellement en cours avec leurs détails',
  },

  project_details: {
    keywords: [
      'détail',
      'projet',
      'information',
      'chantier',
      'avancement',
      'état',
      'statut',
      'progression',
    ],
    questions: [
      'Détails du projet [PROJECT]',
      'Informations sur le projet [PROJECT]',
      'État du chantier [PROJECT]',
      'Avancement du projet [PROJECT]',
      'Statut du projet [PROJECT]',
      'Où en est le projet [PROJECT] ?',
      'Progression du projet [PROJECT]',
      'État d avancement [PROJECT]',
      'Détails chantier [PROJECT]',
      'Informations chantier [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.projects.findFirst({
        where: {
          OR: [
            { name: { contains: project, mode: 'insensitive' } },
            { reference: { contains: project, mode: 'insensitive' } },
          ],
        },
        include: {
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
              email: true,
              phone: true,
            },
          },
          project_stages: {
            select: {
              name: true,
              status: true,
              start_date: true,
              end_date: true,
              completion_percentage: true,
              project_staff: {
                select: {
                  staff: {
                    select: {
                      firstname: true,
                      lastname: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              order_index: 'asc',
            },
          },
          project_staff: {
            select: {
              staff: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              role_description: true,
            },
          },
          project_materials: {
            select: {
              materials: {
                select: {
                  name: true,
                  reference: true,
                },
              },
              quantity_planned: true,
              quantity_used: true,
              unit_price: true,
            },
          },
        },
      });
    },
    response_format: 'object',
    description: "Détails complets d'un projet spécifique",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_stages_status: {
    keywords: [
      'étape',
      'phase',
      'projet',
      'chantier',
      'avancement',
      'progression',
      'construction',
      'travail',
    ],
    questions: [
      'Quelles sont les étapes du projet [PROJECT] ?',
      'Phases du chantier [PROJECT]',
      'Étapes du projet [PROJECT]',
      'Avancement des phases [PROJECT]',
      'État des étapes [PROJECT]',
      'Progression des phases [PROJECT]',
      'Liste des étapes [PROJECT]',
      'Phases de travail [PROJECT]',
      'Étapes de construction [PROJECT]',
      'Planning des phases [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.project_stages.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { reference: { contains: project, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          name: true,
          status: true,
          start_date: true,
          end_date: true,
          completion_percentage: true,
          estimated_hours: true,
          actual_hours: true,
          project_staff: {
            select: {
              staff: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
          tasks: {
            where: {
              status: {
                not: 'termine',
              },
            },
            select: {
              label: true,
              status: true,
              due_date: true,
              priority: true,
            },
          },
        },
        orderBy: {
          order_index: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      "Détails des étapes d'un projet spécifique avec leur statut et les tâches associées",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_materials: {
    keywords: [
      'matériau',
      'projet',
      'chantier',
      'liste',
      'stock',
      'utilisé',
      'prévu',
      'inventaire',
    ],
    questions: [
      'Quels sont les matériaux du projet [PROJECT] ?',
      'Matériaux du chantier [PROJECT]',
      'Liste des matériaux [PROJECT]',
      'Matériaux utilisés [PROJECT]',
      'Matériaux prévus [PROJECT]',
      'Stock matériaux [PROJECT]',
      'Matériaux nécessaires [PROJECT]',
      'Matériaux commandés [PROJECT]',
      'Matériaux livrés [PROJECT]',
      'Inventaire matériaux [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.project_materials.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { reference: { contains: project, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          materials: {
            select: {
              name: true,
              reference: true,
              unit: true,
            },
          },
          quantity_planned: true,
          quantity_used: true,
          unit_price: true,
          project_stages: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          materials: {
            name: 'asc',
          },
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des matériaux prévus et utilisés pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_documents: {
    keywords: [
      'document',
      'projet',
      'chantier',
      'fichier',
      'papier',
      'archive',
      'technique',
      'administratif',
    ],
    questions: [
      'Quels sont les documents du projet [PROJECT] ?',
      'Documents du chantier [PROJECT]',
      'Liste des documents [PROJECT]',
      'Documents associés [PROJECT]',
      'Fichiers du projet [PROJECT]',
      'Documents de chantier [PROJECT]',
      'Papiers du projet [PROJECT]',
      'Documents techniques [PROJECT]',
      'Archives du projet [PROJECT]',
      'Documents administratifs [PROJECT]',
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
          file_path: true,
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
    description: 'Liste de tous les documents associés à un projet',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_reports: {
    keywords: [
      'rapport',
      'projet',
      'chantier',
      'compte rendu',
      'technique',
      'avancement',
      'intervention',
      'visite',
      'suivi',
      'contrôle',
    ],
    questions: [
      'Quels sont les rapports du projet [PROJECT] ?',
      'Rapports de chantier [PROJECT]',
      'Comptes rendus [PROJECT]',
      'Rapports techniques [PROJECT]',
      'Rapports d avancement [PROJECT]',
      'Rapports d intervention [PROJECT]',
      'Rapports de visite [PROJECT]',
      'Rapports de suivi [PROJECT]',
      'Rapports de contrôle [PROJECT]',
      'Rapports de qualité [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.site_reports.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { reference: { contains: project, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          report_type: true,
          description: true,
          status: true,
          created_at: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des rapports de chantier pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_costs: {
    keywords: [
      'coût',
      'budget',
      'projet',
      'dépense',
      'total',
      'réel',
      'prévu',
      'construction',
      'consommé',
    ],
    questions: [
      'Quels sont les coûts du projet [PROJECT] ?',
      'Budget du projet [PROJECT]',
      'Coûts du chantier [PROJECT]',
      'Dépenses du projet [PROJECT]',
      'Coût total [PROJECT]',
      'Budget prévu [PROJECT]',
      'Coûts réels [PROJECT]',
      'Dépenses actuelles [PROJECT]',
      'Coûts de construction [PROJECT]',
      'Budget consommé [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.projects.findFirst({
        where: {
          OR: [
            { name: { contains: project, mode: 'insensitive' } },
            { reference: { contains: project, mode: 'insensitive' } },
          ],
        },
        select: {
          budget: true,
          actual_cost: true,
          margin: true,
          project_materials: {
            select: {
              quantity_planned: true,
              quantity_used: true,
              unit_price: true,
              materials: {
                select: {
                  name: true,
                },
              },
            },
          },
          documents: {
            where: {
              type: {
                in: ['facture', 'devis', 'acompte', 'situation'],
              },
            },
            select: {
              type: true,
              amount: true,
              payment_status: true,
              payment_date: true,
            },
          },
        },
      });
    },
    response_format: 'object',
    description: "Détails des coûts et du budget d'un projet",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_statistics: {
    keywords: [
      'statistique',
      'projet',
      'indicateur',
      'métrique',
      'chiffre',
      'progression',
      'performance',
      'suivi',
      'avancement',
    ],
    questions: [
      'Quelles sont les statistiques du projet [PROJECT] ?',
      'Statistiques du chantier [PROJECT]',
      'Indicateurs du projet [PROJECT]',
      'Métriques du projet [PROJECT]',
      'Chiffres clés [PROJECT]',
      'Statistiques de progression [PROJECT]',
      'Indicateurs de performance [PROJECT]',
      'Métriques de suivi [PROJECT]',
      'Statistiques d avancement [PROJECT]',
      'Chiffres du projet [PROJECT]',
    ],
    prisma: async (project: string) => {
      const projectData = await prisma.projects.findFirst({
        where: {
          OR: [
            { name: { contains: project, mode: 'insensitive' } },
            { reference: { contains: project, mode: 'insensitive' } },
          ],
        },
        select: {
          project_stages: {
            select: {
              completion_percentage: true,
              estimated_hours: true,
              actual_hours: true,
              status: true,
            },
          },
          project_staff: {
            select: {
              hours_planned: true,
              hours_worked: true,
            },
          },
          project_materials: {
            select: {
              quantity_planned: true,
              quantity_used: true,
            },
          },
          time_logs: {
            select: {
              check_in: true,
              check_out: true,
            },
          },
        },
      });

      if (!projectData) return null;

      const stats = {
        stages: {
          total: projectData.project_stages.length,
          completed: projectData.project_stages.filter(
            (s) => s.status === 'termine',
          ).length,
          average_completion:
            projectData.project_stages.reduce(
              (acc, stage) => acc + (stage.completion_percentage || 0),
              0,
            ) / projectData.project_stages.length,
        },
        hours: {
          planned: projectData.project_staff.reduce(
            (acc, staff) => acc + (staff.hours_planned || 0),
            0,
          ),
          worked: projectData.project_staff.reduce(
            (acc, staff) => acc + (staff.hours_worked || 0),
            0,
          ),
          estimated: projectData.project_stages.reduce(
            (acc, stage) => acc + (stage.estimated_hours || 0),
            0,
          ),
          actual: projectData.project_stages.reduce(
            (acc, stage) => acc + (stage.actual_hours || 0),
            0,
          ),
        },
        materials: {
          planned: projectData.project_materials.reduce(
            (acc, material) => acc + (material.quantity_planned || 0),
            0,
          ),
          used: projectData.project_materials.reduce(
            (acc, material) => acc + (material.quantity_used || 0),
            0,
          ),
        },
        time_logs: {
          total_entries: projectData.time_logs.length,
          total_hours: projectData.time_logs.reduce((acc, log) => {
            if (!log.check_out) return acc;
            const hours =
              (log.check_out.getTime() - log.check_in.getTime()) /
              (1000 * 60 * 60);
            return acc + hours;
          }, 0),
        },
      };

      return stats;
    },
    response_format: 'object',
    description:
      "Statistiques détaillées sur l'avancement et les performances d'un projet",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_timeline: {
    keywords: [
      'chronologie',
      'projet',
      'historique',
      'timeline',
      'événement',
      'étape',
      'phase',
      'intervention',
      'travaux',
      'réalisation',
    ],
    questions: [
      'Quelle est la chronologie du projet [PROJECT] ?',
      'Historique du projet [PROJECT]',
      'Timeline du chantier [PROJECT]',
      'Chronologie des événements [PROJECT]',
      'Historique des actions [PROJECT]',
      'Timeline des étapes [PROJECT]',
      'Chronologie des phases [PROJECT]',
      'Historique des interventions [PROJECT]',
      'Timeline des travaux [PROJECT]',
      'Chronologie des réalisations [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.events.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { reference: { contains: project, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          title: true,
          description: true,
          event_type: true,
          start_date: true,
          end_date: true,
          status: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: "Chronologie complète des événements et actions d'un projet",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  most_profitable_projects: {
    keywords: ['rentable', 'profitable', 'marge', 'bénéfice', 'gain', 'rendement'],
    questions: [
      'Quels sont les projets les plus rentables ?',
      'Projets avec la meilleure marge',
      'Projets les plus profitables',
      'Top projets par rentabilité',
      'Projets avec le meilleur bénéfice',
      'Classement des projets par profit'
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        select: {
          id: true,
          name: true,
          reference: true,
          budget: true,
          actual_cost: true,
          margin: true,
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true
            }
          }
        },
        orderBy: {
          margin: 'desc'
        },
        take: 10
      });
    },
    response_format: 'table',
    description: 'Liste des 10 projets les plus rentables par marge'
  },

   projects_without_documents: {
    keywords: ['aucun document', 'manque', 'vide', 'sans papier'],
    questions: [
      'Projets sans documents',
      'Chantiers sans fichier associé',
      'Liste des projets sans documents liés',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          documents: { none: {} },
        },
        select: {
          id: true,
          name: true,
          reference: true,
          status: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets qui ne possèdent aucun document associé.'
  },

  projects_with_late_stages: {
    keywords: ['retard', 'étape', 'non terminé', 'en attente'],
    questions: [
      'Projets avec des étapes en retard',
      'Étapes dépassées non complètes',
      'Chantiers dont les étapes sont en retard',
    ],
    prisma: async () => {
      const today = new Date();
      return await prisma.projects.findMany({
        where: {
          project_stages: {
            some: {
              end_date: { lt: today },
              status: { not: 'termine' },
            },
          },
        },
        select: {
          id: true,
          name: true,
          reference: true,
          project_stages: {
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
    description: 'Projets ayant des étapes dont les dates de fin sont dépassées sans finalisation.'
  },

  projects_without_assigned_staff: {
    keywords: ['aucun staff', 'sans employé', 'non attribué'],
    questions: [
      'Projets sans staff attribué',
      'Chantiers sans intervenants',
      'Qui n\'est pas encore assigné à un projet ?',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          project_staff: { none: {} },
        },
        select: {
          id: true,
          name: true,
          reference: true,
          status: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets n\'ayant encore aucun membre du personnel affecté.'
  },

  recently_finished_projects: {
    keywords: ['terminé', 'achevé', 'clôturé', 'récemment'],
    questions: [
      'Projets terminés récemment',
      'Chantiers clôturés dans le mois',
      'Quels projets viennent d\'être terminés ?'
    ],
    prisma: async () => {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return await prisma.projects.findMany({
        where: {
          status: 'termine',
          end_date: { gte: monthAgo },
        },
        select: {
          id: true,
          name: true,
          reference: true,
          end_date: true,
        },
      });
    },
    response_format: 'table',
    description: 'Projets terminés dans le mois précédent.'
  },

  projects_with_high_staff_rotation: {
    keywords: ['rotation', 'changement', 'turnover', 'personnel'],
    questions: [
      'Projets avec beaucoup de rotation de personnel',
      'Chantiers avec nombreux changements d\'équipes',
      'Liste des projets à forte instabilité RH',
    ],
    prisma: async () => {
      const list = await prisma.projects.findMany({
        include: {
          project_staff: true,
        },
      });
      return list
        .map((p) => ({
          id: p.id,
          name: p.name,
          reference: p.reference,
          staff_count: p.project_staff.length,
        }))
        .filter((p) => p.staff_count > 5);
    },
    response_format: 'table',
    description: 'Projets où plus de 5 intervenants différents ont été affectés.'
  },
  projects_with_budget_overrun: {
    keywords: ['dépassement', 'budget', 'surcoût', 'coût excessif'],
    questions: [
      'Projets avec dépassement de budget',
      'Quels chantiers ont dépassé le budget prévu ?',
      'Surcoût sur projet',
      'Liste des projets en dépassement budgétaire'
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          actual_cost: {
            gt: prisma.projects.fields.budget,
          },
        },
        select: {
          id: true,
          name: true,
          budget: true,
          actual_cost: true,
          margin: true,
        },
        orderBy: {
          actual_cost: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Projets dont le coût réel dépasse le budget initial.',
  },

  projects_with_most_materials: {
    keywords: ['matériaux', 'quantité', 'consommation', 'stock'],
    questions: [
      'Quels projets utilisent le plus de matériaux ?',
      'Projets à forte consommation de matériaux',
      'Chantiers avec beaucoup de matériaux',
    ],
    prisma: async () => {
      const projects = await prisma.projects.findMany({
        include: {
          project_materials: true,
        },
      });
      return projects
        .map((p) => ({
          id: p.id,
          name: p.name,
          material_count: p.project_materials.length,
        }))
        .sort((a, b) => b.material_count - a.material_count);
    },
    response_format: 'table',
    description: 'Classement des projets selon la diversité des matériaux utilisés.',
  },

  long_duration_projects: {
    keywords: ['durée', 'long', 'prolongé', 'temps'],
    questions: [
      'Quels sont les projets les plus longs ?',
      'Chantiers à longue durée',
      'Projets prolongés',
    ],
    prisma: async () => {
      const list = await prisma.projects.findMany({
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
        },
      });
      return list
        .map((p) => ({
          ...p,
          duration_days: p.end_date && p.start_date ? Math.ceil((p.end_date.getTime() - p.start_date.getTime()) / (1000 * 60 * 60 * 24)) : null,
        }))
        .filter((p) => p.duration_days !== null)
        .sort((a, b) => b.duration_days! - a.duration_days!);
    },
    response_format: 'table',
    description: 'Liste des projets avec la durée la plus longue.',
  },

  projects_with_no_progress: {
    keywords: ['aucun avancement', 'bloqué', 'immobile', 'gelé'],
    questions: [
      'Projets sans avancement',
      'Chantiers bloqués',
      'Quels projets sont à l\'arrêt ?',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          project_stages: {
            every: {
              completion_percentage: 0,
            },
          },
        },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });
    },
    response_format: 'table',
    description: 'Projets avec aucune progression sur leurs étapes.',
  },

  projects_nearing_deadline: {
    keywords: ['proche', 'deadline', 'fin', 'urgents'],
    questions: [
      'Projets proches de leur date de fin',
      'Chantiers urgents à finaliser',
      'Quels projets finissent bientôt ?'
    ],
    prisma: async () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 7);
      return await prisma.projects.findMany({
        where: {
          end_date: {
            lte: soon,
            gte: new Date(),
          },
          status: {
            not: 'termine',
          },
        },
        select: {
          id: true,
          name: true,
          end_date: true,
          status: true,
        },
        orderBy: {
          end_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets devant être terminés sous 7 jours.',
  },

  projects_by_client: {
    keywords: ['client', 'répartir', 'regrouper'],
    questions: [
      'Projets par client',
      'Quels projets pour [CLIENT] ?',
      'Liste des chantiers de [CLIENT]'
    ],
    prisma: async (client: string) => {
      return await prisma.projects.findMany({
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
          name: true,
          reference: true,
          status: true,
          start_date: true,
          end_date: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets attribués à un client spécifique.',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom ou société du client',
      },
    ],
  },

  cancelled_projects: {
    keywords: ['annulé', 'abandonné', 'stoppé', 'interrompu'],
    questions: [
      'Projets annulés',
      'Chantiers abandonnés',
      'Liste des projets interrompus'
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          status: 'annule',
        },
        select: {
          id: true,
          name: true,
          reference: true,
          end_date: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets officiellement annulés.',
  },

  projects_with_missing_info: {
    keywords: ['manque', 'incomplet', 'donnée absente', 'erreur'],
    questions: [
      'Projets avec données manquantes',
      'Quels projets ont des informations incomplètes ?',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          OR: [
            { name: { equals: '' } },
            { reference: { equals: '' } },
            { status: null },
          ],
        },
        select: {
          id: true,
          name: true,
          reference: true,
          status: true,
        },
      });
    },
    response_format: 'table',
    description: 'Projets dont certaines informations clés sont absentes.',
  },

  projects_with_inconsistent_dates: {
    keywords: ['date invalide', 'erreur date', 'cohérence'],
    questions: [
      'Projets avec incohérences de dates',
      'Début après fin de projet',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          start_date: {
            gt: prisma.projects.fields.end_date,
          },
        },
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
        },
      });
    },
    response_format: 'table',
    description: 'Projets avec incohérences entre date de début et de fin.',
  },

  project_tags_overview: {
    keywords: ['tag', 'catégorie', 'type de projet'],
    questions: [
      'Répartition des projets par tags',
      'Statistiques par type de projet',
    ],
    prisma: async () => {
      const tags = await prisma.tags.findMany({
        select: {
          id: true,
          label: true,
          color: true,
          project_tags: {
            select: {
              project_id: true
            }
          }
        }
      });
      
      return tags.map((tag) => ({
        tag: tag.label,
        color: tag.color,
        count: tag.project_tags.length
      })).sort((a, b) => b.count - a.count);
    },
    response_format: 'table',
    description: "Vue d'ensemble de la répartition des projets par tag/catégorie.",
  },
  budget_overruns: {
    keywords: ['dépassement', 'budget', 'coût', 'prévu', 'réel'],
    questions: [
      'Quels projets ont dépassé leur budget ?',
      'Projets en dépassement de budget',
      'Chantiers avec coûts supérieurs au budget',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          actual_cost: {
            gt: prisma.projects.fields.budget,
          },
        },
        select: {
          name: true,
          budget: true,
          actual_cost: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets dont les coûts ont dépassé le budget initial.'
  },

  highest_material_consumption_projects: {
    keywords: ['matériaux', 'quantité', 'consommation'],
    questions: [
      'Quels projets consomment le plus de matériaux ?',
      'Projets avec la plus grande quantité de matériaux',
    ],
    prisma: async () => {
      const all = await prisma.projects.findMany({
        include: { project_materials: true },
      });
      return all.map((p) => ({
        name: p.name,
        material_count: p.project_materials.length,
      })).sort((a, b) => b.material_count - a.material_count);
    },
    response_format: 'table',
    description: 'Projets classés par volume de matériaux consommés.'
  },

  longest_projects: {
    keywords: ['long', 'durée', 'chantier', 'étalé'],
    questions: [
      'Quels sont les projets les plus longs ?',
      'Chantiers avec durée étalée',
    ],
    prisma: async () => {
      const projects = await prisma.projects.findMany({
        select: {
          name: true,
          start_date: true,
          end_date: true,
        },
      });
      return projects.map((p) => {
        const duration = p.end_date && p.start_date ?
          (p.end_date.getTime() - p.start_date.getTime()) / (1000 * 60 * 60 * 24) : 0;
        return { name: p.name, duration_days: duration };
      }).sort((a, b) => b.duration_days - a.duration_days);
    },
    response_format: 'table',
    description: 'Classement des projets par durée totale estimée.'
  },

  stalled_projects: {
    keywords: ['inactif', 'bloqué', 'aucun avancement'],
    questions: [
      'Quels projets sont bloqués ?',
      'Projets sans progression',
    ],
    prisma: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return await prisma.projects.findMany({
        where: {
          updated_at: { lt: threeMonthsAgo },
          status: 'en_cours',
        },
        select: {
          name: true,
          updated_at: true,
        },
      });
    },
    response_format: 'table',
    description: 'Projets actifs sans mise à jour depuis plus de 3 mois.'
  },

  nearing_deadline_projects: {
    keywords: ['échéance', 'deadline', 'bientôt terminé'],
    questions: [
      'Quels projets sont proches de leur échéance ?',
      'Projets à terminer bientôt',
    ],
    prisma: async () => {
      const in15Days = new Date();
      in15Days.setDate(in15Days.getDate() + 15);
      return await prisma.projects.findMany({
        where: {
          end_date: {
            lte: in15Days,
            gte: new Date(),
          },
        },
        select: {
          name: true,
          end_date: true,
        },
        orderBy: {
          end_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets dont la fin est prévue dans les 15 prochains jours.'
  },

  client_projects: {
    keywords: ['client', 'chantier client', 'par entreprise'],
    questions: [
      'Quels projets pour le client [CLIENT] ?',
      'Chantiers de [CLIENT]',
    ],
    prisma: async (client: string) => {
      return await prisma.projects.findMany({
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
          name: true,
          reference: true,
          status: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets associés à un client spécifique.',
    parameters: [
      {
        name: 'CLIENT',
        description: 'Nom ou société du client',
      },
    ]
  },

  terminated_projects: {
    keywords: ['annulé', 'projet terminé prématurément'],
    questions: [
      'Quels projets ont été annulés ?',
      'Liste des projets annulés',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          status: 'annule',
        },
        select: {
          name: true,
          reference: true,
          notes: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets annulés avec notes explicatives si disponibles.'
  },

  projects_missing_data: {
    keywords: ['incomplet', 'données manquantes', 'champs vides'],
    questions: [
      'Quels projets ont des données manquantes ?',
      'Projets incomplets',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          OR: [
            { budget: null },
            { actual_cost: null },
            { start_date: null },
            { end_date: null },
          ],
        },
        select: {
          name: true,
          budget: true,
          actual_cost: true,
          start_date: true,
          end_date: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets comportant des informations incomplètes.'
  },

  inconsistent_project_dates: {
    keywords: ['date incohérente', 'problème de planning'],
    questions: [
      'Quels projets ont des dates incohérentes ?',
      'Projets dont la date de fin est avant le début',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          end_date: {
            lt: prisma.projects.fields.start_date,
          },
        },
        select: {
          name: true,
          start_date: true,
          end_date: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des projets où la date de fin est antérieure à la date de début.'
  },

  projects_tag_distribution: {
    keywords: ['tags', 'répartition', 'catégorie'],
    questions: [
      'Répartition des projets par tag',
      'Combien de projets par tag ?',
    ],
    prisma: async () => {
      const all = await prisma.projects.findMany({
        include: {
          project_tags: {
            select: {
              tags: {
                select: { label: true },
              },
            },
          },
        },
      });
      const tagMap = new Map();
      for (const p of all) {
        for (const pt of p.project_tags) {
          const label = pt.tags.label;
          tagMap.set(label, (tagMap.get(label) || 0) + 1);
        }
      }
      return Array.from(tagMap.entries()).map(([tag, count]) => ({ tag, count }));
    },
    response_format: 'table',
    description: 'Nombre de projets associés à chaque tag.'
  },
};
