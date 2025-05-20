import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

export const materialsQueries = {
  materials_list: {
    questions: [
      'Liste des matériaux',
      'Tous les matériaux',
      'Catalogue de matériaux',
      'Matériaux disponibles',
      'Stock de matériaux',
      'Inventaire des matériaux',
      'Quels matériaux avons-nous ?',
      'Matériaux en stock',
      'Base de données matériaux',
      'Catalogue fournitures',
    ],
    prisma: async () => {
      return await prisma.materials.findMany({
        select: {
          name: true,
          description: true,
          reference: true,
          unit: true,
          price: true,
          stock_quantity: true,
          minimum_stock: true,
          supplier: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    },
    description: 'Liste complète des matériaux disponibles',
  },

  material_details: {
    questions: [
      'Détails du matériau [MATERIAL]',
      'Information sur [MATERIAL]',
      'Fiche produit [MATERIAL]',
      'Caractéristiques de [MATERIAL]',
      'Spécifications [MATERIAL]',
      'Données [MATERIAL]',
      'Détails [MATERIAL]',
      'Fiche technique [MATERIAL]',
      'Info [MATERIAL]',
      'Détails sur [MATERIAL]',
    ],
    prisma: async (material: string) => {
      return await prisma.materials.findFirst({
        where: {
          OR: [
            { name: { contains: material, mode: 'insensitive' } },
            { reference: { contains: material, mode: 'insensitive' } },
          ],
        },
        select: {
          name: true,
          description: true,
          reference: true,
          unit: true,
          price: true,
          stock_quantity: true,
          minimum_stock: true,
          supplier: true,
          supplier_reference: true,
          project_materials: {
            select: {
              quantity_planned: true,
              quantity_used: true,
              unit_price: true,
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
              projects: {
                start_date: 'desc',
              },
            },
            take: 10,
          },
          document_lines: {
            select: {
              quantity: true,
              unit_price: true,
              documents: {
                select: {
                  type: true,
                  reference: true,
                  issue_date: true,
                },
              },
            },
            orderBy: {
              documents: {
                issue_date: 'desc',
              },
            },
            take: 5,
          },
        },
      });
    },
    description: 'Informations détaillées sur un matériau spécifique',
    parameters: [
      {
        name: 'MATERIAL',
        description: 'Nom ou référence du matériau',
      },
    ],
  },

  low_stock_materials: {
    questions: [
      'Matériaux en stock faible',
      'Stock à réapprovisionner',
      'Matériaux sous le seuil minimum',
      'Quels matériaux manquent ?',
      'Stock critique',
      'Alerte stock matériaux',
      'Matériaux à commander',
      'Inventaire critique',
      'Rupture de stock',
      'Matériaux en quantité insuffisante',
    ],
    prisma: async () => {
      return await prisma.materials.findMany({
        where: {
          stock_quantity: {
            lte: prisma.materials.fields.minimum_stock,
          },
        },
        select: {
          name: true,
          reference: true,
          unit: true,
          stock_quantity: true,
          minimum_stock: true,
          supplier: true,
          price: true,
        },
        orderBy: [
          {
            stock_quantity: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      });
    },
    description: 'Liste des matériaux dont le stock est inférieur ou égal au seuil minimum',
  },

  materials_by_supplier: {
    questions: [
      'Matériaux du fournisseur [SUPPLIER]',
      'Quels produits fournit [SUPPLIER] ?',
      'Catalogue [SUPPLIER]',
      'Matériaux de [SUPPLIER]',
      'Fournitures [SUPPLIER]',
      'Produits de [SUPPLIER]',
      'Stock [SUPPLIER]',
      'Inventaire [SUPPLIER]',
      'Articles de [SUPPLIER]',
      'Que fournit [SUPPLIER] ?',
    ],
    prisma: async (supplier: string) => {
      return await prisma.materials.findMany({
        where: {
          supplier: {
            contains: supplier,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
          reference: true,
          unit: true,
          price: true,
          stock_quantity: true,
          supplier_reference: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    },
    description: 'Liste des matériaux filtrés par fournisseur',
    parameters: [
      {
        name: 'SUPPLIER',
        description: 'Nom du fournisseur',
      },
    ],
  },

  most_used_materials: {
    questions: [
      'Matériaux les plus utilisés',
      'Top des matériaux',
      'Matériaux populaires',
      'Quels sont les matériaux les plus consommés ?',
      'Statistiques d\'utilisation des matériaux',
      'Matériaux principaux',
      'Consommation de matériaux',
      'Top consommation',
      'Matériaux fréquemment utilisés',
      'Classement des matériaux',
    ],
    prisma: async () => {
      // Récupérer tous les matériaux avec leurs utilisations dans les projets
      const materialsWithUsage = await prisma.materials.findMany({
        select: {
          id: true,
          name: true,
          reference: true,
          unit: true,
          price: true,
          project_materials: {
            select: {
              quantity_used: true,
            },
          },
        },
      });

      // Calculer les totaux d'utilisation
      const materialsUsage = materialsWithUsage.map(material => {
        const totalUsed = material.project_materials.reduce(
          (acc, pm) => acc + (pm.quantity_used || 0),
          0
        );

        return {
          name: material.name,
          reference: material.reference,
          unit: material.unit,
          price: material.price,
          total_quantity_used: totalUsed,
          total_value: Number(material.price || 0) * totalUsed,
        };
      });

      // Trier par utilisation décroissante
      return materialsUsage
        .sort((a, b) => b.total_quantity_used - a.total_quantity_used)
        .slice(0, 20); // Retourner les 20 premiers
    },
    description: 'Top 20 des matériaux les plus utilisés dans les projets',
  },

  project_material_consumption: {
    questions: [
      'Consommation de matériaux par projet',
      'Matériaux utilisés par projet',
      'Quels matériaux pour le projet [PROJECT] ?',
      'Consommation projet [PROJECT]',
      'Utilisation matériaux [PROJECT]',
      'Matériaux consommés [PROJECT]',
      'Répartition matériaux [PROJECT]',
      'Ressources utilisées [PROJECT]',
      'Matériaux alloués [PROJECT]',
      'Consommation ressources [PROJECT]',
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
              status: true,
            },
          },
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
            materials: {
              name: 'asc',
            },
          },
        ],
      });
    },
    description: 'Analyse de la consommation de matériaux pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },
}; 