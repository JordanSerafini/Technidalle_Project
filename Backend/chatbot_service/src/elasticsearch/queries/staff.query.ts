import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const staffQueries = {
  staff_list: {
    keywords: [
      'personnel',
      'employé',
      'staff',
      'équipe',
      'membre',
      'liste',
      'répertoire',
    ],
    questions: [
      'Liste du personnel',
      'Tous les employés',
      'Qui travaille chez nous ?',
      'Équipe complète',
      'Répertoire du personnel',
      'Membres du staff',
      "Employés de l'entreprise",
      'Notre équipe',
      'Listing du personnel',
      'Tous les membres du staff',
    ],
    prisma: async () => {
      return await prisma.staff.findMany({
        select: {
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          mobile: true,
          roles: {
            select: {
              name: true,
            },
          },
          is_available: true,
          hire_date: true,
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste complète du personnel',
  },

  staff_details: {
    keywords: [
      'détail',
      'information',
      'fiche',
      'profil',
      'coordonnée',
      'contact',
      'employé',
      'personnel',
    ],
    questions: [
      'Détails de [STAFF]',
      'Informations sur [STAFF]',
      'Fiche de [STAFF]',
      'Profil de [STAFF]',
      'Coordonnées de [STAFF]',
      'Qui est [STAFF] ?',
      'Informations employé [STAFF]',
      'Contact [STAFF]',
      'Données de [STAFF]',
      'Dossier de [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.staff.findFirst({
        where: {
          OR: [
            { firstname: { contains: staff, mode: 'insensitive' } },
            { lastname: { contains: staff, mode: 'insensitive' } },
            { email: { contains: staff, mode: 'insensitive' } },
          ],
        },
        include: {
          addresses: true,
          roles: true,
          project_staff: {
            select: {
              role_description: true,
              start_date: true,
              end_date: true,
              hours_planned: true,
              hours_worked: true,
              projects: {
                select: {
                  name: true,
                  reference: true,
                  status: true,
                },
              },
            },
            where: {
              projects: {
                status: {
                  in: ['en_cours', 'en_preparation'],
                },
              },
            },
            orderBy: {
              start_date: 'desc',
            },
          },
          time_logs: {
            select: {
              check_in: true,
              check_out: true,
              projects: {
                select: {
                  name: true,
                },
              },
              project_stages: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              check_in: 'desc',
            },
            take: 10,
          },
          events: {
            where: {
              start_date: {
                gte: new Date(),
              },
            },
            select: {
              title: true,
              start_date: true,
              end_date: true,
              event_type: true,
              projects: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              start_date: 'asc',
            },
          },
        },
      });
    },
    response_format: 'object',
    description: 'Informations détaillées sur un membre du personnel',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  staff_by_role: {
    keywords: [
      'personnel',
      'rôle',
      'employé',
      'fonction',
      'poste',
      'métier',
      'équipe',
      'type',
    ],
    questions: [
      'Personnel avec le rôle [ROLE]',
      'Employés [ROLE]',
      'Qui est [ROLE] ?',
      'Liste des [ROLE]',
      'Équipe [ROLE]',
      'Staff [ROLE]',
      'Membres [ROLE]',
      'Employés de type [ROLE]',
      'Personnel de type [ROLE]',
      'Trouver les [ROLE]',
    ],
    prisma: async (role: string) => {
      return await prisma.staff.findMany({
        where: {
          roles: {
            name: {
              contains: role,
              mode: 'insensitive',
            },
          },
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          mobile: true,
          is_available: true,
          roles: {
            select: {
              name: true,
              description: true,
            },
          },
          project_staff: {
            select: {
              projects: {
                select: {
                  name: true,
                  status: true,
                },
              },
            },
            where: {
              projects: {
                status: 'en_cours',
              },
            },
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description: 'Liste du personnel filtré par rôle',
    parameters: [
      {
        name: 'ROLE',
        description:
          'Rôle du personnel (par exemple: chef de chantier, électricien, etc.)',
      },
    ],
  },

  staff_workload: {
    keywords: [
      'charge',
      'travail',
      'occupé',
      'heure',
      'temps',
      'répartition',
      'statistique',
      'utilisation',
    ],
    questions: [
      'Charge de travail du personnel',
      'Qui est le plus occupé ?',
      'Répartition du temps de travail',
      'Heures par employé',
      'Charge de travail par personne',
      "Qui a le plus d'heures ?",
      'Statistiques de charge de travail',
      'Heures de travail par personne',
      'Utilisation des ressources humaines',
      "Taux d'occupation du personnel",
    ],
    prisma: async () => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const staffWithLogs = await prisma.staff.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          time_logs: {
            where: {
              check_in: {
                gte: oneMonthAgo,
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
          project_staff: {
            select: {
              hours_planned: true,
              hours_worked: true,
              projects: {
                select: {
                  name: true,
                },
              },
            },
            where: {
              projects: {
                status: 'en_cours',
              },
            },
          },
        },
      });

      // Calcul des statistiques
      return staffWithLogs
        .map((staff) => {
          // Calculer les heures des time_logs
          const totalLoggedHours = staff.time_logs.reduce((acc, log) => {
            if (!log.check_out) return acc;
            const hours =
              (log.check_out.getTime() - log.check_in.getTime()) /
              (1000 * 60 * 60);
            return acc + hours;
          }, 0);

          // Calculer les heures planifiées et travaillées sur les projets
          const plannedHours = staff.project_staff.reduce(
            (acc, ps) => acc + (ps.hours_planned || 0),
            0,
          );
          const workedHours = staff.project_staff.reduce(
            (acc, ps) => acc + (ps.hours_worked || 0),
            0,
          );

          // Calculer le nombre de projets actifs
          const activeProjects = staff.project_staff.length;

          return {
            firstname: staff.firstname,
            lastname: staff.lastname,
            hours_logged_last_month: Math.round(totalLoggedHours * 10) / 10,
            total_planned_hours: plannedHours,
            total_worked_hours: workedHours,
            active_projects_count: activeProjects,
          };
        })
        .sort((a, b) => b.hours_logged_last_month - a.hours_logged_last_month);
    },
    response_format: 'table',
    description:
      'Analyse de la charge de travail du personnel, triée des plus occupés aux moins occupés',
  },

  staff_without_current_project: {
    keywords: [
      'personnel',
      'projet',
      'disponible',
      'libre',
      'assigné',
      'affectation',
      'ressource',
      'allocation',
    ],
    questions: [
      'Personnel sans projet en cours',
      'Employés disponibles pour nouveaux projets',
      "Qui n'a pas de projet actuellement ?",
      'Personnel libre pour affectation',
      'Employés non assignés',
      'Personnel sans affectation',
      'Ressources humaines disponibles',
      'Qui est libre pour un nouveau projet ?',
      'Personnel non alloué',
      'Employés sans chantier actuel',
    ],
    prisma: async () => {
      return await prisma.staff.findMany({
        where: {
          is_available: true,
          NOT: {
            project_staff: {
              some: {
                projects: {
                  status: {
                    in: ['en_cours', 'en_preparation'],
                  },
                },
                OR: [{ end_date: null }, { end_date: { gt: new Date() } }],
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
          hire_date: true,
          project_staff: {
            select: {
              projects: {
                select: {
                  name: true,
                  status: true,
                  end_date: true,
                },
              },
              end_date: true,
            },
            orderBy: {
              end_date: 'desc',
            },
            take: 1,
          },
        },
        orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      });
    },
    response_format: 'table',
    description:
      'Liste du personnel actuellement disponible, sans affectation à un projet en cours',
  },

  staff_expertise: {
    keywords: [
      'expertise',
      'compétence',
      'spécialité',
      'expérience',
      'savoir-faire',
      'domaine',
      'spécialisation',
      'connaissance',
    ],
    questions: [
      'Expertise du personnel',
      'Compétences par employé',
      'Qui a travaillé sur quels types de projets ?',
      'Spécialités du personnel',
      'Expérience du personnel par type de projet',
      "Qui a de l'expérience en [PROJECT_TYPE] ?",
      "Expertise par membre d'équipe",
      "Compétences de l'équipe",
      "Domaines d'expertise du personnel",
      'Spécialisation des employés',
    ],
    prisma: async () => {
      // Récupérer le personnel avec leurs projets passés
      const staffWithProjects = await prisma.staff.findMany({
        select: {
          firstname: true,
          lastname: true,
          roles: {
            select: {
              name: true,
            },
          },
          project_staff: {
            select: {
              role_description: true,
              projects: {
                select: {
                  name: true,
                  description: true,
                  status: true,
                  project_tags: {
                    select: {
                      tags: {
                        select: {
                          label: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            where: {
              projects: {
                status: 'termine',
              },
            },
          },
          stage_checklists: {
            select: {
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
            where: {
              is_done: true,
            },
          },
          tasks: {
            select: {
              label: true,
              status: true,
              project_stages: {
                select: {
                  name: true,
                },
              },
            },
            where: {
              status: 'termine',
            },
          },
        },
      });

      // Analyser l'expertise basée sur les projets terminés, les checklists et les tâches
      return staffWithProjects.map((staff) => {
        // Projets uniques sur lesquels la personne a travaillé
        const projectNames = [
          ...new Set(staff.project_staff.map((ps) => ps.projects.name)),
        ];

        // Tags associés à ces projets (pour déterminer les domaines d'expertise)
        const projectTags = staff.project_staff
          .flatMap((ps) =>
            ps.projects.project_tags.map((tag) => tag.tags.label),
          )
          .filter((value, index, self) => self.indexOf(value) === index);

        // Rôles occupés
        const roleDescriptions = [
          ...new Set(
            staff.project_staff
              .map((ps) => ps.role_description)
              .filter((r) => r !== null),
          ),
        ] as string[];

        // Étapes réalisées
        const completedStages = [
          ...new Set(
            staff.stage_checklists.map((sc) => sc.project_stages.name),
          ),
        ];

        return {
          firstname: staff.firstname,
          lastname: staff.lastname,
          role: staff.roles?.name,
          completed_projects_count: projectNames.length,
          expertise_domains: projectTags,
          roles_performed: roleDescriptions,
          completed_stages: completedStages,
        };
      });
    },
    response_format: 'table',
    description:
      "Analyse de l'expertise du personnel basée sur les projets terminés et les tâches accomplies",
  },

  staff_projects_history: {
    keywords: [
      'historique',
      'projet',
      'passé',
      'réalisation',
      'travail',
      'accomplissement',
      'portfolio',
    ],
    questions: [
      'Historique des projets de [STAFF]',
      'Sur quels projets [STAFF] a-t-il travaillé ?',
      'Projets réalisés par [STAFF]',
      'Quels chantiers a fait [STAFF] ?',
      'Historique professionnel de [STAFF]',
      'Portfolio de [STAFF]',
      'Projets passés de [STAFF]',
      'Réalisations de [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.project_staff.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          projects: {
            select: {
              name: true,
              reference: true,
              status: true,
              start_date: true,
              end_date: true,
              clients: {
                select: {
                  firstname: true,
                  lastname: true,
                  company_name: true,
                },
              },
              project_tags: {
                select: {
                  tags: {
                    select: {
                      label: true,
                    },
                  },
                },
              },
            },
          },
          role_description: true,
          start_date: true,
          end_date: true,
          hours_planned: true,
          hours_worked: true,
        },
        orderBy: {
          start_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Historique complet des projets sur lesquels un membre du personnel a travaillé',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  staff_time_tracking: {
    keywords: [
      'temps',
      'heure',
      'pointage',
      'suivi',
      'présence',
      'journée',
      'travail',
    ],
    questions: [
      'Suivi du temps de [STAFF]',
      'Heures travaillées par [STAFF]',
      'Pointages de [STAFF]',
      'Temps de travail de [STAFF]',
      'Quand [STAFF] a-t-il travaillé ?',
      'Historique des heures de [STAFF]',
      'Présence de [STAFF]',
    ],
    prisma: async (staff: string, period: string = '30') => {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (isNaN(daysAgo) ? 30 : daysAgo));
      
      return await prisma.time_logs.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
          check_in: {
            gte: startDate,
          },
        },
        select: {
          check_in: true,
          check_out: true,
          projects: {
            select: {
              name: true,
            },
          },
          project_stages: {
            select: {
              name: true,
            },
          },
          comment: true,
        },
        orderBy: {
          check_in: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Historique détaillé des temps de travail enregistrés pour un membre du personnel',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
      {
        name: 'PERIOD',
        description: 'Nombre de jours à analyser (par défaut: 30)',
        optional: true,
      },
    ],
  },

  staff_performance: {
    keywords: [
      'performance',
      'efficacité',
      'rendement',
      'productivité',
      'résultat',
      'accomplissement',
      'qualité',
    ],
    questions: [
      'Performance de [STAFF]',
      'Efficacité de [STAFF]',
      'Rendement de [STAFF]',
      'Productivité de [STAFF]',
      'Qualité du travail de [STAFF]',
      'Évaluation de [STAFF]',
      'Résultats de [STAFF]',
    ],
    prisma: async (staff: string) => {
      // Récupérer l'ID du membre du personnel
      const staffMember = await prisma.staff.findFirst({
        where: {
          OR: [
            { firstname: { contains: staff, mode: 'insensitive' } },
            { lastname: { contains: staff, mode: 'insensitive' } },
            { email: { contains: staff, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
        },
      });

      if (!staffMember) return null;

      // Tâches accomplies
      const completedTasks = await prisma.tasks.count({
        where: {
          assigned_to: staffMember.id,
          status: 'termine',
        },
      });

      // Tâches en retard
      const lateTasks = await prisma.tasks.count({
        where: {
          assigned_to: staffMember.id,
          status: { not: 'termine' },
          due_date: { lt: new Date() },
        },
      });

      // Points de contrôle complétés
      const completedChecklists = await prisma.stage_checklists.count({
        where: {
          staff_id: staffMember.id,
          is_done: true,
        },
      });

      // Temps de travail
      const timeLogs = await prisma.time_logs.findMany({
        where: {
          staff_id: staffMember.id,
          check_out: { not: null },
        },
        select: {
          check_in: true,
          check_out: true,
        },
      });

      // Projets terminés à temps
      const projectsOnTime = await prisma.project_staff.count({
        where: {
          staff_id: staffMember.id,
          hours_worked: { lte: prisma.project_staff.fields.hours_planned },
          projects: {
            end_date: { lte: prisma.projects.fields.end_date },
            status: 'termine',
          },
        },
      });

      // Projets en retard
      const projectsLate = await prisma.project_staff.count({
        where: {
          staff_id: staffMember.id,
          hours_worked: { gt: prisma.project_staff.fields.hours_planned },
          projects: {
            status: 'termine',
          },
        },
      });

      // Calculer les heures totales travaillées
      const totalHours = timeLogs.reduce((acc, log) => {
        if (!log.check_out) return acc;
        const hours = (log.check_out.getTime() - log.check_in.getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }, 0);

      return {
        staff_name: `${staffMember.firstname} ${staffMember.lastname}`,
        completed_tasks: completedTasks,
        late_tasks: lateTasks,
        completed_checklists: completedChecklists,
        projects_completed_on_time: projectsOnTime,
        projects_completed_late: projectsLate,
        total_hours_logged: Math.round(totalHours * 10) / 10,
        performance_ratio: completedTasks > 0 
          ? Math.round((completedTasks / (completedTasks + lateTasks)) * 100) 
          : 0,
      };
    },
    response_format: 'object',
    description: 'Analyse détaillée de la performance d\'un membre du personnel',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  newest_staff_members: {
    keywords: [
      'nouveau',
      'récent',
      'embauche',
      'recruté',
      'arrivée',
      'intégration',
      'récemment',
    ],
    questions: [
      'Nouveaux membres du personnel',
      'Qui a été récemment embauché ?',
      'Dernières embauches',
      'Personnel récent',
      'Derniers arrivés dans l\'équipe',
      'Nouvelles recrues',
      'Récentes intégrations',
    ],
    prisma: async (months: string = '6') => {
      const monthsAgo = parseInt(months);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (isNaN(monthsAgo) ? 6 : monthsAgo));
      
      return await prisma.staff.findMany({
        where: {
          hire_date: {
            gte: startDate,
          },
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          roles: {
            select: {
              name: true,
            },
          },
          hire_date: true,
          project_staff: {
            select: {
              projects: {
                select: {
                  name: true,
                },
              },
            },
            where: {
              projects: {
                status: 'en_cours',
              },
            },
          },
        },
        orderBy: {
          hire_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des membres du personnel récemment embauchés',
    parameters: [
      {
        name: 'MONTHS',
        description: 'Nombre de mois à considérer (par défaut: 6)',
        optional: true,
      },
    ],
  },

  staff_vehicle_usage: {
    keywords: [
      'véhicule',
      'voiture',
      'transport',
      'déplacement',
      'réservation',
      'conduite',
      'utilisation',
    ],
    questions: [
      'Utilisation des véhicules par [STAFF]',
      'Véhicules réservés par [STAFF]',
      'Quels véhicules [STAFF] utilise-t-il ?',
      'Réservations de véhicules pour [STAFF]',
      'Déplacements de [STAFF]',
      'Transport utilisé par [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.vehicle_reservations.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
        },
        select: {
          vehicles: {
            select: {
              name: true,
              type: true,
              brand: true,
              model: true,
              registration_number: true,
            },
          },
          start_date: true,
          end_date: true,
          starting_mileage: true,
          ending_mileage: true,
          purpose: true,
          projects: {
            select: {
              name: true,
              reference: true,
            },
          },
        },
        orderBy: {
          start_date: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Historique d\'utilisation des véhicules par un membre du personnel',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  staff_by_location: {
    keywords: [
      'localisation',
      'adresse',
      'zone',
      'région',
      'géographique',
      'lieu',
      'secteur',
    ],
    questions: [
      'Personnel par localisation',
      'Qui travaille dans [LOCATION] ?',
      'Employés dans la région [LOCATION]',
      'Personnel dans la zone [LOCATION]',
      'Staff par secteur géographique',
      'Membres de l\'équipe à [LOCATION]',
    ],
    prisma: async (location: string) => {
      return await prisma.staff.findMany({
        where: {
          addresses: {
            OR: [
              { city: { contains: location, mode: 'insensitive' } },
              { zip_code: { contains: location, mode: 'insensitive' } },
              { street_name: { contains: location, mode: 'insensitive' } },
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
          addresses: {
            select: {
              street_number: true,
              street_name: true,
              zip_code: true,
              city: true,
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
    description: 'Liste du personnel filtré par localisation géographique',
    parameters: [
      {
        name: 'LOCATION',
        description: 'Ville, code postal ou rue',
      },
    ],
  },

  staff_contact_directory: {
    keywords: [
      'contact',
      'téléphone',
      'email',
      'coordonnée',
      'annuaire',
      'répertoire',
      'joindre',
    ],
    questions: [
      'Annuaire du personnel',
      'Contacts de l\'équipe',
      'Répertoire téléphonique',
      'Comment joindre l\'équipe',
      'Coordonnées du personnel',
      'Numéros et emails de l\'équipe',
      'Annuaire de contacts',
    ],
    prisma: async () => {
      return await prisma.staff.findMany({
        select: {
          firstname: true,
          lastname: true,
          email: true,
          phone: true,
          mobile: true,
          roles: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { roles: { name: 'asc' } },
          { lastname: 'asc' },
          { firstname: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Annuaire complet des contacts du personnel, organisé par rôle',
  },

  staff_tasks_overview: {
    keywords: [
      'tâche',
      'à faire',
      'assigné',
      'affecté',
      'travail',
      'activité',
      'mission',
    ],
    questions: [
      'Tâches assignées à [STAFF]',
      'Que doit faire [STAFF] ?',
      'Travail en cours pour [STAFF]',
      'À faire pour [STAFF]',
      'Tâches actuelles de [STAFF]',
      'Missions de [STAFF]',
      'Activités prévues pour [STAFF]',
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
        orderBy: [
          { priority: 'desc' },
          { due_date: 'asc' },
        ],
      });
    },
    response_format: 'table',
    description: 'Aperçu des tâches assignées à un membre du personnel, triées par priorité et date d\'échéance',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  staff_upcoming_events: {
    keywords: [
      'événement',
      'agenda',
      'planning',
      'calendrier',
      'rendez-vous',
      'réunion',
      'visite',
    ],
    questions: [
      'Événements à venir pour [STAFF]',
      'Agenda de [STAFF]',
      'Planning de [STAFF]',
      'Prochaines réunions de [STAFF]',
      'Rendez-vous de [STAFF]',
      'Calendrier de [STAFF]',
      'Programme de [STAFF]',
    ],
    prisma: async (staff: string) => {
      return await prisma.events.findMany({
        where: {
          staff: {
            OR: [
              { firstname: { contains: staff, mode: 'insensitive' } },
              { lastname: { contains: staff, mode: 'insensitive' } },
              { email: { contains: staff, mode: 'insensitive' } },
            ],
          },
          start_date: {
            gte: new Date(),
          },
        },
        select: {
          title: true,
          description: true,
          event_type: true,
          start_date: true,
          end_date: true,
          location: true,
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
          start_date: 'asc',
        },
      });
    },
    response_format: 'table',
    description: 'Liste des événements à venir pour un membre du personnel',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },
  staff_engagement_rate: {
    keywords: [
      'engagement',
      'occupation',
      'disponibilité',
      'charge',
      'activité',
      'planification',
      'taux',
    ],
    questions: [
      'Quel est le taux d’occupation cette semaine ?',
      'Taux d’engagement du personnel',
      'Qui est le plus occupé cette semaine ?',
      'Heures planifiées par employé cette semaine',
      'Engagement du personnel cette semaine',
      'Taux d’occupation des employés',
      'Statistiques de planification hebdomadaire',
      'Charge planifiée cette semaine',
    ],
    prisma: async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
  
      const staffData = await prisma.staff.findMany({
        select: {
          firstname: true,
          lastname: true,
          project_staff: {
            select: {
              hours_planned: true,
              start_date: true,
              end_date: true,
            },
            where: {
              OR: [
                {
                  start_date: { gte: startOfWeek, lte: endOfWeek },
                },
                {
                  end_date: { gte: startOfWeek, lte: endOfWeek },
                },
                {
                  AND: [
                    { start_date: { lte: startOfWeek } },
                    { end_date: { gte: endOfWeek } },
                  ],
                },
              ],
            },
          },
        },
      });
  
      return staffData.map((staff) => {
        const plannedHours = staff.project_staff.reduce((acc, ps) => {
          return acc + (ps.hours_planned ?? 0);
        }, 0);
  
        const maxAvailable = 35;
        const engagementRate = Math.round((plannedHours / maxAvailable) * 100);
  
        return {
          firstname: staff.firstname,
          lastname: staff.lastname,
          planned_hours: plannedHours,
          engagement_rate: `${Math.min(engagementRate, 100)}%`,
        };
      });
    },
    response_format: 'table',
    description:
      'Taux d’engagement hebdomadaire de chaque membre du personnel (heures planifiées vs disponibles)',
  },
  staff_utilization_alerts: {
    keywords: [
      'alerte',
      'surcharge',
      'sous-utilisation',
      'heures',
      'planification',
      'charge',
      'risque',
    ],
    questions: [
      'Y a-t-il des employés surchargés ?',
      'Qui est sous-utilisé ?',
      'Alerte de charge de travail',
      'Personnel en surcharge',
      'Employés sous-exploités',
      'Heures planifiées extrêmes',
      'Analyse des charges extrêmes',
    ],
    prisma: async () => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
  
      const staffData = await prisma.staff.findMany({
        select: {
          firstname: true,
          lastname: true,
          project_staff: {
            select: {
              hours_planned: true,
              start_date: true,
              end_date: true,
            },
            where: {
              OR: [
                {
                  start_date: { lte: endOfWeek },
                  end_date: { gte: startOfWeek },
                },
              ],
            },
          },
        },
      });
  
      return staffData
        .map((staff) => {
          const plannedHours = staff.project_staff.reduce((acc, ps) => acc + (ps.hours_planned ?? 0), 0);
          const max = 40;
          return {
            firstname: staff.firstname,
            lastname: staff.lastname,
            planned_hours: plannedHours,
            status:
              plannedHours > max
                ? 'Surcharge'
                : plannedHours < 10
                ? 'Sous-utilisation'
                : 'OK',
          };
        })
        .filter((s) => s.status !== 'OK');
    },
    response_format: 'table',
    description: "Liste du personnel en surcharge ou sous-utilisé cette semaine (alerte RH)",
  },
    
};
