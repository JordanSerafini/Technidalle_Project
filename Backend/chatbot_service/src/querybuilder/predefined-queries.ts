import { PredefinedQuery } from './querybuilder.types';

export const PREDEFINED_QUERIES: PredefinedQuery[] = [
  {
    id: 'projects_this_year',
    keywords: [
      'chantier',
      'projet',
      'année',
      'prévu',
      'planifié',
      'programmé',
      'travaux',
    ],
    questions: [
      'Quels sont les chantiers prévus cette année ?',
      'Projets planifiés pour cette année',
      'Chantiers programmés cette année',
      "Liste des projets de l'année en cours",
      'Quels travaux sont prévus cette année ?',
      "Chantiers de l'année actuelle",
      "Projets de l'année",
      "Chantiers pour l'année en cours",
      'Quels sont les projets pour cette année ?',
      'Quels chantiers sont programmés pour cette année ?',
      "Travaux de l'année courante",
      'Projets de cette année',
      "Tous les chantiers de l'année",
      "Quels sont les projets prévus pour l'année en cours ?",
      "Chantiers planifiés pour l'année actuelle",
      'Quel sont les chantiers prevu cette année ?',
      'Quel sont les projet prevu cette année ??',
      'Liste des chantier de cette anné',
      'Projets plannifié cette anné',
      "Chantiés de l'anné",
    ],
    parameters: {
      year: 'CURRENT_YEAR',
    },
    prisma_query: `
      prisma.projects.findMany({
        where: {
          start_date: {
            gte: new Date(new Date().getFullYear(), 0, 1),
            lte: new Date(new Date().getFullYear(), 11, 31)
          }
        },
        include: {
          clients: true,
          addresses: true
        },
        orderBy: {
          start_date: 'asc'
        }
      })
    `,
    fallback_sql:
      'SELECT * FROM projects WHERE EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)',
    response_format: 'table',
    description:
      "Liste de tous les projets dont la date de début est dans l'année en cours",
  },
  {
    id: 'active_projects',
    keywords: [
      'chantier',
      'projet',
      'en cours',
      'actif',
      'actuel',
      'travaux',
      'encours',
    ],
    questions: [
      'Quels sont les projets en cours ?',
      'Chantiers actifs actuellement',
      'Projets actifs',
      'Liste des chantiers en cours',
      'Quels sont les travaux actuels ?',
      'Projets en cours de réalisation',
      'Chantiers actifs en ce moment',
      'Travaux en cours',
      'Quels sont les projets actuels ?',
      'Liste des chantiers actifs',
      'Projets en cours de travaux',
      'Chantiers encours',
    ],
    prisma_query: `
      prisma.projects.findMany({
        where: {
          status: 'en_cours'
        },
        include: {
          clients: true,
          addresses: true,
          project_stages: {
            where: {
              is_completed: false
            },
            orderBy: {
              start_date: 'asc'
            },
            take: 1
          }
        },
        orderBy: {
          start_date: 'asc'
        }
      })
    `,
    fallback_sql: "SELECT * FROM projects WHERE status = 'en_cours'",
    response_format: 'table',
    description: 'Liste de tous les projets actuellement en cours',
  },
  {
    id: 'projects_by_client',
    keywords: ['client', 'chantier', 'projet', 'travaux'],
    questions: [
      'Quels sont les projets du client {client_name} ?',
      'Chantiers pour le client {client_name}',
      'Projets associés à {client_name}',
      'Liste des travaux pour {client_name}',
      'Quels sont les chantiers de {client_name} ?',
      'Projets du client {client_name}',
      'Travaux réalisés pour {client_name}',
      'Quels projets avons-nous avec {client_name} ?',
      'Chantiers liés au client {client_name}',
    ],
    parameters: {
      client_name: '',
    },
    prisma_query: `
      prisma.projects.findMany({
        where: {
          clients: {
            OR: [
              { firstname: { contains: params.client_name, mode: 'insensitive' } },
              { lastname: { contains: params.client_name, mode: 'insensitive' } },
              { company_name: { contains: params.client_name, mode: 'insensitive' } }
            ]
          }
        },
        include: {
          clients: true,
          addresses: true
        },
        orderBy: {
          start_date: 'desc'
        }
      })
    `,
    fallback_sql:
      "SELECT p.* FROM projects p JOIN clients c ON p.client_id = c.id WHERE c.firstname ILIKE '%{client_name}%' OR c.lastname ILIKE '%{client_name}%' OR c.company_name ILIKE '%{client_name}%'",
    response_format: 'table',
    description: 'Liste des projets associés à un client spécifique',
  },
  {
    id: 'events_next_week',
    keywords: [
      'événement',
      'evenement',
      'évènement',
      'rendez-vous',
      'rdv',
      'agenda',
      'planning',
      'semaine',
      'prochaine',
    ],
    questions: [
      'Quels sont les événements la semaine prochaine ?',
      'Planning de la semaine prochaine',
      'Rendez-vous de la semaine prochaine',
      'Agenda de la semaine prochaine',
      'Quels sont les RDV prévus la semaine prochaine ?',
      'Événements à venir semaine prochaine',
      'Quelles sont les activités prévues pour la semaine prochaine ?',
      'Quels rendez-vous avons-nous semaine prochaine ?',
      'Planification semaine prochaine',
      'Calendrier de la semaine à venir',
    ],
    prisma_query: `
      (() => {
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7);
        nextMonday.setHours(0, 0, 0, 0);
        
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);
        nextSunday.setHours(23, 59, 59, 999);
        
        return prisma.events.findMany({
          where: {
            start_date: {
              gte: nextMonday,
              lte: nextSunday
            }
          },
          include: {
            clients: true,
            projects: true,
            staff: true
          },
          orderBy: {
            start_date: 'asc'
          }
        });
      })()
    `,
    fallback_sql:
      "WITH next_week AS (SELECT date_trunc('week', current_date + interval '1 week') AS start, date_trunc('week', current_date + interval '1 week') + interval '6 days' AS end) SELECT e.* FROM events e, next_week WHERE e.start_date >= next_week.start AND e.start_date <= next_week.end ORDER BY e.start_date",
    response_format: 'list',
    description: 'Liste des événements prévus pour la semaine prochaine',
  },
  {
    id: 'project_details',
    keywords: [
      'détail',
      'detail',
      'information',
      'chantier',
      'projet',
      'spécifique',
    ],
    questions: [
      'Détails du projet {project_id}',
      'Informations sur le chantier {project_id}',
      'Détails du chantier numéro {project_id}',
      'Donne-moi les informations sur le projet {project_id}',
      "Quel est l'état du projet {project_id} ?",
      'Détails complets du projet {project_id}',
      'Informations détaillées sur le chantier {project_id}',
      'Je veux tout savoir sur le projet {project_id}',
      'Détails du projet avec ID {project_id}',
    ],
    parameters: {
      project_id: 0,
    },
    prisma_query: `
      prisma.projects.findUnique({
        where: {
          id: Number(params.project_id)
        },
        include: {
          clients: true,
          addresses: true,
          project_stages: {
            include: {
              stage_tags: {
                include: {
                  tags: true
                }
              }
            },
            orderBy: {
              order_index: 'asc'
            }
          },
          project_tags: {
            include: {
              tags: true
            }
          },
          documents: {
            where: {
              type: {
                in: ['devis', 'facture']
              }
            },
            orderBy: {
              issue_date: 'desc'
            }
          }
        }
      })
    `,
    fallback_sql: 'SELECT * FROM projects WHERE id = {project_id}',
    response_format: 'card',
    description: 'Informations détaillées sur un projet spécifique',
  },
];
