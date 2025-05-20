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

  staff_working_next_month: {
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
    description:
      'Liste du personnel qui travaillera sur des projets actifs le mois prochain',
  },

  staff_schedule_by_date: {
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
    description:
      'Liste de tous les événements programmés pour le mois en cours',
  },

  deadlines_this_month: {
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
    description: "Liste des échéances d'étapes de projets pour le mois courant",
  },

  daily_site_reports_recent: {
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
    description: 'Liste des 10 derniers rapports journaliers de chantier',
  },

  staff_availability_month: {
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
    description:
      'Liste du personnel disponible pour le mois en cours (sans entrées dans le planning)',
  },

  staff_availability_week: {
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
    description:
      'Liste du personnel disponible pour la semaine en cours (sans entrées dans le planning)',
  },

  staff_availability_next_week: {
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
    description:
      'Liste du personnel disponible pour la semaine prochaine (sans entrées dans le planning)',
  },

  missing_timesheets: {
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
    description: "Liste des employés qui n'ont pas de pointage aujourd'hui",
  },

  daily_workload: {
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
    description:
      "Nombre total d'heures de travail enregistrées pour chaque jour de la semaine en cours",
  },

  work_hours_per_project: {
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
    description: "Nombre d'heures travaillées par projet cette semaine",
  },

  staff_most_worked_current_month: {
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
    description:
      "Top 10 des employés ayant accumulé le plus d'heures de travail effectif durant le mois en cours",
  },

  staff_availability_next_month: {
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
    description:
      'Liste du personnel disponible pour le mois prochain (sans affectation à des projets pour cette période)',
  },
};
