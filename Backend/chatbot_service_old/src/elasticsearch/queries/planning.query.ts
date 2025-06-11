import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

interface EventCount {
  day: Date;
  event_count: number;
}

export const planningQueries = {
  staff_schedule_next_week: {
    keywords: [
      'planning',
      'semaine',
      'personnel',
      'employé',
      'travail',
      'équipe',
      'programmé',
      'prochaine',
      'pro',
      'travaille',
      'prévu',
      'horaire',
      'programme',
      'activité',
      'agenda',
    ],
    questions: [
      'Qui travaille la semaine prochaine ?',
      'Planning des employés pour la semaine prochaine',
      'Personnel programmé semaine pro',
      'Équipe de travail semaine prochaine',
      'Qui est prévu la semaine prochaine ?',
      'Planning semaine prochaine',
      'Qui travaille semaine pro ?',
      'Personnel prévu semaine prochaine',
      'Équipe semaine prochaine',
      'Planning personnel semaine prochaine',
      'Travail semaine prochaine',
      'Programme de travail semaine prochaine',
      'Qui va travailler semaine prochaine',
      'Employés présents semaine pro',
      'Horaires semaine prochaine',
      'Semaine prochaine travail',
      'Agenda semaine pro personnel',
      'Emploi du temps semaine prochaine',
      'Planning horaire semaine pro',
    ],
    prisma: async () => {
      const nextWeekStart = new Date();
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      nextWeekStart.setHours(0, 0, 0, 0);

      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
      nextWeekEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          time_logs: {
            some: {
              check_in: {
                gte: nextWeekStart,
                lte: nextWeekEnd,
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          time_logs: {
            where: {
              check_in: {
                gte: nextWeekStart,
                lte: nextWeekEnd,
              },
            },
            select: {
              check_in: true,
              check_out: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      "Planning du personnel pour la semaine prochaine avec leur nombre d'heures programmées",
  },

  events_today: {
    keywords: [
      'événement',
      'aujourd\'hui',
      'activité',
      'programme',
      'rendez-vous',
      'planning',
      'journée',
    ],
    questions: [
      "Quels sont les événements aujourd'hui ?",
      'Activités du jour',
      'Programme de la journée',
      "Rendez-vous d'aujourd'hui",
      "Quoi aujourd'hui ?",
      "Planning aujourd'hui",
      'Événements du jour',
      "Programme aujourd'hui",
      "Rendez-vous aujourd'hui",
      "Activités prévues aujourd'hui",
    ],
    prisma: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await prisma.events.findMany({
        where: {
          start_date: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: "Liste de tous les événements programmés pour aujourd'hui",
  },

  staff_availability_tomorrow: {
    keywords: [
      'disponible',
      'demain',
      'personnel',
      'libre',
      'membre',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui est disponible demain ?',
      'Personnel disponible demain',
      'Membres du staff libres demain',
      'Employés non planifiés pour demain',
      'Qui est dispo demain ?',
      'Personnel libre demain',
      'Staff disponible demain',
      'Employés disponibles demain',
      'Qui est libre demain ?',
      'Personnel non planifié demain',
    ],
    prisma: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            time_logs: {
              some: {
                check_in: {
                  gte: tomorrow,
                  lt: dayAfterTomorrow,
                },
              },
            },
          },
        },
        select: {
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
      'Liste du personnel disponible pour demain (sans entrées dans le planning)',
  },

  project_staff_distribution: {
    keywords: [
      'distribution',
      'répartition',
      'projet',
      'personnel',
      'équipe',
      'chantier',
      'ressource',
    ],
    questions: [
      'Comment sont distribués les employés sur les projets ?',
      'Répartition du personnel par projet',
      'Distribution des équipes par chantier',
      'Affectation des ressources humaines',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          status: 'en_cours',
        },
        select: {
          name: true,
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
          name: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      "Répartition du personnel sur les différents projets en cours, avec le nombre d'employés et la liste des membres par projet",
  },

  events_tomorrow: {
    keywords: [
      'événement',
      'demain',
      'activité',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements demain ?',
      'Activités de demain',
      'Programme pour demain',
      'Rendez-vous prévus demain',
      'Quoi demain ?',
      'Planning demain',
      'Événements de demain',
      'Programme demain',
      'Rendez-vous demain',
      'Activités prévues demain',
    ],
    prisma: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      return await prisma.events.findMany({
        where: {
          start_date: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste de tous les événements programmés pour demain',
  },

  events_this_week: {
    keywords: [
      'événement',
      'semaine',
      'activité',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements cette semaine ?',
      'Activités de la semaine',
      'Programme de la semaine en cours',
      'Rendez-vous de la semaine',
      'Quoi cette semaine ?',
      'Planning de la semaine',
      'Événements de la semaine',
      'Programme semaine',
      'Rendez-vous semaine',
      'Activités prévues cette semaine',
    ],
    prisma: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return await prisma.events.findMany({
        where: {
          start_date: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste de tous les événements programmés pour la semaine en cours',
  },

  events_next_week: {
    keywords: [
      'événement',
      'semaine',
      'prochaine',
      'activité',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements la semaine prochaine ?',
      'Activités de la semaine prochaine',
      'Programme de la semaine pro',
      'Rendez-vous semaine suivante',
      'Quoi semaine prochaine ?',
      'Planning semaine prochaine',
      'Événements semaine pro',
      'Programme semaine prochaine',
      'Rendez-vous semaine prochaine',
      'Activités prévues semaine prochaine',
    ],
    prisma: async () => {
      const nextWeekStart = new Date();
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      nextWeekStart.setHours(0, 0, 0, 0);

      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
      nextWeekEnd.setHours(23, 59, 59, 999);

      return await prisma.events.findMany({
        where: {
          start_date: {
            gte: nextWeekStart,
            lte: nextWeekEnd,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste de tous les événements programmés pour la semaine prochaine',
  },

  events_by_type: {
    keywords: [
      'événement',
      'type',
      'activité',
      'rendez-vous',
      'liste',
      'planning',
    ],
    questions: [
      'Quels sont les événements de type [TYPE] ?',
      'Activités de catégorie [TYPE]',
      'Rendez-vous [TYPE]',
      'Liste des [TYPE]',
      'Quoi de type [TYPE] ?',
      'Planning [TYPE]',
      'Événements [TYPE]',
      'Programme [TYPE]',
      'Rendez-vous type [TYPE]',
      'Activités [TYPE]',
    ],
    prisma: async (type: string) => {
      return await prisma.events.findMany({
        where: {
          event_type: type as any,
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des événements filtrés par type spécifique',
    parameters: [
      {
        name: 'TYPE',
        description:
          "Type d'événement (appel_telephonique, reunion_chantier, visite_technique, rendez_vous_client, reunion_interne)",
      },
    ],
  },

  events_by_date_range: {
    keywords: [
      'événement',
      'date',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements entre [START_DATE] et [END_DATE] ?',
      'Activités programmées du [START_DATE] au [END_DATE]',
      'Rendez-vous dans la période [START_DATE] - [END_DATE]',
      'Programme entre [START_DATE] et [END_DATE]',
      'Quoi du [START_DATE] au [END_DATE] ?',
      'Planning du [START_DATE] au [END_DATE]',
      'Événements du [START_DATE] au [END_DATE]',
      'Programme période [START_DATE] - [END_DATE]',
      'Rendez-vous période [START_DATE] - [END_DATE]',
      'Activités prévues du [START_DATE] au [END_DATE]',
    ],
    prisma: async (startDate: string, endDate: string) => {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return await prisma.events.findMany({
        where: {
          start_date: {
            gte: start,
            lte: end,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des événements programmés dans une plage de dates spécifique',
    parameters: [
      {
        name: 'START_DATE',
        description: 'Date de début (format YYYY-MM-DD)',
        default: 'CURRENT_DATE',
      },
      {
        name: 'END_DATE',
        description: 'Date de fin (format YYYY-MM-DD)',
        default: "CURRENT_DATE + INTERVAL '7 days'",
      },
    ],
  },

  events_by_project: {
    keywords: [
      'événement',
      'projet',
      'activité',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements pour le projet [PROJECT] ?',
      'Activités liées au chantier [PROJECT]',
      'Rendez-vous concernant [PROJECT]',
      'Planning du projet [PROJECT]',
      'Quoi pour [PROJECT] ?',
      'Événements [PROJECT]',
      'Programme [PROJECT]',
      'Rendez-vous [PROJECT]',
      'Planning chantier [PROJECT]',
      'Activités projet [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.events.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { id: { equals: parseInt(project) } },
            ],
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des événements associés à un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou ID du projet',
      },
    ],
  },

  events_by_staff: {
    keywords: [
      'événement',
      'personnel',
      'activité',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements pour [STAFF] ?',
      'Activités de [STAFF]',
      'Rendez-vous de [STAFF]',
      'Planning de [STAFF]',
      'Quoi pour [STAFF] ?',
      'Événements [STAFF]',
      'Programme [STAFF]',
      'Rendez-vous [STAFF]',
      'Planning personnel [STAFF]',
      'Activités [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.events.findMany({
        where: {
          staff: {
            OR: [
              {
                OR: [
                  { firstname: { contains: staff, mode: 'insensitive' } },
                  { lastname: { contains: staff, mode: 'insensitive' } },
                ],
              },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des événements associés à un membre du personnel spécifique',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  upcoming_events: {
    keywords: [
      'événement',
      'prochain',
      'rendez-vous',
      'activité',
      'programme',
      'planning',
    ],
    questions: [
      'Quels sont les prochains événements ?',
      'Prochains rendez-vous',
      'Activités à venir',
      'Événements futurs',
      'Quoi à venir ?',
      'Planning à venir',
      'Prochains événements',
      'Programme à venir',
      'Rendez-vous à venir',
      'Activités futures',
    ],
    prisma: async () => {
      const now = new Date();

      return await prisma.events.findMany({
        where: {
          start_date: {
            gt: now,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Liste des 10 prochains événements programmés',
  },

  busy_days: {
    keywords: [
      'jour',
      'chargé',
      'événement',
      'programme',
      'planning',
    ],
    questions: [
      'Quels sont les jours les plus chargés ?',
      "Journées avec le plus d'événements",
      'Jours à fort planning',
      'Journées les plus occupées',
      'Quels jours sont les plus chargés ?',
      "Jours avec beaucoup d'événements",
      'Journées chargées',
      'Jours occupés',
      'Planning chargé',
      'Jours à forte activité',
    ],
    prisma: async () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const events = await prisma.events.findMany({
        where: {
          start_date: {
            gte: now,
          },
        },
        select: {
          start_date: true,
        },
      });

      // Grouper les événements par jour et compter
      const eventsByDay = events.reduce(
        (acc, event) => {
          const day = event.start_date.toISOString().split('T')[0];
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Convertir en tableau et trier
      return Object.entries(eventsByDay)
        .map(([day, count]) => ({
          day: new Date(day),
          event_count: count,
        }))
        .sort((a: EventCount, b: EventCount) => b.event_count - a.event_count)
        .slice(0, 10);
    },
    response_format: 'table',
    description:
      "Liste des 10 jours avec le plus grand nombre d'événements programmés",
  },

  site_visits_scheduled: {
    keywords: [
      'visite',
      'chantier',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quelles visites de chantier sont programmées ?',
      'Prochaines visites techniques',
      'Planning des visites sur site',
      'Visites de chantier à venir',
      'Quelles visites sont prévues ?',
      'Prochaines visites',
      'Visites techniques',
      'Visites de chantier',
      'Planning visites',
      'Visites prévues',
    ],
    prisma: async () => {
      const now = new Date();

      return await prisma.events.findMany({
        where: {
          start_date: {
            gt: now,
          },
          event_type: {
            in: ['visite_technique', 'reunion_chantier'],
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des visites de chantier et réunions sur site programmées',
  },

  client_meetings_scheduled: {
    keywords: [
      'rendez-vous',
      'client',
      'programme',
      'planning',
    ],
    questions: [
      'Quels rendez-vous clients sont programmés ?',
      'Prochaines rencontres avec clients',
      'Planning des rendez-vous clients',
      'Rendez-vous clients à venir',
      'Quels rendez-vous clients ?',
      'Prochains rendez-vous clients',
      'Rencontres clients',
      'Rendez-vous avec clients',
      'Planning clients',
      'Visites clients',
    ],
    prisma: async () => {
      const now = new Date();

      return await prisma.events.findMany({
        where: {
          start_date: {
            gt: now,
          },
          event_type: 'rendez_vous_client',
        },
        include: {
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
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
        orderBy: {
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des rendez-vous avec les clients programmés',
  },

  tasks_due_today: {
    keywords: [
      'tâche',
      'faire',
      'aujourd\'hui',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      "Quelles tâches sont à faire aujourd'hui ?",
      'Tâches du jour',
      "Travaux prévus aujourd'hui",
      "Liste des tâches aujourd'hui",
      "Quoi faire aujourd'hui ?",
      "Tâches à réaliser aujourd'hui",
      'Travaux du jour',
      "Tâches prévues aujourd'hui",
      "Planning des tâches aujourd'hui",
      "Travaux à faire aujourd'hui",
    ],
    prisma: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await prisma.tasks.findMany({
        where: {
          due_date: {
            gte: today,
            lt: tomorrow,
          },
          status: {
            not: 'termine',
          },
        },
        include: {
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
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { due_date: 'asc' }],
      });
    },
    response_format: 'table',
    description: "Liste des tâches à réaliser aujourd'hui, triées par priorité",
  },

  staff_availability_this_week: {
    keywords: [
      'disponible',
      'semaine',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui est disponible cette semaine ?',
      'Personnel disponible cette semaine',
      'Employés libres cette semaine',
      'Qui est dispo cette semaine ?',
      'Staff disponible cette semaine',
      'Personnel non planifié cette semaine',
      'Employés disponibles cette semaine',
      'Qui est libre cette semaine ?',
      'Planning personnel disponible cette semaine',
      'Personnel non affecté cette semaine',
    ],
    prisma: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            OR: [
              {
                time_logs: {
                  some: {
                    check_in: {
                      gte: weekStart,
                      lte: weekEnd,
                    },
                  },
                },
              },
              {
                events: {
                  some: {
                    start_date: {
                      gte: weekStart,
                      lte: weekEnd,
                    },
                  },
                },
              },
            ],
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
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste du personnel disponible pour la semaine en cours (sans entrées dans le planning ni événements)',
  },

  project_stages_upcoming: {
    keywords: [
      'étape',
      'projet',
      'chantier',
      'programme',
      'planning',
    ],
    questions: [
      'Quelles sont les prochaines étapes de projet ?',
      'Prochaines phases de chantier',
      'Étapes à venir des projets',
      'Phases de projet à venir',
      'Quelles étapes arrivent ?',
      'Prochaines phases',
      'Étapes de projet à venir',
      'Phases de chantier à venir',
      'Planning des étapes',
      'Prochaines phases de travail',
    ],
    prisma: async () => {
      const now = new Date();

      return await prisma.project_stages.findMany({
        where: {
          start_date: {
            gt: now,
          },
          status: {
            not: 'termine',
          },
        },
        include: {
          projects: {
            select: {
              name: true,
              status: true,
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
          start_date: 'asc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description:
      'Liste des 10 prochaines étapes de projet à venir, avec leur planning et le personnel affecté',
  },

  staff_working_next_month: {
    keywords: [
      'travail',
      'mois',
      'prochain',
      'programme',
      'équipe',
    ],
    questions: [
      'Qui travaille le mois prochain ?',
      'Personnel programmé pour le mois prochain',
      'Équipe du mois prochain',
      'Qui va travailler le mois prochain',
    ],
    prisma: async () => {
      const nextMonthStart = new Date();
      nextMonthStart.setDate(1);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
      nextMonthStart.setHours(0, 0, 0, 0);

      const nextMonthEnd = new Date(nextMonthStart);
      nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);
      nextMonthEnd.setDate(0); // Dernier jour du mois
      nextMonthEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          project_staff: {
            some: {
              projects: {
                start_date: {
                  lte: nextMonthEnd,
                },
                end_date: {
                  gte: nextMonthStart,
                },
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          project_staff: {
            where: {
              projects: {
                start_date: {
                  lte: nextMonthEnd,
                },
                end_date: {
                  gte: nextMonthStart,
                },
              },
            },
            select: {
              projects: {
                select: {
                  name: true,
                  start_date: true,
                  end_date: true,
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
      'Liste du personnel qui travaillera sur des projets actifs le mois prochain',
  },

  staff_schedule_by_date: {
    keywords: [
      'travail',
      'date',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui travaille le [DATE] ?',
      'Personnel présent le [DATE]',
      'Équipe du [DATE]',
      'Employés programmés pour le [DATE]',
      'Qui est prévu le [DATE] ?',
      'Planning du [DATE]',
      'Personnel le [DATE]',
      'Qui travaille le [DATE] ?',
      'Équipe présente le [DATE]',
      'Planning pour le [DATE]',
    ],
    prisma: async (date: string) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      return await prisma.staff.findMany({
        where: {
          time_logs: {
            some: {
              check_in: {
                gte: targetDate,
                lt: nextDate,
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          time_logs: {
            where: {
              check_in: {
                gte: targetDate,
                lt: nextDate,
              },
            },
            select: {
              check_in: true,
              check_out: true,
              comment: true,
              projects: {
                select: {
                  name: true,
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
      'Liste des employés programmés pour travailler à une date spécifique',
    parameters: [
      {
        name: 'DATE',
        description: 'Date au format YYYY-MM-DD',
        default: 'CURRENT_DATE',
      },
    ],
  },

  staff_schedule_for_project: {
    keywords: [
      'travail',
      'projet',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui travaille sur le projet [PROJECT] ?',
      'Personnel assigné au chantier [PROJECT]',
      'Équipe du projet [PROJECT]',
      'Employés travaillant sur [PROJECT]',
      'Qui est sur le projet [PROJECT] ?',
      'Équipe du chantier [PROJECT]',
      'Personnel du projet [PROJECT]',
      'Qui travaille sur [PROJECT] ?',
      'Staff du projet [PROJECT]',
      'Planning du projet [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.staff.findMany({
        where: {
          project_staff: {
            some: {
              projects: {
                OR: [
                  { name: { contains: project, mode: 'insensitive' } },
                  { id: { equals: parseInt(project) } },
                ],
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          project_staff: {
            where: {
              projects: {
                OR: [
                  { name: { contains: project, mode: 'insensitive' } },
                  { id: { equals: parseInt(project) } },
                ],
              },
            },
            select: {
              role_description: true,
              start_date: true,
              end_date: true,
            },
          },
        },
        orderBy: [
          { project_staff: { _count: 'desc' } },
          { lastname: 'asc' },
          { firstname: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description:
      'Liste des employés assignés à un projet spécifique avec leur rôle',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou ID du projet',
      },
    ],
  },

  events_this_month: {
    keywords: [
      'événement',
      'mois',
      'programme',
      'rendez-vous',
      'planning',
    ],
    questions: [
      'Quels sont les événements ce mois-ci ?',
      'Activités du mois',
      'Programme du mois en cours',
      'Rendez-vous du mois',
      'Quoi ce mois ?',
      'Planning du mois',
      'Événements du mois',
      'Programme mois',
      'Rendez-vous mois',
      'Activités prévues ce mois',
    ],
    prisma: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Dernier jour du mois
      monthEnd.setHours(23, 59, 59, 999);

      return await prisma.events.findMany({
        where: {
          start_date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste de tous les événements programmés pour le mois en cours',
  },

  deadlines_this_month: {
    keywords: [
      'échéance',
      'mois',
      'projet',
      'date',
      'deadline',
    ],
    questions: [
      'Quelles sont les échéances ce mois-ci ?',
      'Dates limites du mois',
      'Deadlines importantes ce mois',
      'Échéances à respecter ce mois',
      'Quelles échéances ce mois ?',
      'Deadlines du mois',
      'Échéances mois',
      'Dates limites',
      'Fin de mois',
      'Échéances importantes',
    ],
    prisma: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Dernier jour du mois
      monthEnd.setHours(23, 59, 59, 999);

      return await prisma.project_stages.findMany({
        where: {
          end_date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          name: true,
          status: true,
          end_date: true,
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
          end_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: "Liste des échéances d'étapes de projets pour le mois courant",
  },

  daily_site_reports_recent: {
    keywords: [
      'rapport',
      'chantier',
      'activité',
      'journée',
      'récent',
    ],
    questions: [
      'Quels sont les derniers rapports de chantier ?',
      'Rapports journaliers récents',
      'Derniers comptes rendus de chantier',
      "Rapports d'activité récents",
      'Derniers rapports',
      'Rapports chantier',
      'Comptes rendus récents',
      'Rapports journaliers',
      'Rapports activité',
      'Derniers comptes rendus',
    ],
    prisma: async () => {
      return await prisma.site_reports.findMany({
        select: {
          id: true,
          created_at: true,
          description: true,
          projects: {
            select: {
              name: true,
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
          created_at: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description: 'Liste des 10 derniers rapports journaliers de chantier',
  },

  staff_availability_month: {
    keywords: [
      'disponible',
      'mois',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui est disponible ce mois ?',
      'Personnel disponible ce mois',
      'Membres du staff libres ce mois',
      'Employés non planifiés ce mois',
      'Qui est dispo ce mois ?',
      'Personnel libre ce mois',
      'Staff disponible',
      'Employés disponibles',
      'Qui est libre ce mois ?',
      'Personnel non planifié',
    ],
    prisma: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Dernier jour du mois
      monthEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            time_logs: {
              some: {
                check_in: {
                  gte: monthStart,
                  lte: monthEnd,
                },
              },
            },
          },
        },
        select: {
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
      'Liste du personnel disponible pour le mois en cours (sans entrées dans le planning)',
  },

  staff_availability_week: {
    keywords: [
      'disponible',
      'semaine',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui est disponible cette semaine ?',
      'Personnel disponible cette semaine',
      'Membres du staff libres cette semaine',
      'Employés non planifiés pour la semaine en cours',
      'Qui est dispo cette semaine ?',
      'Personnel libre cette semaine',
      'Staff disponible semaine',
      'Employés disponibles semaine',
      'Qui est libre cette semaine ?',
      'Personnel non planifié semaine',
    ],
    prisma: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            time_logs: {
              some: {
                check_in: {
                  gte: weekStart,
                  lte: weekEnd,
                },
              },
            },
          },
        },
        select: {
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
      'Liste du personnel disponible pour la semaine en cours (sans entrées dans le planning)',
  },

  staff_availability_next_week: {
    keywords: [
      'disponible',
      'semaine',
      'prochaine',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui est disponible la semaine prochaine ?',
      'Personnel disponible semaine prochaine',
      'Membres du staff libres semaine prochaine',
      'Employés non planifiés la semaine prochaine',
      'Qui est dispo la semaine prochaine ?',
      'Personnel libre semaine prochaine',
      'Staff disponible semaine pro',
      'Employés disponibles semaine pro',
      'Qui est libre semaine prochaine ?',
      'Personnel non planifié semaine pro',
    ],
    prisma: async () => {
      const nextWeekStart = new Date();
      nextWeekStart.setDate(
        nextWeekStart.getDate() + 7 - nextWeekStart.getDay(),
      );
      nextWeekStart.setHours(0, 0, 0, 0);

      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
      nextWeekEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            time_logs: {
              some: {
                check_in: {
                  gte: nextWeekStart,
                  lte: nextWeekEnd,
                },
              },
            },
          },
        },
        select: {
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
      'Liste du personnel disponible pour la semaine prochaine (sans entrées dans le planning)',
  },

  missing_timesheets: {
    keywords: [
      'employé',
      'pointage',
      'aujourd\'hui',
      'manque',
    ],
    questions: [
      "Qui n'a pas pointé aujourd'hui ?",
      'Employés sans pointage',
      "Qui est absent aujourd'hui ?",
      'Personnel sans pointage du jour',
      "Quels employés n'ont pas de pointage ?",
      "Qui n'a pas enregistré ses heures aujourd'hui ?",
      "Liste des employés sans feuille de temps aujourd'hui",
      'Absences de pointage',
      "Manque de pointage aujourd'hui",
      'Membres du personnel sans heures enregistrées',
    ],
    prisma: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            time_logs: {
              some: {
                check_in: {
                  gte: today,
                  lt: tomorrow,
                },
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: "Liste des employés qui n'ont pas de pointage aujourd'hui",
  },

  daily_workload: {
    keywords: [
      'travail',
      'charge',
      'semaine',
      'heures',
    ],
    questions: [
      'Quelle est la charge de travail cette semaine ?',
      'Quels jours sont les plus chargés ?',
      "Nombre d'heures travaillées chaque jour",
      'Répartition des heures par jour cette semaine',
      'Charge de travail quotidienne',
      'Heures totales par jour de la semaine',
      'Volume de travail journalier',
      "Combien d'heures ont été travaillées chaque jour ?",
      'Charge de travail journalière cette semaine',
      'Distribution des heures par jour',
    ],
    prisma: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Chercher tous les time_logs de la semaine
      const timeLogs = await prisma.time_logs.findMany({
        where: {
          check_in: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        select: {
          check_in: true,
          check_out: true,
        },
      });

      // Calculer les heures par jour
      const dailyHours: { [date: string]: number } = {};

      timeLogs.forEach((log) => {
        const date = log.check_in.toISOString().split('T')[0];

        let hours = 0;
        if (log.check_out) {
          hours =
            (log.check_out.getTime() - log.check_in.getTime()) /
            (1000 * 60 * 60);
        }

        dailyHours[date] = (dailyHours[date] || 0) + hours;
      });

      // Convertir en tableau pour le retour
      return Object.entries(dailyHours)
        .map(([date, hours]) => ({
          date: new Date(date),
          total_hours: hours,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    },
    response_format: 'table',
    description:
      "Nombre total d'heures de travail enregistrées pour chaque jour de la semaine en cours",
  },

  work_hours_per_project: {
    keywords: [
      'heures',
      'travail',
      'chantier',
      'projet',
    ],
    questions: [
      "Combien d'heures ont été travaillées par projet ?",
      'Répartition des heures de travail par chantier',
      "Quel projet a nécessité le plus d'heures ?",
      'Heures travaillées par projet cette semaine',
      'Ventilation des heures par chantier',
      'Projets les plus chronophages',
      'Temps passé sur chaque projet',
      'Distribution horaire par projet',
      'Quels projets ont mobilisé le plus de temps ?',
      'Répartition du temps par chantier',
    ],
    prisma: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Chercher tous les time_logs de la semaine
      const timeLogs = await prisma.time_logs.findMany({
        where: {
          check_in: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
        select: {
          check_in: true,
          check_out: true,
          project_id: true,
          projects: {
            select: {
              name: true,
            },
          },
        },
      });

      // Calculer les heures par projet
      const projectHours: {
        [projectId: number]: { name: string; hours: number };
      } = {};

      timeLogs.forEach((log) => {
        if (!log.project_id || !log.check_out) return;

        const hours =
          (log.check_out.getTime() - log.check_in.getTime()) / (1000 * 60 * 60);

        if (!projectHours[log.project_id]) {
          projectHours[log.project_id] = {
            name: log.projects?.name || `Projet #${log.project_id}`,
            hours: 0,
          };
        }

        projectHours[log.project_id].hours += hours;
      });

      // Convertir en tableau pour le retour
      return Object.values(projectHours).sort((a, b) => b.hours - a.hours);
    },
    response_format: 'table',
    description: "Nombre d'heures travaillées par projet cette semaine",
  },

  staff_most_worked_current_month: {
    keywords: [
      'travail',
      'mois',
      'personnel',
      'employé',
      'heures',
    ],
    questions: [
      'Qui a le plus travaillé ce mois ?',
      "Personnel avec le plus d'heures ce mois-ci",
      "Employés ayant fait le plus d'heures ce mois",
      'Classement du personnel par heures travaillées ce mois',
      'Top des employés les plus actifs du mois',
    ],
    prisma: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Dernier jour du mois
      monthEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          time_logs: {
            some: {
              check_in: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          time_logs: {
            where: {
              check_in: {
                gte: monthStart,
                lte: monthEnd,
              },
              check_out: {
                not: null,
              },
            },
            select: {
              check_in: true,
              check_out: true,
            },
          },
        },
        orderBy: {
          time_logs: {
            _count: 'desc',
          },
        },
        take: 10,
      });
    },
    response_format: 'table',
    description:
      "Top 10 des employés ayant accumulé le plus d'heures de travail effectif durant le mois en cours",
  },

  staff_availability_next_month: {
    keywords: [
      'disponible',
      'mois',
      'prochain',
      'personnel',
      'employé',
      'planifié',
    ],
    questions: [
      'Qui est disponible le mois prochain ?',
      'Personnel disponible mois prochain',
      'Membres du staff libres mois prochain',
      'Employés non planifiés le mois prochain',
      'Qui est dispo le mois prochain ?',
      'Personnel libre mois prochain',
      'Staff disponible mois prochain',
      'Employés disponibles mois prochain',
      'Qui est libre mois prochain ?',
      'Personnel non planifié mois prochain',
    ],
    prisma: async () => {
      const nextMonthStart = new Date();
      nextMonthStart.setDate(1);
      nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);
      nextMonthStart.setHours(0, 0, 0, 0);

      const nextMonthEnd = new Date(nextMonthStart);
      nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);
      nextMonthEnd.setDate(0); // Dernier jour du mois
      nextMonthEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            project_staff: {
              some: {
                projects: {
                  start_date: {
                    lte: nextMonthEnd,
                  },
                  end_date: {
                    gte: nextMonthStart,
                  },
                },
              },
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          email: true,
          phone: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste du personnel disponible pour le mois prochain (sans affectation à des projets pour cette période)',
  },

  project_critical_deadlines: {
    keywords: [
      'échéance',
      'critique',
      'urgente',
      'importante',
      'prioritaire',
      'limite',
      'date',
      'fin',
    ],
    questions: [
      'Quelles sont les échéances critiques à venir ?',
      'Dates limites critiques des projets',
      'Échéances prioritaires',
      'Deadlines urgentes à surveiller',
      'Dates de fin critiques',
      'Échéances imminentes importantes',
      'Dates butoirs à ne pas manquer',
      'Prochaines échéances critiques',
      'Fins de projet urgentes',
      'Dates limites importantes des chantiers',
    ],
    prisma: async () => {
      const today = new Date();
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(today.getDate() + 14);

      return await prisma.project_stages.findMany({
        where: {
          end_date: {
            gte: today,
            lte: twoWeeksLater,
          },
          status: {
            not: 'termine',
          },
          completion_percentage: {
            lt: 80
          }
        },
        select: {
          name: true,
          description: true,
          end_date: true,
          completion_percentage: true,
          status: true,
          projects: {
            select: {
              name: true,
              reference: true,
              clients: {
                select: {
                  firstname: true,
                  lastname: true,
                  company_name: true,
                }
              }
            },
          },
        },
        orderBy: [
          { end_date: 'asc' },
          { completion_percentage: 'asc' }
        ],
      });
    },
    response_format: 'table',
    description: 'Liste des échéances critiques approchant dans les deux prochaines semaines avec un avancement inférieur à 80%',
  },

  staff_workload_distribution: {
    keywords: [
      'charge',
      'travail',
      'répartition',
      'personnel',
      'équilibre',
      'distribution',
      'heures',
    ],
    questions: [
      'Comment est répartie la charge de travail entre les employés ?',
      'Distribution des heures par membre du personnel',
      'Équilibre de charge entre employés',
      'Répartition du travail dans l\'équipe',
      'Qui est surchargé de travail ?',
      'Distribution des tâches par employé',
      'Analyse de la charge de travail par personne',
      'Répartition des projets par employé',
      'Équilibre des affectations',
      'Charge de travail comparative',
    ],
    prisma: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              project_staff: true,
              tasks: true,
              events: true,
            }
          },
          project_staff: {
            select: {
              projects: {
                select: {
                  name: true,
                }
              },
              hours_planned: true,
              hours_worked: true,
            },
          },
          time_logs: {
            where: {
              check_in: {
                gte: monthStart,
                lte: monthEnd,
              },
              check_out: {
                not: null,
              },
            },
            select: {
              check_in: true,
              check_out: true,
            },
          },
        },
        orderBy: {
          project_staff: {
            _count: 'desc',
          },
        },
      });
    },
    response_format: 'table',
    description: 'Analyse de la distribution de la charge de travail entre les membres du personnel',
  },

  project_timeline_overview: {
    keywords: [
      'timeline',
      'projet',
      'planning',
      'calendrier',
      'chronologie',
      'temps',
      'progression',
      'avancement',
    ],
    questions: [
      'Quelle est la timeline des projets en cours ?',
      'Vue d\'ensemble des plannings projet',
      'Chronologie des projets actifs',
      'Calendrier des projets en cours',
      'Timeline des chantiers',
      'Vue temporelle des projets',
      'Progression dans le temps des projets',
      'Planning temporel des chantiers',
      'Avancement des projets dans le temps',
      'Projets sur la ligne du temps',
    ],
    prisma: async () => {
      const today = new Date();
      
      return await prisma.projects.findMany({
        where: {
          status: {
            in: ['devis_accepte', 'en_preparation', 'en_cours'],
          },
          start_date: {
            not: null,
          },
          end_date: {
            not: null,
          },
        },
        select: {
          name: true,
          reference: true,
          status: true,
          start_date: true,
          end_date: true,
          estimated_duration: true,
          clients: {
            select: {
              firstname: true,
              lastname: true,
              company_name: true,
            }
          },
          project_stages: {
            select: {
              name: true,
              start_date: true,
              end_date: true,
              status: true,
              completion_percentage: true,
            },
            orderBy: {
              order_index: 'asc',
            }
          }
        },
        orderBy: [
          { start_date: 'asc' }
        ],
      });
    },
    response_format: 'timeline',
    description: 'Vue chronologique des projets en cours avec leurs étapes',
  },

  resource_allocation_conflicts: {
    keywords: [
      'conflit',
      'ressource',
      'personnel',
      'double',
      'affectation',
      'surréservation',
      'planning',
    ],
    questions: [
      'Y a-t-il des conflits d\'affectation de personnel ?',
      'Quels employés sont affectés à plusieurs projets en même temps ?',
      'Conflits de planning dans les ressources humaines',
      'Surréservation du personnel',
      'Double affectation d\'employés',
      'Conflits dans le planning du personnel',
      'Chevauchement d\'affectations',
      'Personnel avec affectations conflictuelles',
      'Problèmes d\'allocation de ressources',
      'Conflits horaires du personnel',
    ],
    prisma: async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      
      // Récupérer tous les membres du personnel avec leurs affectations
      const staffWithAssignments = await prisma.staff.findMany({
        where: {
          is_available: true,
          project_staff: {
            some: {
              start_date: {
                lte: nextMonth,
              },
              end_date: {
                gte: today,
              },
            },
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          project_staff: {
            where: {
              start_date: {
                lte: nextMonth,
              },
              end_date: {
                gte: today,
              },
            },
            select: {
              id: true,
              start_date: true,
              end_date: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                },
              },
            },
          },
        },
      });
      
      // Analyser les conflits (plusieurs projets se chevauchant dans le temps)
      const staffWithConflicts = staffWithAssignments.filter(staff => {
        // Si moins de 2 affectations, pas de conflit possible
        if (staff.project_staff.length < 2) return false;
        
        // Vérifier si des périodes d'affectation se chevauchent
        for (let i = 0; i < staff.project_staff.length; i++) {
          for (let j = i + 1; j < staff.project_staff.length; j++) {
            const assignment1 = staff.project_staff[i];
            const assignment2 = staff.project_staff[j];
            
            // Vérifier le chevauchement en tenant compte des valeurs potentiellement nulles
            if (
              assignment1.start_date && assignment2.end_date && assignment1.end_date && assignment2.start_date &&
              assignment1.start_date <= assignment2.end_date &&
              assignment1.end_date >= assignment2.start_date
            ) {
              return true; // Conflit détecté
            }
          }
        }
        
        return false; // Pas de conflit
      });
      
      return staffWithConflicts;
    },
    response_format: 'table',
    description: 'Liste des membres du personnel ayant des affectations conflictuelles sur la même période',
  },

  upcoming_material_deliveries: {
    keywords: [
      'livraison',
      'matériau',
      'matériel',
      'commande',
      'arrivage',
      'approvisionnement',
    ],
    questions: [
      'Quand sont prévues les prochaines livraisons de matériel ?',
      'Calendrier des livraisons de matériaux',
      'Planning des arrivages de matériel',
      'Prochaines livraisons sur chantier',
      'Quand arrivent les matériaux ?',
      'Dates de livraison matériel',
      'Programmation des livraisons',
      'Approvisionnement matériaux planning',
      'Quand les commandes seront-elles livrées ?',
      'Calendrier d\'approvisionnement',
    ],
    prisma: async () => {
      const today = new Date();
      
      return await prisma.events.findMany({
        where: {
          event_type: 'livraison_materiaux',
          start_date: {
            gte: today,
          },
        },
        select: {
          title: true,
          description: true,
          start_date: true,
          location: true,
          projects: {
            select: {
              name: true,
              reference: true,
            }
          },
          staff: {
            select: {
              firstname: true,
              lastname: true,
            }
          },
        },
        orderBy: {
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Calendrier des prochaines livraisons de matériaux sur les chantiers',
  },

  vehicle_availability: {
    keywords: [
      'véhicule',
      'disponible',
      'voiture',
      'camion',
      'utilitaire',
      'réservation',
    ],
    questions: [
      'Quels véhicules sont disponibles ?',
      'Disponibilité des véhicules',
      'Véhicules libres pour réservation',
      'Quelles voitures sont disponibles ?',
      'Camions disponibles',
      'Utilitaires libres',
      'Véhicules non réservés',
      'Quels véhicules puis-je réserver ?',
      'État de disponibilité des véhicules',
      'Véhicules disponibles à la réservation',
    ],
    prisma: async () => {
      const today = new Date();
      
      // Récupérer tous les véhicules
      const vehicles = await prisma.vehicles.findMany({
        where: {
          status: 'disponible',
        },
        select: {
          id: true,
          name: true,
          type: true,
          brand: true,
          model: true,
          registration_number: true,
          vehicle_reservations: {
            where: {
              start_date: {
                lte: today,
              },
              end_date: {
                gte: today,
              },
            },
          },
        },
      });
      
      // Filtrer pour ne garder que les véhicules sans réservation active
      const availableVehicles = vehicles.filter(
        vehicle => vehicle.vehicle_reservations.length === 0
      );
      
      return availableVehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        type: vehicle.type,
        model: `${vehicle.brand} ${vehicle.model}`,
        registration_number: vehicle.registration_number,
      }));
    },
    response_format: 'table',
    description: 'Liste des véhicules actuellement disponibles pour réservation',
  },

  monthly_project_progress: {
    keywords: [
      'progression',
      'projet',
      'mensuel',
      'avancement',
      'mois',
      'évolution',
    ],
    questions: [
      'Quelle est la progression mensuelle des projets ?',
      'Avancement des projets par mois',
      'Évolution des chantiers sur le dernier mois',
      'Progression mensuelle des travaux',
      'Comment ont évolué les projets ce mois-ci ?',
      'Suivi mensuel des projets',
      'Avancée des chantiers ce mois',
      'Bilan mensuel d\'avancement',
      'Progression sur le mois courant',
      'Évolution mensuelle des projets',
    ],
    prisma: async () => {
      // Calculer le début du mois précédent et du mois courant
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      // Récupérer les projets actifs
      const activeProjects = await prisma.projects.findMany({
        where: {
          status: 'en_cours',
        },
        select: {
          id: true,
          name: true,
          reference: true,
          project_stages: {
            select: {
              id: true,
              name: true,
              completion_percentage: true,
              updated_at: true,
            },
          },
          // Prendre les logs d'activité pour estimer l'avancement
          time_logs: {
            where: {
              check_in: {
                gte: lastMonthStart,
              },
            },
            select: {
              check_in: true,
              check_out: true,
            },
          },
        },
      });
      
      // Calculer la progression pour chaque projet
      return activeProjects.map(project => {
        // Calculer la moyenne de complétion des étapes
        const totalCompletion = project.project_stages.reduce(
          (sum, stage) => sum + (stage.completion_percentage || 0), 
          0
        );
        const averageCompletion = project.project_stages.length > 0 
          ? totalCompletion / project.project_stages.length 
          : 0;
        
                 // Calculer les heures travaillées ce mois-ci
         const currentMonthHours = project.time_logs
           .filter(log => {
             return log.check_in && log.check_out && 
                    new Date(log.check_in) >= currentMonthStart;
           })
           .reduce((sum, log) => {
             if (!log.check_out || !log.check_in) return sum;
             const hours = (log.check_out.getTime() - log.check_in.getTime()) / (1000 * 60 * 60);
             return sum + hours;
           }, 0);
         
         // Calculer les heures travaillées le mois dernier
         const lastMonthHours = project.time_logs
           .filter(log => {
             return log.check_in && log.check_out && 
                    new Date(log.check_in) >= lastMonthStart && 
                    new Date(log.check_in) < currentMonthStart;
           })
           .reduce((sum, log) => {
             if (!log.check_out || !log.check_in) return sum;
             const hours = (log.check_out.getTime() - log.check_in.getTime()) / (1000 * 60 * 60);
             return sum + hours;
           }, 0);
        
        return {
          project_name: project.name,
          project_reference: project.reference,
          current_completion_percentage: Math.round(averageCompletion),
          current_month_hours: Math.round(currentMonthHours * 10) / 10,
          last_month_hours: Math.round(lastMonthHours * 10) / 10,
          hour_variation: Math.round((currentMonthHours - lastMonthHours) * 10) / 10,
        };
      });
    },
    response_format: 'table',
    description: 'Analyse de la progression mensuelle des projets en cours avec comparaison au mois précédent',
  },

  project_team_composition: {
    keywords: [
      'équipe',
      'projet',
      'composition',
      'personnel',
      'affecté',
      'membre',
    ],
    questions: [
      'Quelle est la composition des équipes par projet ?',
      'Structure des équipes projet',
      'Membres d\'équipe par projet',
      'Composition des équipes chantier',
      'Qui travaille sur quel projet ?',
      'Constitution des équipes projet',
      'Répartition du personnel par projet',
      'Équipes projet détaillées',
      'Composition des équipes de travail',
      'Personnel affecté par projet',
    ],
    prisma: async () => {
      return await prisma.projects.findMany({
        where: {
          status: {
            in: ['en_preparation', 'en_cours'],
          },
        },
        select: {
          name: true,
          reference: true,
          status: true,
          _count: {
            select: {
              project_staff: true,
            }
          },
          project_staff: {
            select: {
              role_description: true,
              staff: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: {
                    select: {
                      name: true,
                    }
                  },
                },
              },
              project_stages: {
                select: {
                  name: true,
                }
              },
            },
          },
        },
        orderBy: {
          project_staff: {
            _count: 'desc',
          },
        },
      });
    },
    response_format: 'table',
    description: 'Composition détaillée des équipes pour chaque projet en cours avec rôles et responsabilités',
  },

  staff_utilization_rate_this_week: {
    keywords: [
      'taux',
      'occupation',
      'engagement',
      'personnel',
      'employé',
      'staff',
      'travail',
      'charge',
      'heures',
      'planning',
    ],
    questions: [
      'Quel est le taux d\'occupation des employés cette semaine ?',
      'Taux de charge du personnel cette semaine',
      'Engagement des employés semaine en cours',
      'Qui est le plus occupé cette semaine ?',
      'Taux d\'occupation hebdomadaire du staff',
      'Combien chaque employé travaille cette semaine ?',
      'Charge de travail par employé cette semaine',
      'Taux d\'engagement hebdomadaire',
      'Occupation du personnel cette semaine',
      'Répartition du temps travaillé cette semaine',
    ],
    prisma: async () => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
  
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
  
      const staff = await prisma.staff.findMany({
        where: { is_available: true },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          time_logs: {
            where: {
              check_in: { gte: weekStart, lte: weekEnd },
              check_out: { not: null },
            },
            select: {
              check_in: true,
              check_out: true,
            },
          },
        },
      });
  
      return staff.map((s) => {
        const workedHours = s.time_logs.reduce((sum, log) => {
          if (!log.check_out || !log.check_in) return sum;
          const diff =
            (new Date(log.check_out).getTime() -
              new Date(log.check_in).getTime()) /
            (1000 * 60 * 60);
          return sum + diff;
        }, 0);
  
        const available = 35; // Heures hebdomadaires standard
        const rate = available > 0 ? Math.round((workedHours / available) * 100) : 0;
  
        return {
          firstname: s.firstname,
          lastname: s.lastname,
          hours_worked: Math.round(workedHours * 10) / 10,
          available_hours: available,
          utilization_rate: `${rate}%`,
        };
      });
    },
    response_format: 'table',
    description:
      'Taux d\'occupation du personnel cette semaine basé sur les heures planifiées vs disponibles',
  },

  staff_availability_by_date: {
    keywords: [
      'disponible',
      'date',
      'personnel',
      'libre',
      'membre',
      'employé',
      'planifié',
      'présent',
      'équipe',
    ],
    questions: [
      'Qui est disponible le [DATE] ?',
      'Personnel disponible le [DATE]',
      'Membres du staff libres le [DATE]',
      'Employés non planifiés pour le [DATE]',
      'Qui est dispo le [DATE] ?',
      'Personnel libre le [DATE]',
      'Staff disponible le [DATE]',
      'Employés disponibles le [DATE] ?',
      'Qui est libre le [DATE] ?',
      'Personnel non planifié le [DATE]',
      "Quel est le personnel disponible le [DATE] ?",
      "Qui est présent et disponible le [DATE] ?",
      "Équipe disponible le [DATE]",
    ],
    prisma: async (date: string) => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);

      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            OR: [
              {
                time_logs: {
                  some: {
                    check_in: {
                      gte: targetDate,
                      lt: nextDate,
                    },
                  },
                },
              },
              {
                events: {
                  some: {
                    start_date: {
                      gte: targetDate,
                      lt: nextDate,
                    },
                  },
                },
              },
            ],
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
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste du personnel disponible pour une date spécifique (sans entrées dans le planning ni événements)',
    parameters: [
      {
        name: 'DATE',
        description: 'Date au format YYYY-MM-DD',
        default: 'CURRENT_DATE',
      },
    ],
  },

  upcoming_events_by_type: {
    keywords: [
      'événement',
      'type',
      'prochain',
      'activité',
      'rendez-vous',
      'liste',
      'planning',
      'avenir',
    ],
    questions: [
      'Quels sont les prochains événements de type [TYPE] ?',
      'Activités à venir de catégorie [TYPE]',
      'Rendez-vous [TYPE] à venir',
      'Liste des [TYPE] à venir',
      'Quoi de type [TYPE] à venir ?',
      'Planning [TYPE] à venir',
      'Événements [TYPE] à venir',
      'Programme [TYPE] à venir',
      'Rendez-vous type [TYPE] à venir',
      'Activités [TYPE] à venir',
      'Prochains événements de type [TYPE]',
    ],
    prisma: async (type: string) => {
      const now = new Date();

      return await prisma.events.findMany({
        where: {
          event_type: type as any,
          start_date: {
            gt: now,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des prochains événements d\'un type spécifique, triés par date',
    parameters: [
      {
        name: 'TYPE',
        description:
          "Type d\'événement (appel_telephonique, reunion_chantier, visite_technique, rendez_vous_client, reunion_interne)",
      },
    ],
  },

  upcoming_tasks: {
    keywords: [
      'tâche',
      'faire',
      'programme',
      'planning',
      'avenir',
      'prochaine',
      'liste',
      'travail',
    ],
    questions: [
      'Quelles sont les tâches à venir ?',
      'Prochaines tâches à faire',
      'Tâches non terminées à venir',
      'Liste des prochaines tâches',
      'Quoi faire prochainement ?',
      'Tâches à réaliser prochainement',
      'Travaux à venir',
      'Tâches futures',
      'Planning des tâches à venir',
      'Travaux à faire prochainement',
      'Prochaines tâches',
    ],
    prisma: async () => {
      const now = new Date();

      return await prisma.tasks.findMany({
        where: {
          due_date: {
            gt: now,
          },
          status: {
            not: 'termine',
          },
        },
        include: {
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
          staff: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
        orderBy: [{ due_date: 'asc' }, { priority: 'desc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste des tâches à venir (non terminées), triées par date d\'échéance puis par priorité',
  },

  recent_site_reports_by_project: {
    keywords: [
      'rapport',
      'chantier',
      'activité',
      'journée',
      'récent',
      'projet',
      'liste',
    ],
    questions: [
      'Quels sont les derniers rapports de chantier pour le projet [PROJECT] ?',
      'Rapports journaliers récents pour le projet [PROJECT]',
      'Derniers comptes rendus de chantier du projet [PROJECT]',
      "Rapports d\'activité récents du projet [PROJECT]",
      'Derniers rapports du projet [PROJECT]',
      'Rapports chantier projet [PROJECT]',
      'Comptes rendus récents projet [PROJECT]',
      'Rapports journaliers projet [PROJECT]',
      'Rapports activité projet [PROJECT]',
      'Derniers comptes rendus pour [PROJECT]',
    ],
    prisma: async (project: string) => {
      return await prisma.site_reports.findMany({
        where: {
          projects: {
            OR: [
              { name: { contains: project, mode: 'insensitive' } },
              { id: { equals: parseInt(project) } },
            ],
          },
        },
        select: {
          id: true,
          created_at: true,
          description: true,
          projects: {
            select: {
              name: true,
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
          created_at: 'desc',
        },
        take: 10,
      });
    },
    response_format: 'table',
    description:
      'Liste des 10 derniers rapports journaliers de chantier pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou ID du projet',
      },
    ],
  },

  vehicle_reservations_by_date: {
    keywords: [
      'véhicule',
      'réservation',
      'disponible',
      'planifié',
      'date',
      'période',
      'calendrier',
    ],
    questions: [
      'Quels véhicules sont réservés le [DATE] ?',
      'Réservations de véhicules pour le [DATE]',
      'Véhicules non disponibles le [DATE]',
      'Planning des véhicules le [DATE]',
      'Quels véhicules sont pris le [DATE] ?',
      'Réservations véhicules du [START_DATE] au [END_DATE]',
      'Véhicules réservés entre [START_DATE] et [END_DATE]',
      'Planning des réservations de véhicules entre [START_DATE] et [END_DATE]',
      'Calendrier des réservations véhicules',
    ],
    prisma: async (startDate: string, endDate?: string) => {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      let end = new Date(start);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end.setHours(23, 59, 59, 999);
      }

      return await prisma.vehicle_reservations.findMany({
        where: {
          OR: [
            { // Réservation commence pendant la période
              start_date: {
                gte: start,
                lte: end,
              },
            },
            { // Réservation se termine pendant la période
              end_date: {
                gte: start,
                lte: end,
              },
            },
            { // Réservation englobe la période
              start_date: {
                lte: start,
              },
              end_date: {
                gte: end,
              },
            },
          ],
        },
        select: {
          id: true,
          start_date: true,
          end_date: true,
          purpose: true,
          vehicles: {
            select: {
              name: true,
              brand: true,
              model: true,
              registration_number: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description:
      'Liste des réservations de véhicules pour une date ou une plage de dates spécifique',
    parameters: [
      {
        name: 'START_DATE',
        description: 'Date de début (format YYYY-MM-DD)',
        default: 'CURRENT_DATE',
      },
      {
        name: 'END_DATE',
        description: 'Date de fin (format YYYY-MM-DD, facultatif)',
      },
    ],
  },
};
