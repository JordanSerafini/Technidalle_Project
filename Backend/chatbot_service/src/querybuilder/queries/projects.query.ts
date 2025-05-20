import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const projectsQueries = {
  active_projects: {
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
    description: 'Liste des projets actuellement en cours avec leurs détails',
  },

  project_details: {
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
    description: "Détails complets d'un projet spécifique",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_stages_status: {
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
    description: 'Liste de tous les documents associés à un projet',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_reports: {
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
    description: 'Liste des rapports de chantier pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_costs: {
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
    description: "Détails des coûts et du budget d'un projet",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_statistics: {
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
          average_completion: projectData.project_stages.reduce(
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
            const hours = (log.check_out.getTime() - log.check_in.getTime()) /
              (1000 * 60 * 60);
            return acc + hours;
          }, 0),
        },
      };

      return stats;
    },
    description: "Statistiques détaillées sur l'avancement et les performances d'un projet",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  project_timeline: {
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
    description: "Chronologie complète des événements et actions d'un projet",
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },
};
