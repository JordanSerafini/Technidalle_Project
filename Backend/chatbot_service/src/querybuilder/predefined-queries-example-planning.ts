import { PredefinedQuery } from './querybuilder.types';

export const PREDEFINED_QUERIES_FROM_PLANNING: PredefinedQuery[] = [
  {
    id: 'events_today',
    keywords: [
      'événement',
      'activité',
      'programme',
      'rendez-vous',
      'rdv',
      "aujourd'hui",
      'journée',
      'prévu',
      'jour',
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
    prisma_query: `
      (() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return prisma.events.findMany({
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
      })()
    `,
    fallback_sql:
      "SELECT e.*, p.name AS project_name FROM events e LEFT JOIN projects p ON e.project_id = p.id WHERE e.start_date >= DATE_TRUNC('day', CURRENT_DATE) AND e.start_date < DATE_TRUNC('day', CURRENT_DATE) + INTERVAL '1 day' ORDER BY e.start_date",
    response_format: 'list',
    description: "Liste de tous les événements programmés pour aujourd'hui",
  },

  {
    id: 'staff_availability_tomorrow',
    keywords: [
      'disponible',
      'disponibilité',
      'personnel',
      'staff',
      'employé',
      'demain',
      'libre',
      'non planifié',
      'dispo',
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
    prisma_query: `
      (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        return prisma.staff.findMany({
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
      })()
    `,
    fallback_sql:
      "SELECT s.* FROM staff s WHERE s.is_available = true AND NOT EXISTS (SELECT 1 FROM time_logs t WHERE t.staff_id = s.id AND t.check_in >= CURRENT_DATE + INTERVAL '1 day' AND t.check_in < CURRENT_DATE + INTERVAL '2 days') ORDER BY s.lastname, s.firstname",
    response_format: 'table',
    description:
      'Liste du personnel disponible pour demain (sans entrées dans le planning)',
  },
];
