import { PrismaService } from '../../prisma/prisma.service';

// Exporter une fonction factory qui prend le PrismaService en paramètre
export const getMaterialsQueries = (prismaService: PrismaService) => ({
  materials_list: {
    keywords: [
      'matériau',
      'liste',
      'catalogue',
      'stock',
      'inventaire',
      'disponible',
      'fourniture',
    ],
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
      return await prismaService.materials.findMany({
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
    response_format: 'table',
    description: 'Liste complète des matériaux disponibles',
  },

  material_details: {
    keywords: [
      'matériau',
      'détail',
      'fiche',
      'information',
      'caractéristique',
      'spécification',
      'technique',
    ],
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
      return await prismaService.materials.findFirst({
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
    response_format: 'object',
    description: 'Informations détaillées sur un matériau spécifique',
    parameters: [
      {
        name: 'MATERIAL',
        description: 'Nom ou référence du matériau',
      },
    ],
  },

  low_stock_materials: {
    keywords: [
      'stock',
      'faible',
      'critique',
      'réapprovisionner',
      'rupture',
      'alerte',
      'commander',
    ],
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
      return await prismaService.materials.findMany({
        where: {
          stock_quantity: {
            lte: prismaService.materials.fields.minimum_stock,
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
    response_format: 'table',
    description:
      'Liste des matériaux dont le stock est inférieur ou égal au seuil minimum',
  },

  materials_by_supplier: {
    keywords: [
      'fournisseur',
      'matériau',
      'produit',
      'catalogue',
      'approvisionnement',
      'vendeur',
      'fourniture',
    ],
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
      return await prismaService.materials.findMany({
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
    response_format: 'table',
    description: 'Liste des matériaux filtrés par fournisseur',
    parameters: [
      {
        name: 'SUPPLIER',
        description: 'Nom du fournisseur',
      },
    ],
  },

  most_used_materials: {
    keywords: [
      'matériau',
      'utilisation',
      'consommation',
      'populaire',
      'statistique',
      'classement',
      'top',
    ],
    questions: [
      'Matériaux les plus utilisés',
      'Top des matériaux',
      'Matériaux populaires',
      'Quels sont les matériaux les plus consommés ?',
      "Statistiques d'utilisation des matériaux",
      'Matériaux principaux',
      'Consommation de matériaux',
      'Top consommation',
      'Matériaux fréquemment utilisés',
      'Classement des matériaux',
    ],
    prisma: async () => {
      // Récupérer tous les matériaux avec leurs utilisations dans les projets
      const materialsWithUsage = await prismaService.materials.findMany({
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
      const materialsUsage = materialsWithUsage.map((material) => {
        const totalUsed = material.project_materials.reduce(
          (acc, pm) => acc + (pm.quantity_used || 0),
          0,
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
    response_format: 'table',
    description: 'Top 20 des matériaux les plus utilisés dans les projets',
  },

  project_material_consumption: {
    keywords: [
      'projet',
      'matériau',
      'consommation',
      'utilisation',
      'ressource',
      'allocation',
      'répartition',
    ],
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
      return await prismaService.project_materials.findMany({
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
    response_format: 'table',
    description:
      'Analyse de la consommation de matériaux pour un projet spécifique',
    parameters: [
      {
        name: 'PROJECT',
        description: 'Nom ou référence du projet',
      },
    ],
  },

  materials_out_of_stock: {
    keywords: ['rupture', 'épuisé', 'stock nul', 'indisponible'],
    questions: [
      "Quels matériaux sont en rupture de stock ?",
      "Matériaux plus disponibles",
      "Liste des matériaux épuisés",
      "Produits avec stock à zéro",
      "Stock vide pour quels matériaux ?",
    ],
    prisma: async () => {
      return await prismaService.materials.findMany({
        where: { stock_quantity: 0 },
        select: {
          name: true,
          reference: true,
          stock_quantity: true,
          unit: true,
          supplier: true,
        },
      });
    },
    response_format: 'table',
    description: 'Matériaux actuellement en rupture de stock',
  },

  materials_with_no_usage: {
    keywords: ['jamais utilisé', 'inutile', 'stock dormant'],
    questions: [
      "Quels matériaux n'ont jamais été utilisés ?",
      "Matériaux inutilisés",
      "Stock dormant",
      "Aucune utilisation connue des matériaux",
    ],
    prisma: async () => {
      return await prismaService.materials.findMany({
        where: {
          project_materials: { none: {} },
        },
        select: {
          name: true,
          reference: true,
          stock_quantity: true,
          unit: true,
        },
      });
    },
    response_format: 'table',
    description: 'Liste des matériaux jamais utilisés dans aucun projet',
  },

  materials_above_minimum_stock: {
    keywords: ['surplus', 'réserve', 'en trop'],
    questions: [
      "Quels matériaux ont un stock supérieur au minimum ?",
      "Surplus de matériaux",
      "Matériaux bien approvisionnés",
    ],
    prisma: async () => {
      return await prismaService.materials.findMany({
        where: {
          stock_quantity: {
            gt: prismaService.materials.fields.minimum_stock,
          },
        },
        select: {
          name: true,
          reference: true,
          stock_quantity: true,
          minimum_stock: true,
        },
      });
    },
    response_format: 'table',
    description: 'Matériaux dont le stock dépasse le minimum requis',
  },

  materials_recently_used: {
    keywords: ['utilisation récente', 'récemment utilisé', 'projet récent'],
    questions: [
      "Quels matériaux ont été utilisés récemment ?",
      "Matériaux présents sur les projets récents",
      "Derniers matériaux consommés",
    ],
    prisma: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      return await prismaService.project_materials.findMany({
        where: {
          updated_at: { gte: threeMonthsAgo },
        },
        select: {
          materials: {
            select: {
              name: true,
              reference: true,
              unit: true,
            },
          },
          quantity_used: true,
          updated_at: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });
    },
    response_format: 'table',
    description: 'Matériaux utilisés au cours des 3 derniers mois',
  },

  materials_with_price_increase: {
    keywords: ['hausse prix', 'augmentation coût', 'tarif évolutif'],
    questions: [
      "Quels matériaux ont vu leur prix augmenter ?",
      "Hausse de prix sur les matériaux",
      "Évolution des coûts des matériaux",
    ],
    prisma: async () => {
      // Hypothèse : on compare prix actuel avec un champ d'historique (à implémenter dans ta base ou à récupérer ailleurs)
      return [];
    },
    response_format: 'table',
    description: 'Matériaux dont les prix ont augmenté (placeholder à compléter si historique dispo)',
  },
  materials_frequently_out_of_stock: {
    keywords: ['rupture', 'fréquent', 'épuisement', 'disponibilité'],
    questions: [
      'Matériaux souvent en rupture de stock',
      'Quels produits tombent souvent à zéro ?',
      'Matériaux fréquemment indisponibles',
      'Liste des matériaux épuisés régulièrement',
    ],
    prisma: async () => {
      const materials = await prismaService.materials.findMany({
        include: { project_materials: true },
      });
      return materials
        .map((m) => {
          const totalUsed = m.project_materials.reduce((sum, pm) => sum + (pm.quantity_used || 0), 0);
          return m.stock_quantity === 0 && totalUsed > 0 ? {
            name: m.name,
            reference: m.reference,
            stock_quantity: m.stock_quantity,
          } : null;
        })
        .filter(Boolean);
    },
    response_format: 'table',
    description: 'Matériaux ayant connu plusieurs ruptures de stock avec une forte consommation.',
  },

  unused_materials: {
    keywords: ['jamais utilisé', 'inutilisé', 'aucun projet', 'stock mort'],
    questions: [
      'Matériaux jamais utilisés',
      'Produits sans affectation',
      'Matériaux inutilisés dans les projets',
      'Articles en stock mais jamais consommés',
    ],
    prisma: async () => {
      return await prismaService.materials.findMany({
        where: {
          project_materials: { none: {} },
        },
        select: {
          name: true,
          reference: true,
          stock_quantity: true,
        },
      });
    },
    response_format: 'table',
    description: 'Matériaux stockés n\'ayant jamais été utilisés dans aucun projet.',
  },

  materials_with_high_cost_impact: {
    keywords: ['coût', 'cher', 'impact', 'budget', 'valeur élevée'],
    questions: [
      'Matériaux les plus coûteux globalement',
      'Quels matériaux ont le plus d\'impact budgétaire ?',
      'Valeur des matériaux par consommation',
      'Matériaux à fort coût cumulé',
    ],
    prisma: async () => {
      const all = await prismaService.materials.findMany({
        include: { project_materials: true },
      });
      return all.map((m) => {
        const used = m.project_materials.reduce((sum, pm) => sum + (pm.quantity_used || 0), 0);
        const value = Number(m.price || 0) * used;
        return value > 0 ? {
          name: m.name,
          reference: m.reference,
          total_used: used,
          total_value: value,
        } : null;
      }).filter(Boolean).sort((a, b) => (b?.total_value || 0) - (a?.total_value || 0));
    },
    response_format: 'table',
    description: 'Classement des matériaux selon leur coût cumulé dans les projets.',
  },

  materials_delivered_but_not_used: {
    keywords: ['livré', 'pas utilisé', 'stocké', 'perte'],
    questions: [
      'Matériaux livrés mais inutilisés',
      'Produits livrés sans consommation',
      'Matériaux en surplus',
      'Articles non utilisés après livraison',
    ],
    prisma: async () => {
      const list = await prismaService.project_materials.findMany({
        where: {
          quantity_used: 0,
        },
        include: {
          materials: true,
          projects: true,
        },
      });
      return list.map((entry) => ({
        project: entry.projects?.name,
        material: entry.materials?.name,
        delivered: entry.quantity_planned,
        used: entry.quantity_used,
      }));
    },
    response_format: 'table',
    description: 'Matériaux livrés à un projet mais qui n\'ont pas été utilisés.',
  },

  materials_usage_per_unit_price: {
    keywords: ['coût unitaire', 'efficacité', 'rentabilité'],
    questions: [
      'Quels matériaux ont la meilleure efficacité/coût ?',
      'Matériaux les plus utilisés par euro dépensé',
      'Rapport utilisation/prix des matériaux',
      'Rentabilité des matériaux utilisés',
    ],
    prisma: async () => {
      const list = await prismaService.materials.findMany({
        include: { project_materials: true },
      });
      return list.map((mat) => {
        const totalUsed = mat.project_materials.reduce((acc, pm) => acc + (pm.quantity_used || 0), 0);
        const ratio = totalUsed / (Number(mat.price || 1));
        return {
          name: mat.name,
          reference: mat.reference,
          unit_price: mat.price,
          usage_to_price_ratio: ratio,
        };
      }).sort((a, b) => b.usage_to_price_ratio - a.usage_to_price_ratio);
    },
    response_format: 'table',
    description: 'Analyse de rentabilité des matériaux selon leur usage vs prix unitaire.',
  },

  materials_used_on_multiple_projects: {
    keywords: ['projets multiples', 'utilisé plusieurs fois', 'récurrent'],
    questions: [
      'Matériaux utilisés sur plusieurs projets',
      'Produits récurrents',
      'Articles utilisés fréquemment dans les chantiers',
      'Matériaux communs à plusieurs chantiers',
    ],
    prisma: async () => {
      const list = await prismaService.materials.findMany({
        include: {
          project_materials: {
            select: { project_id: true },
          },
        },
      });
      return list.map((m) => {
        const projectSet = new Set(m.project_materials.map((pm) => pm.project_id));
        return projectSet.size > 1 ? {
          name: m.name,
          reference: m.reference,
          used_in_projects: projectSet.size,
        } : null;
      }).filter(Boolean).sort((a, b) => (b?.used_in_projects || 0) - (a?.used_in_projects || 0));
    },
    response_format: 'table',
    description: 'Matériaux utilisés dans plusieurs projets distincts.',
  },

  materials_with_high_price_per_unit: {
    keywords: ['cher', 'prix élevé', 'coût unitaire élevé'],
    questions: [
      'Matériaux les plus chers à l\'unité',
      'Classement par coût unitaire',
      'Articles au prix unitaire le plus élevé',
    ],
    prisma: async () => {
      return await prismaService.materials.findMany({
        orderBy: {
          price: 'desc',
        },
        take: 10,
        select: {
          name: true,
          reference: true,
          unit: true,
          price: true,
        },
      });
    },
    response_format: 'table',
    description: 'Top 10 des matériaux au prix unitaire le plus élevé.',
  },

  materials_with_unusual_units: {
    keywords: ['unité inhabituelle', 'mesure rare', 'atypique'],
    questions: [
      'Matériaux avec des unités rares ou spéciales',
      'Produits avec mesures atypiques',
      'Liste des unités de mesure rares',
    ],
    prisma: async () => {
      const usualUnits = ['kg', 'm²', 'm3', 'l', 'pièce'];
      return await prismaService.materials.findMany({
        where: {
          NOT: {
            unit: { in: usualUnits },
          },
        },
        select: {
          name: true,
          reference: true,
          unit: true,
        },
      });
    },
    response_format: 'table',
    description: 'Matériaux utilisant des unités de mesure rares ou spécifiques.',
  },

  materials_used_in_recent_projects: {
    keywords: ['récents', 'utilisés récemment', 'nouveaux projets'],
    questions: [
      'Matériaux utilisés dans les derniers projets',
      'Articles récemment utilisés',
      'Produits utilisés dans les nouveaux chantiers',
    ],
    prisma: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return await prismaService.project_materials.findMany({
        where: {
          projects: {
            start_date: { gte: threeMonthsAgo },
          },
        },
        include: {
          materials: true,
          projects: true,
        },
      });
    },
    response_format: 'table',
    description: 'Matériaux utilisés dans les projets démarrés récemment.',
  },

});
