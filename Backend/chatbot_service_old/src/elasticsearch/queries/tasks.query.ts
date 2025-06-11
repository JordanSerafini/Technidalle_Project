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

  tasks_due_this_week: {
    keywords: [
      'tâche',
      'semaine',
      'cette semaine',
      'à faire',
      'prochains jours',
      'échéance',
      'date limite',
      'planning',
    ],
    questions: [
      'Quelles tâches sont dues cette semaine ?',
      'Travaux à terminer cette semaine',
      'Échéances de la semaine',
      'Tâches à faire cette semaine',
      'Planning hebdomadaire des tâches',
      'À faire cette semaine',
      'Dates limites de la semaine',
      'Programme de la semaine',
      'Travaux à terminer cette semaine',
      'Planning hebdomadaire',
    ],
    prisma: async () => {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Dimanche
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Samedi
      endOfWeek.setHours(23, 59, 59, 999);

      return await prisma.tasks.findMany({
        where: {
          due_date: {
            gte: startOfWeek,
            lte: endOfWeek,
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
    description: 'Liste des tâches dont l\'échéance est prévue durant la semaine en cours',
  },

  tasks_recently_completed: {
    keywords: [
      'tâche',
      'terminé',
      'achevé',
      'fini',
      'complété',
      'récent',
      'dernière',
      'réalisation',
    ],
    questions: [
      'Quelles tâches ont été récemment terminées ?',
      'Dernières tâches achevées',
      'Travaux récemment complétés',
      'Tâches finies récemment',
      'Activités terminées dernièrement',
      'Réalisations récentes',
      'Dernières finalisations',
      'Tâches achevées dernièrement',
      'Réalisations de la semaine',
      'Travaux récemment finis',
    ],
    prisma: async () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      return await prisma.tasks.findMany({
        where: {
          status: 'termine',
          updated_at: {
            gte: twoWeeksAgo,
          },
        },
        select: {
          label: true,
          description: true,
          updated_at: true,
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
        orderBy: {
          updated_at: 'desc',
        },
        take: 20,
      });
    },
    response_format: 'table',
    description: 'Liste des 20 dernières tâches terminées au cours des deux dernières semaines',
  },

  staff_without_tasks: {
    keywords: [
      'personnel',
      'employé',
      'sans tâche',
      'libre',
      'disponible',
      'non assigné',
      'ressources',
      'équipe',
    ],
    questions: [
      'Quels employés n\'ont pas de tâches assignées ?',
      'Personnel sans tâches',
      'Membres de l\'équipe disponibles',
      'Qui n\'a pas de travail assigné ?',
      'Employés libres',
      'Personnel disponible',
      'Ressources non assignées',
      'Staff sans affectation',
      'Équipe non occupée',
      'Qui est libre actuellement ?',
    ],
    prisma: async () => {
      return await prisma.staff.findMany({
        where: {
          is_available: true,
          tasks: {
            none: {
              status: {
                not: 'termine',
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          roles: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: [
          { lastname: 'asc' },
          { firstname: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste du personnel qui n\'a pas de tâches actives assignées',
  },

  unassigned_tasks: {
    keywords: [
      'tâche',
      'non assigné',
      'sans responsable',
      'non attribué',
      'sans personnel',
      'orphelin',
      'sans assignation',
    ],
    questions: [
      'Quelles tâches n\'ont pas de responsable ?',
      'Tâches non assignées',
      'Travaux sans responsable',
      'Tâches sans personnel',
      'Activités non attribuées',
      'Tâches orphelines',
      'Quelles tâches sont sans affectation ?',
      'Tâches sans assignation',
      'Travaux non affectés',
      'Tâches à attribuer',
    ],
    prisma: async () => {
      return await prisma.tasks.findMany({
        where: {
          assigned_to: null,
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
        orderBy: [
          { due_date: 'asc' },
          { priority: 'desc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des tâches qui n\'ont pas encore été assignées à un membre du personnel',
  },

  tasks_by_status: {
    keywords: [
      'tâche',
      'statut',
      'état',
      'filtre',
      'à faire',
      'en cours',
      'terminé',
      'bloqué',
    ],
    questions: [
      'Quelles sont les tâches avec le statut [STATUS] ?',
      'Tâches [STATUS]',
      'Liste des tâches [STATUS]',
      'Travaux en [STATUS]',
      'Filtrer tâches [STATUS]',
      'Afficher tâches [STATUS]',
      'Activités [STATUS]',
      'Voir tâches [STATUS]',
      'Tâches de statut [STATUS]',
      'État [STATUS] des tâches',
    ],
    prisma: async (status: string) => {
      const statusMap: { [key: string]: string } = {
        'à faire': 'à_faire',
        'en cours': 'en_cours',
        'terminé': 'termine',
        'termine': 'termine',
        'bloqué': 'bloque',
        'bloque': 'bloque',
      };
      
      // Normaliser le statut saisi
      const normalizedStatus = statusMap[status.toLowerCase()] || status;
      
      return await prisma.tasks.findMany({
        where: {
          status: normalizedStatus,
        },
        select: {
          label: true,
          description: true,
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
        orderBy: [
          { due_date: 'asc' },
          { priority: 'desc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des tâches filtrées par un statut spécifique',
    parameters: [
      {
        name: 'STATUS',
        description: 'Statut de la tâche (à_faire, en_cours, termine, bloque)',
      },
    ],
  },

  tasks_by_priority_range: {
    keywords: [
      'tâche',
      'priorité',
      'importance',
      'niveau',
      'plage',
      'fourchette',
      'entre',
      'intervalle',
    ],
    questions: [
      'Quelles tâches ont une priorité entre [MIN_PRIORITY] et [MAX_PRIORITY] ?',
      'Tâches priorité [MIN_PRIORITY]-[MAX_PRIORITY]',
      'Priorité [MIN_PRIORITY] à [MAX_PRIORITY]',
      'Tâches de niveau [MIN_PRIORITY] à [MAX_PRIORITY]',
      'Activités priorité [MIN_PRIORITY]-[MAX_PRIORITY]',
      'Travaux d\'importance [MIN_PRIORITY]-[MAX_PRIORITY]',
      'Plage de priorité [MIN_PRIORITY]-[MAX_PRIORITY]',
      'Tâches entre [MIN_PRIORITY] et [MAX_PRIORITY]',
      'Filtre priorité [MIN_PRIORITY] à [MAX_PRIORITY]',
      'Fourchette [MIN_PRIORITY]-[MAX_PRIORITY]',
    ],
    prisma: async (minPriority: string, maxPriority: string) => {
      const min = parseInt(minPriority);
      const max = parseInt(maxPriority);
      
      return await prisma.tasks.findMany({
        where: {
          priority: {
            gte: min,
            lte: max,
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
        orderBy: [
          { priority: 'desc' },
          { due_date: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des tâches dont la priorité est comprise dans une plage spécifique',
    parameters: [
      {
        name: 'MIN_PRIORITY',
        description: 'Priorité minimale (1 à 10)',
      },
      {
        name: 'MAX_PRIORITY',
        description: 'Priorité maximale (1 à 10)',
      },
    ],
  },

  tasks_due_by_date_range: {
    keywords: [
      'tâche',
      'date',
      'échéance',
      'période',
      'plage',
      'entre',
      'intervalle',
      'délai',
    ],
    questions: [
      'Quelles tâches sont dues entre [START_DATE] et [END_DATE] ?',
      'Tâches échéance [START_DATE] à [END_DATE]',
      'Travaux à faire entre [START_DATE] et [END_DATE]',
      'Échéances du [START_DATE] au [END_DATE]',
      'Planning entre [START_DATE] et [END_DATE]',
      'Tâches période [START_DATE]-[END_DATE]',
      'Activités planifiées [START_DATE]-[END_DATE]',
      'Dates limites entre [START_DATE] et [END_DATE]',
      'Programme [START_DATE] à [END_DATE]',
      'Délais du [START_DATE] au [END_DATE]',
    ],
    prisma: async (startDate: string, endDate: string) => {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      return await prisma.tasks.findMany({
        where: {
          due_date: {
            gte: start,
            lte: end,
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
        orderBy: [
          { due_date: 'asc' },
          { priority: 'desc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des tâches dont l\'échéance est comprise dans une plage de dates spécifique',
    parameters: [
      {
        name: 'START_DATE',
        description: 'Date de début (format YYYY-MM-DD)',
      },
      {
        name: 'END_DATE',
        description: 'Date de fin (format YYYY-MM-DD)',
      },
    ],
  },

  project_stages_at_risk: {
    keywords: [
      'étape',
      'risque',
      'retard',
      'délai',
      'dépassement',
      'problème',
      'alerte',
      'critique',
    ],
    questions: [
      'Quelles étapes de projet sont à risque ?',
      'Étapes en retard',
      'Phases de projet critiques',
      'Délais dépassés sur étapes',
      'Alertes sur planning',
      'Problèmes d\'avancement',
      'Étapes avec retard',
      'Phases critiques',
      'Risques sur planning',
      'Alertes sur étapes',
    ],
    prisma: async () => {
      const today = new Date();
      
      return await prisma.project_stages.findMany({
        where: {
          OR: [
            // Étapes dont la date de fin est dépassée mais pas terminées
            {
              end_date: {
                lt: today,
              },
              status: {
                not: 'termine',
              },
            },
            // Étapes avec un faible taux d'avancement par rapport au temps écoulé
            {
              start_date: {
                lt: today,
              },
              end_date: {
                gt: today,
              },
              completion_percentage: {
                lt: 30, // Moins de 30% de complétion
              },
            },
          ],
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
          _count: {
            select: {
              tasks: true,
            },
          },
        },
        orderBy: [
          {
            end_date: 'asc',
          },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des étapes de projet présentant des risques (retard, faible avancement, etc.)',
  },

  tasks_completion_trend: {
    keywords: [
      'tendance',
      'évolution',
      'progression',
      'historique',
      'achèvement',
      'temps',
      'suivi',
      'graphique',
    ],
    questions: [
      'Quelle est la tendance de complétion des tâches ?',
      'Évolution des tâches terminées',
      'Progression de l\'achèvement',
      'Historique de complétion',
      'Tendance des tâches finies',
      'Suivi de réalisation des tâches',
      'Graphique d\'évolution des tâches',
      'Progression sur la durée',
      'Complétion des tâches par période',
      'Analyse temporelle des tâches',
    ],
    prisma: async () => {
      // Définir les périodes d'analyse (6 dernières semaines)
      interface PeriodData {
        startDate: Date;
        endDate: Date;
        label: string;
      }
      
      const periods: PeriodData[] = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const startDate = new Date();
        startDate.setDate(now.getDate() - (i * 7 + 7));
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date();
        endDate.setDate(now.getDate() - (i * 7));
        endDate.setHours(23, 59, 59, 999);
        
        periods.push({
          startDate,
          endDate,
          label: `Semaine -${i+1}`,
        });
      }
      
      // Récupérer les données pour chaque période
      const results = await Promise.all(
        periods.map(async (period) => {
          // Tâches terminées dans cette période
          const completedTasks = await prisma.tasks.count({
            where: {
              status: 'termine',
              updated_at: {
                gte: period.startDate,
                lte: period.endDate,
              },
            },
          });
          
          // Tâches créées dans cette période
          const createdTasks = await prisma.tasks.count({
            where: {
              created_at: {
                gte: period.startDate,
                lte: period.endDate,
              },
            },
          });
          
          // Tâches en retard à la fin de cette période
          const overdueTasks = await prisma.tasks.count({
            where: {
              status: {
                not: 'termine',
              },
              due_date: {
                lt: period.endDate,
              },
            },
          });
          
          return {
            period: period.label,
            start_date: period.startDate,
            end_date: period.endDate,
            completed_tasks: completedTasks,
            created_tasks: createdTasks,
            overdue_tasks: overdueTasks,
            completion_ratio: createdTasks > 0 ? (completedTasks / createdTasks) : 0,
          };
        })
      );
      
      return results;
    },
    response_format: 'table',
    description: 'Analyse de la tendance de complétion des tâches sur les 6 dernières semaines',
  },

  project_stages_without_tasks: {
    keywords: [
      'étape',
      'sans tâche',
      'vide',
      'orphelin',
      'non planifié',
      'incomplet',
      'manque',
      'oubli',
    ],
    questions: [
      'Quelles étapes de projet n\'ont pas de tâches ?',
      'Étapes sans tâches associées',
      'Phases sans activités',
      'Étapes vides',
      'Phases orphelines',
      'Étapes non planifiées',
      'Étapes incomplètes',
      'Oublis dans les étapes',
      'Étapes sans planification',
      'Phases projet sans détail',
    ],
    prisma: async () => {
      return await prisma.project_stages.findMany({
        where: {
          tasks: {
            none: {},
          },
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
          projects: {
            select: {
              name: true,
              reference: true,
              status: true,
            },
          },
        },
        orderBy: [
          {
            projects: {
              name: 'asc',
            },
          },
          {
            start_date: 'asc',
          },
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des étapes de projet actives qui n\'ont aucune tâche associée',
  },

  repeated_task_assignments: {
    keywords: [
      'personnel',
      'surcharge',
      'trop',
      'multiple',
      'nombreux',
      'plusieurs',
      'multitâche',
      'distribution',
    ],
    questions: [
      'Qui a trop de tâches assignées ?',
      'Personnel surchargé',
      'Trop de tâches par personne',
      'Employés avec plusieurs tâches',
      'Multitâche personnel',
      'Assignations multiples',
      'Distribution des tâches par personne',
      'Qui est débordé ?',
      'Charge de travail excessive',
      'Trop d\'assignations',
    ],
    prisma: async () => {
      const staffWithTasks = await prisma.staff.findMany({
        where: {
          tasks: {
            some: {
              status: {
                not: 'termine',
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          _count: {
            select: {
              tasks: true,
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
              project_stages: {
                select: {
                  name: true,
                  projects: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Filtrer pour ne garder que les personnes avec plus de 3 tâches actives
      return staffWithTasks
        .filter(staff => staff._count.tasks > 3)
        .map(staff => ({
          id: staff.id,
          name: `${staff.firstname} ${staff.lastname}`,
          active_tasks_count: staff._count.tasks,
          high_priority_tasks: staff.tasks.filter(task => task.priority && task.priority >= 8).length,
          tasks: staff.tasks,
        }))
        .sort((a, b) => b.active_tasks_count - a.active_tasks_count);
    },
    response_format: 'object',
    description: 'Analyse du personnel avec de nombreuses tâches assignées (potentielle surcharge)',
  },

  checklist_completion_rate: {
    keywords: [
      'checklist',
      'contrôle',
      'vérification',
      'validation',
      'taux',
      'pourcentage',
      'complété',
      'progress',
    ],
    questions: [
      'Quel est le taux de complétion des checklists ?',
      'Pourcentage de validation des contrôles',
      'Avancement des checklists',
      'Taux d\'achèvement des vérifications',
      'Points de contrôle validés',
      'Progression des checklists',
      'Statistiques de validation',
      'Complétion des points de contrôle',
      'Avancement des vérifications',
      'Pourcentage de validation',
    ],
    prisma: async () => {
      // Récupérer les checklists par étape
      const stageWithChecklists = await prisma.project_stages.findMany({
        where: {
          stage_checklists: {
            some: {},
          },
        },
        select: {
          id: true,
          name: true,
          status: true,
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
          stage_checklists: {
            select: {
              id: true,
              label: true,
              is_done: true,
            },
          },
        },
      });
      
      // Calculer les statistiques
      return stageWithChecklists.map(stage => {
        const totalChecklists = stage.stage_checklists.length;
        const completedChecklists = stage.stage_checklists.filter(item => item.is_done).length;
        
        return {
          project: stage.projects?.name || 'N/A',
          stage_name: stage.name,
          stage_status: stage.status,
          total_items: totalChecklists,
          completed_items: completedChecklists,
          completion_rate: totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0,
        };
      }).sort((a, b) => b.completion_rate - a.completion_rate);
    },
    response_format: 'table',
    description: 'Analyse du taux de complétion des checklists par étape de projet',
  },
};
