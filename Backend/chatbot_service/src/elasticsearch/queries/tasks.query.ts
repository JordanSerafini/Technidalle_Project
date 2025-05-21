import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const tasksQueries = {
  tasks_list: {
    keywords: [
      'tâche',
      'liste',
      'travail',
      'activité',
      'à faire',
      'en cours',
      'planning',
      'chantier',
    ],
    questions: [
      'Liste des tâches',
      'Toutes les tâches',
      'Tâches en cours',
      'Tâches à faire',
      'Planning des tâches',
      'Activités à réaliser',
      'Tâches assignées',
      'Planification des travaux',
      'Liste des travaux',
      'Programme de tâches',
    ],
    prisma: async () => {
      return await prisma.tasks.findMany({
        where: {
          status: {
            not: 'termine',
          },
        },
        select: {
          label: true,
          description: true,
          status: true,
          due_date: true,
          priority: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
        orderBy: [{ due_date: 'asc' }, { priority: 'desc' }],
      });
    },
    response_format: 'table',
    description: 'Liste de toutes les tâches non terminées',
  },

  tasks_by_staff: {
    keywords: [
      'tâche',
      'personnel',
      'affecté',
      'assigné',
      'employé',
      'responsable',
      'technicien',
      'travail',
    ],
    questions: [
      'Tâches de [STAFF]',
      'Quelles tâches pour [STAFF] ?',
      'Travaux assignés à [STAFF]',
      'Planning de [STAFF]',
      'Tâches attribuées à [STAFF]',
      'Responsabilités de [STAFF]',
      'Liste des tâches de [STAFF]',
      'Activités de [STAFF]',
      'Que doit faire [STAFF] ?',
      'Programme de travail de [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.tasks.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
          status: {
            not: 'termine',
          },
        },
        select: {
          label: true,
          description: true,
          status: true,
          due_date: true,
          priority: true,
          project_stages: {
            select: {
              name: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
        orderBy: [{ due_date: 'asc' }, { priority: 'desc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste des tâches assignées à un membre du personnel spécifique',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  tasks_by_project: {
    keywords: [
      'tâche',
      'projet',
      'chantier',
      'travail',
      'mission',
      'programme',
      'planning',
      'activité',
    ],
    questions: [
      'Tâches du projet [PROJECT]',
      'Quelles tâches pour [PROJECT] ?',
      'Travaux sur [PROJECT]',
      'Planning de [PROJECT]',
      'Tâches liées à [PROJECT]',
      'Liste des tâches pour [PROJECT]',
      'Activités du projet [PROJECT]',
      'Que reste-t-il à faire pour [PROJECT] ?',
      'Programme de travail [PROJECT]',
      'Planning chantier [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.tasks.findMany({
        where: {
          project_stages: {
            projects: {
              OR: [
                { name: { contains: project, mode: 'insensitive' } },
                { reference: { contains: project, mode: 'insensitive' } },
              ],
            },
          },
        },
        select: {
          label: true,
          description: true,
          status: true,
          due_date: true,
          priority: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
              status: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { due_date: 'asc' }, { priority: 'desc' }],
      });
    },
    response_format: 'table',
    description: 'Liste des tâches associées à un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  overdue_tasks: {
    keywords: [
      'retard',
      'dépassé',
      'échéance',
      'date limite',
      'en souffrance',
      'non terminé',
      'expiré',
      'délai',
    ],
    questions: [
      'Tâches en retard',
      'Retards de tâches',
      'Tâches dépassées',
      'Échéances manquées',
      'Tâches non réalisées à temps',
      'Retards de travaux',
      'Tâches avec délai dépassé',
      'Retards de planning',
      'Tâches hors délai',
      'Travaux en retard',
    ],
    prisma: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      return await prisma.tasks.findMany({
        where: {
          due_date: {
            lt: today,
          },
          status: {
            not: 'termine',
          },
        },
        select: {
          label: true,
          description: true,
          status: true,
          due_date: true,
          priority: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
        orderBy: [{ due_date: 'asc' }, { priority: 'desc' }],
      });
    },
    response_format: 'table',
    description:
      "Liste des tâches en retard (date d'échéance dépassée et non terminées)",
  },

  high_priority_tasks: {
    keywords: [
      'priorité',
      'urgent',
      'important',
      'critique',
      'essentiel',
      'immédiat',
      'primordial',
      'pressant',
    ],
    questions: [
      'Tâches prioritaires',
      'Tâches urgentes',
      'Priorités',
      'Travaux prioritaires',
      'Tâches à haute priorité',
      'Urgences à traiter',
      'Tâches critiques',
      'Activités prioritaires',
      'Travaux urgents',
      'Tâches importantes',
    ],
    prisma: async () => {
      return await prisma.tasks.findMany({
        where: {
          priority: {
            gte: 8, // Considère les tâches avec priorité ≥ 8 comme "haute priorité"
          },
          status: {
            not: 'termine',
          },
        },
        select: {
          label: true,
          description: true,
          status: true,
          due_date: true,
          priority: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { due_date: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste des tâches à haute priorité (priorité ≥ 8)',
  },

  project_stages: {
    keywords: [
      'étape',
      'phase',
      'stade',
      'progression',
      'avancement',
      'cycle',
      'séquence',
      'projet',
    ],
    questions: [
      'Étapes des projets',
      'Phases des chantiers',
      'Liste des étapes',
      'Quelles sont les étapes de projet ?',
      'Phases de travail',
      'Étapes de construction',
      'Stades des projets',
      'Planification des étapes',
      'Phases en cours',
      'Organisation des travaux',
    ],
    prisma: async () => {
      return await prisma.project_stages.findMany({
        where: {
          status: {
            not: 'termine',
          },
        },
        select: {
          name: true,
          description: true,
          status: true,
          start_date: true,
          end_date: true,
          completion_percentage: true,
          projects: {
            select: {
              name: true,
              reference: true,
              status: true,
            },
          },
          tasks: {
            select: {
              label: true,
              status: true,
              due_date: true,
              priority: true,
            },
            where: {
              status: {
                not: 'termine',
              },
            },
            take: 5,
          },
        },
        orderBy: [
          {
            projects: {
              name: 'asc',
            },
          },
          { order_index: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des étapes de projets non terminées',
  },

  project_stages_by_project: {
    keywords: [
      'étape',
      'phase',
      'projet',
      'chantier',
      'progression',
      'découpage',
      'organisation',
      'structure',
    ],
    questions: [
      'Étapes du projet [PROJECT]',
      'Phases du chantier [PROJECT]',
      'Avancement [PROJECT]',
      'Planning [PROJECT]',
      'Organisation [PROJECT]',
      'Structure du projet [PROJECT]',
      'Plan du projet [PROJECT]',
      'Étapes de construction [PROJECT]',
      'Découpage du projet [PROJECT]',
      'Plan de travail [PROJECT]',
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
          description: true,
          status: true,
          start_date: true,
          end_date: true,
          order_index: true,
          completion_percentage: true,
          estimated_duration: true,
          estimated_hours: true,
          actual_duration: true,
          actual_hours: true,
          project_staff: {
            select: {
              staff: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
              role_description: true,
            },
          },
          tasks: {
            select: {
              label: true,
              status: true,
              due_date: true,
              priority: true,
              staff: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
            orderBy: [{ status: 'asc' }, { due_date: 'asc' }],
          },
        },
        orderBy: {
          order_index: 'asc',
        },
      });
    },
    response_format: 'object',
    description:
      "Liste des étapes d'un projet spécifique avec leur avancement et les tâches associées",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  stage_checklists: {
    keywords: [
      'checklist',
      'vérification',
      'contrôle',
      'validation',
      'qualité',
      'point',
      'inspection',
      'test',
    ],
    questions: [
      'Checklists des étapes',
      'Points de contrôle',
      'Vérifications à faire',
      'Liste de contrôle',
      'Checklists techniques',
      'Points à vérifier',
      'Contrôles qualité',
      'Validations techniques',
      'Items de vérification',
      'Checklists chantier',
    ],
    prisma: async () => {
      return await prisma.stage_checklists.findMany({
        select: {
          label: true,
          is_done: true,
          comment: true,
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              name: true,
              status: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
        orderBy: [
          { is_done: 'asc' },
          {
            project_stages: {
              status: 'asc',
            },
          },
        ],
      });
    },
    response_format: 'table',
    description:
      'Liste des points de vérification (checklists) pour les étapes de projet',
  },

  task_completion_statistics: {
    keywords: [
      'statistique',
      'achèvement',
      'complétion',
      'avancement',
      'performance',
      'indicateur',
      'suivi',
      'analytique',
    ],
    questions: [
      'Statistiques de complétion des tâches',
      'Avancement des tâches',
      'Taux de réalisation',
      'Performance des tâches',
      "Analyse de l'avancement",
      "Statistiques d'achèvement",
      'Métriques de réalisation',
      'Suivi de complétion',
      "Indicateurs d'achèvement",
      'Tendances de réalisation',
    ],
    prisma: async () => {
      // Récupérer les tâches des 3 derniers mois
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const tasks = await prisma.tasks.findMany({
        where: {
          OR: [
            { due_date: { gte: threeMonthsAgo } },
            { created_at: { gte: threeMonthsAgo } },
          ],
        },
        select: {
          status: true,
          due_date: true,
          priority: true,
          staff: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
          project_stages: {
            select: {
              projects: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Statistiques générales
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task) => task.status === 'termine',
      ).length;
      const inProgressTasks = tasks.filter(
        (task) => task.status === 'en_cours',
      ).length;
      const pendingTasks = tasks.filter(
        (task) => task.status === 'à_faire',
      ).length;

      // Statistiques par membre du personnel
      const staffMap = new Map();
      tasks.forEach((task) => {
        if (task.staff) {
          const staffId = task.staff.id;
          if (!staffMap.has(staffId)) {
            staffMap.set(staffId, {
              name: `${task.staff.firstname} ${task.staff.lastname}`,
              total: 0,
              completed: 0,
              inProgress: 0,
              pending: 0,
            });
          }

          const staffStats = staffMap.get(staffId);
          staffStats.total++;

          if (task.status === 'termine') staffStats.completed++;
          else if (task.status === 'en_cours') staffStats.inProgress++;
          else if (task.status === 'à_faire') staffStats.pending++;
        }
      });

      // Statistiques par projet
      const projectMap = new Map();
      tasks.forEach((task) => {
        if (task.project_stages?.projects) {
          const projectId = task.project_stages.projects.id;
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              name: task.project_stages.projects.name,
              total: 0,
              completed: 0,
              inProgress: 0,
              pending: 0,
            });
          }

          const projectStats = projectMap.get(projectId);
          projectStats.total++;

          if (task.status === 'termine') projectStats.completed++;
          else if (task.status === 'en_cours') projectStats.inProgress++;
          else if (task.status === 'à_faire') projectStats.pending++;
        }
      });

      // Statistiques de retard
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueTasks = tasks.filter(
        (task) =>
          task.status !== 'termine' &&
          task.due_date &&
          new Date(task.due_date) < today,
      ).length;

      // Préparer les résultats
      return {
        general: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          in_progress_tasks: inProgressTasks,
          pending_tasks: pendingTasks,
          overdue_tasks: overdueTasks,
          completion_rate:
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0,
        },
        by_staff: Array.from(staffMap.values())
          .map((stats) => ({
            ...stats,
            completion_rate:
              stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0,
          }))
          .sort((a, b) => b.completion_rate - a.completion_rate),
        by_project: Array.from(projectMap.values())
          .map((stats) => ({
            ...stats,
            completion_rate:
              stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0,
          }))
          .sort((a, b) => b.completion_rate - a.completion_rate),
      };
    },
    response_format: 'object',
    description:
      'Analyse statistique de la complétion des tâches avec ventilation par projet et personnel',
  },
};
