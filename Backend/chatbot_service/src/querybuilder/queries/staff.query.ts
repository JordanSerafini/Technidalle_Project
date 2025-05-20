import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const staffQueries = {
  staff_list: {
    questions: [
      'Liste du personnel',
      'Tous les employés',
      'Qui travaille chez nous ?',
      'Équipe complète',
      'Répertoire du personnel',
      'Membres du staff',
      'Employés de l\'entreprise',
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
    description: 'Liste complète du personnel',
  },

  staff_details: {
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
    description: 'Informations détaillées sur un membre du personnel',
    parameters: [
      {
        name: 'STAFF',
        description: 'Nom ou email du membre du personnel',
      },
    ],
  },

  staff_by_role: {
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
    description: 'Liste du personnel filtré par rôle',
    parameters: [
      {
        name: 'ROLE',
        description: 'Rôle du personnel (par exemple: chef de chantier, électricien, etc.)',
      },
    ],
  },

  staff_workload: {
    questions: [
      'Charge de travail du personnel',
      'Qui est le plus occupé ?',
      'Répartition du temps de travail',
      'Heures par employé',
      'Charge de travail par personne',
      'Qui a le plus d\'heures ?',
      'Statistiques de charge de travail',
      'Heures de travail par personne',
      'Utilisation des ressources humaines',
      'Taux d\'occupation du personnel',
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
      return staffWithLogs.map(staff => {
        // Calculer les heures des time_logs
        const totalLoggedHours = staff.time_logs.reduce((acc, log) => {
          if (!log.check_out) return acc;
          const hours = (log.check_out.getTime() - log.check_in.getTime()) / (1000 * 60 * 60);
          return acc + hours;
        }, 0);

        // Calculer les heures planifiées et travaillées sur les projets
        const plannedHours = staff.project_staff.reduce((acc, ps) => acc + (ps.hours_planned || 0), 0);
        const workedHours = staff.project_staff.reduce((acc, ps) => acc + (ps.hours_worked || 0), 0);

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
      }).sort((a, b) => b.hours_logged_last_month - a.hours_logged_last_month);
    },
    description: 'Analyse de la charge de travail du personnel, triée des plus occupés aux moins occupés',
  },

  staff_without_current_project: {
    questions: [
      'Personnel sans projet en cours',
      'Employés disponibles pour nouveaux projets',
      'Qui n\'a pas de projet actuellement ?',
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
                OR: [
                  { end_date: null },
                  { end_date: { gt: new Date() } },
                ],
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
    description: 'Liste du personnel actuellement disponible, sans affectation à un projet en cours',
  },

  staff_expertise: {
    questions: [
      'Expertise du personnel',
      'Compétences par employé',
      'Qui a travaillé sur quels types de projets ?',
      'Spécialités du personnel',
      'Expérience du personnel par type de projet',
      'Qui a de l\'expérience en [PROJECT_TYPE] ?',
      'Expertise par membre d\'équipe',
      'Compétences de l\'équipe',
      'Domaines d\'expertise du personnel',
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
      return staffWithProjects.map(staff => {
        // Projets uniques sur lesquels la personne a travaillé
        const projectNames = [...new Set(staff.project_staff.map(ps => ps.projects.name))];
        
        // Tags associés à ces projets (pour déterminer les domaines d'expertise)
        const projectTags = staff.project_staff
          .flatMap(ps => ps.projects.project_tags.map(tag => tag.tags.label))
          .filter((value, index, self) => self.indexOf(value) === index);

        // Rôles occupés
        const roleDescriptions = [...new Set(staff.project_staff
          .map(ps => ps.role_description)
          .filter(r => r !== null))] as string[];

        // Étapes réalisées
        const completedStages = [...new Set(staff.stage_checklists.map(sc => sc.project_stages.name))];

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
    description: 'Analyse de l\'expertise du personnel basée sur les projets terminés et les tâches accomplies',
  },
}; 