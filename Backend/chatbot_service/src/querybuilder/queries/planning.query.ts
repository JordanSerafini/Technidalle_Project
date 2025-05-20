import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

interface EventCount {
  day: Date;
  event_count: number;
}

export const planningQueries = {
  staff_schedule_next_week: {
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
    description:
      "Planning du personnel pour la semaine prochaine avec leur nombre d'heures programmées",
  },

  events_today: {
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
    description: "Liste de tous les événements programmés pour aujourd'hui",
  },

  staff_availability_tomorrow: {
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
    description:
      'Liste du personnel disponible pour demain (sans entrées dans le planning)',
  },

  project_staff_distribution: {
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
    description:
      "Répartition du personnel sur les différents projets en cours, avec le nombre d'employés et la liste des membres par projet",
  },

  events_tomorrow: {
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
    description: 'Liste de tous les événements programmés pour demain',
  },

  events_this_week: {
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
    description:
      'Liste de tous les événements programmés pour la semaine en cours',
  },

  events_next_week: {
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
    description:
      'Liste de tous les événements programmés pour la semaine prochaine',
  },

  events_by_type: {
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
    description: 'Liste des événements associés à un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou ID du projet',
      },
    ],
  },

  events_by_staff: {
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
    description: 'Liste des 10 prochains événements programmés',
  },

  busy_days: {
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
    description:
      "Liste des 10 jours avec le plus grand nombre d'événements programmés",
  },

  site_visits_scheduled: {
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
    description:
      'Liste des visites de chantier et réunions sur site programmées',
  },

  client_meetings_scheduled: {
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
    description: 'Liste des rendez-vous avec les clients programmés',
  },

  tasks_due_today: {
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
    description: "Liste des tâches à réaliser aujourd'hui, triées par priorité",
  },

  staff_availability_this_week: {
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
    description:
      'Liste du personnel disponible pour la semaine en cours (sans entrées dans le planning ni événements)',
  },

  project_stages_upcoming: {
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
    description:
      'Liste des 10 prochaines étapes de projet à venir, avec leur planning et le personnel affecté',
  },
};
