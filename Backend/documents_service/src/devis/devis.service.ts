import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDevisDto,
  CreateDevisLineDto,
  DevisWithLines,
  DevisLine,
} from '../interfaces/devis.interface';
import { Prisma, PrismaClient } from '@prisma/client';

// Type pour les lignes récupérées par SQL brut
interface RawDevisLine {
  id: number;
  document_id: number;
  material_id?: number;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// Type pour la clause where de la recherche
interface DevisWhereInput extends Prisma.documentsWhereInput {
  client_id?: number;
  project_id?: number;
  OR?: Prisma.documentsWhereInput[];
}

// Étendre le type de document_lines pour inclure les méthodes manquantes
interface ExtendedDocumentLines {
  createMany: (params: {
    data: any[];
    skipDuplicates?: boolean;
  }) => Promise<Prisma.BatchPayload>;

  findMany: (params: {
    where?: any;
    orderBy?: any;
    include?: any;
  }) => Promise<any[]>;
}

// Étendre le type de transaction Prisma
interface ExtendedPrismaClient extends Omit<PrismaClient, 'document_lines'> {
  document_lines: ExtendedDocumentLines;
}

@Injectable()
export class DevisService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crée un nouveau devis avec ses lignes
   */
  async createDevis(devisDto: CreateDevisDto): Promise<DevisWithLines> {
    // Commencer une transaction pour s'assurer que tout se passe bien
    const result = await this.prisma.$transaction(async (tx) => {
      // Traiter tx comme un ExtendedPrismaClient
      const txExtended = tx as unknown as ExtendedPrismaClient;

      // Générer une référence automatique si non fournie ou vide
      let reference = devisDto.reference;
      if (!reference || reference.trim() === '') {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const randomStr = Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase();
        reference = `DEV-${dateStr}-${randomStr}`;
      }

      // Créer d'abord le document de devis
      const devis = await txExtended.documents.create({
        data: {
          project_id: devisDto.project_id,
          client_id: devisDto.client_id,
          type: 'devis',
          reference: reference,
          status: devisDto.status || 'brouillon',
          amount: devisDto.amount || 0,
          tva_rate: devisDto.tva_rate || 20.0,
          issue_date: devisDto.issue_date || new Date(),
          due_date: devisDto.due_date,
          notes: devisDto.notes,
          file_path: devisDto.file_path,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Ensuite créer les lignes du devis si elles existent
      let devisLines: DevisLine[] = [];
      if (devisDto.lines && devisDto.lines.length > 0) {
        // Préparation des données pour l'insertion batch
        const devisLinesData = devisDto.lines.map(
          (line: CreateDevisLineDto, index: number) => ({
            document_id: devis.id,
            material_id: line.material_id,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unit_price: line.unit_price,
            discount_percent: line.discount_percent || 0,
            discount_amount: line.discount_amount || 0,
            tax_rate: line.tax_rate || devisDto.tva_rate || 20.0,
            sort_order: index + 1, // Ordre basé sur l'index dans le tableau
            created_at: new Date(),
            updated_at: new Date(),
          }),
        );

        // Insertion de toutes les lignes en une seule opération
        await txExtended.document_lines.createMany({
          data: devisLinesData,
          skipDuplicates: false,
        });

        // Récupérer les lignes créées pour les renvoyer avec l'objet complet
        const createdLines = await txExtended.document_lines.findMany({
          where: { document_id: devis.id },
          orderBy: { sort_order: 'asc' },
        });

        devisLines = createdLines as unknown as DevisLine[];

        // Calculer le montant total et mettre à jour le document
        const totalAmount = devisLines.reduce((sum, line) => {
          return sum + Number(line.total_ht || 0);
        }, 0);

        await txExtended.documents.update({
          where: { id: devis.id },
          data: { amount: totalAmount },
        });

        // Récupérer le document mis à jour
        const updatedDevis = await txExtended.documents.findUnique({
          where: { id: devis.id },
        });

        return {
          ...updatedDevis,
          lines: devisLines,
        } as unknown as DevisWithLines;
      }

      return {
        ...devis,
        lines: [],
      } as unknown as DevisWithLines;
    });

    return result;
  }

  /**
   * Récupère un devis avec ses lignes par ID
   */
  async getDevisById(id: number): Promise<DevisWithLines | null> {
    const devis = await this.prisma.documents.findUnique({
      where: {
        id: Number(id),
        type: 'devis',
      },
      include: {
        clients: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            company_name: true,
            email: true,
            phone: true,
            mobile: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            reference: true,
          },
        },
      },
    });

    if (!devis) {
      return null;
    }

    // Récupérer les lignes du devis
    const lines = await this.prisma.$queryRaw<RawDevisLine[]>`
      SELECT * FROM document_lines 
      WHERE document_id = ${devis.id} 
      ORDER BY sort_order ASC
    `;

    return {
      ...devis,
      lines,
    } as unknown as DevisWithLines;
  }

  /**
   * Récupère tous les devis avec leurs lignes
   */
  async getAllDevis(
    limit?: number,
    offset?: number,
    searchQuery?: string,
    clientId?: number,
    projectId?: number,
  ): Promise<DevisWithLines[]> {
    // Construction de la requête where compatible avec Prisma
    const where: DevisWhereInput = {
      type: 'devis',
    };

    if (clientId) where.client_id = clientId;
    if (projectId) where.project_id = projectId;

    // Si searchQuery est défini, ajouter les conditions de recherche
    if (searchQuery && searchQuery.length > 1) {
      const searchLower = searchQuery.toLowerCase();

      where.OR = [
        { reference: { contains: searchQuery, mode: 'insensitive' } },
        { notes: { contains: searchQuery, mode: 'insensitive' } },
      ];

      // Recherche dans status (enum)
      if (searchLower.includes('brouillon')) {
        where.OR.push({ status: 'brouillon' });
      }
      if (
        searchLower.includes('attente') ||
        searchLower.includes('en_attente')
      ) {
        where.OR.push({ status: 'en_attente' });
      }
      if (searchLower.includes('valid') || searchLower.includes('valide')) {
        where.OR.push({ status: 'valide' });
      }
      if (searchLower.includes('refus') || searchLower.includes('refuse')) {
        where.OR.push({ status: 'refuse' });
      }
      if (searchLower.includes('ann') || searchLower.includes('annule')) {
        where.OR.push({ status: 'annule' });
      }
    }

    const devis = await this.prisma.documents.findMany({
      where,
      skip: offset ?? 0,
      take: limit ?? 100,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        clients: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            company_name: true,
            email: true,
            phone: true,
            mobile: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            reference: true,
          },
        },
      },
    });

    // Pour chaque devis, récupérer ses lignes
    const devisWithLines = await Promise.all(
      devis.map(async (d) => {
        const lines = await this.prisma.$queryRaw<RawDevisLine[]>`
          SELECT * FROM document_lines 
          WHERE document_id = ${d.id} 
          ORDER BY sort_order ASC
        `;

        return {
          ...d,
          lines,
        } as unknown as DevisWithLines;
      }),
    );

    return devisWithLines;
  }

  /**
   * Met à jour un devis et ses lignes
   */
  async updateDevis(
    id: number,
    devisDto: CreateDevisDto,
  ): Promise<DevisWithLines | null> {
    try {
      // Commencer une transaction pour s'assurer que tout se passe bien
      const result = await this.prisma.$transaction(async (tx) => {
        // Traiter tx comme un ExtendedPrismaClient
        const txExtended = tx as unknown as ExtendedPrismaClient;

        // Vérifier si le devis existe et est bien un devis
        const existingDevis = await txExtended.documents.findFirst({
          where: {
            id: Number(id),
            type: 'devis',
          },
        });

        if (!existingDevis) {
          return null;
        }

        // Utiliser la référence existante si non fournie
        const reference =
          !devisDto.reference || devisDto.reference.trim() === ''
            ? existingDevis.reference
            : devisDto.reference;

        // Mettre à jour le document de devis
        const devis = await txExtended.documents.update({
          where: { id: Number(id) },
          data: {
            project_id: devisDto.project_id,
            client_id: devisDto.client_id,
            reference: reference,
            status: devisDto.status,
            amount: devisDto.amount,
            tva_rate: devisDto.tva_rate,
            issue_date: devisDto.issue_date,
            due_date: devisDto.due_date,
            notes: devisDto.notes,
            file_path: devisDto.file_path,
            updated_at: new Date(),
          },
        });

        // Supprimer toutes les lignes existantes
        await txExtended.$executeRaw`DELETE FROM document_lines WHERE document_id = ${devis.id}`;

        // Créer les nouvelles lignes
        let devisLines: DevisLine[] = [];
        if (devisDto.lines && devisDto.lines.length > 0) {
          // Préparation des données pour l'insertion batch
          const devisLinesData = devisDto.lines.map(
            (line: CreateDevisLineDto, index: number) => ({
              document_id: devis.id,
              material_id: line.material_id,
              description: line.description,
              quantity: line.quantity,
              unit: line.unit,
              unit_price: line.unit_price,
              discount_percent: line.discount_percent || 0,
              discount_amount: line.discount_amount || 0,
              tax_rate: line.tax_rate || devisDto.tva_rate || 20.0,
              sort_order: index + 1, // Ordre basé sur l'index dans le tableau
              created_at: new Date(),
              updated_at: new Date(),
            }),
          );

          // Insertion de toutes les lignes en une seule opération
          await txExtended.document_lines.createMany({
            data: devisLinesData,
            skipDuplicates: false,
          });

          // Récupérer les lignes créées pour les renvoyer avec l'objet complet
          const createdLines = await txExtended.document_lines.findMany({
            where: { document_id: devis.id },
            orderBy: { sort_order: 'asc' },
            include: {
              materials: true,
            },
          });

          devisLines = createdLines as unknown as DevisLine[];

          // Calculer le montant total et mettre à jour le document
          const totalAmount = devisLines.reduce((sum, line) => {
            return sum + Number(line.total_ht || 0);
          }, 0);

          await txExtended.documents.update({
            where: { id: devis.id },
            data: { amount: totalAmount },
          });

          // Récupérer le document mis à jour
          const updatedDevis = await txExtended.documents.findUnique({
            where: { id: devis.id },
            include: {
              clients: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  company_name: true,
                  email: true,
                  phone: true,
                  mobile: true,
                },
              },
              projects: {
                select: {
                  id: true,
                  name: true,
                  reference: true,
                },
              },
            },
          });

          return {
            ...updatedDevis,
            lines: devisLines,
          } as unknown as DevisWithLines;
        }

        return {
          ...devis,
          lines: [],
        } as unknown as DevisWithLines;
      });

      return result;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du devis:', error);
      return null;
    }
  }

  /**
   * Supprime un devis et ses lignes
   */
  async deleteDevis(id: number): Promise<boolean> {
    try {
      // Vérifier si le devis existe et est bien un devis
      const existingDevis = await this.prisma.documents.findFirst({
        where: {
          id: Number(id),
          type: 'devis',
        },
      });

      if (!existingDevis) {
        return false;
      }

      // Supprimer d'abord les lignes du devis (grâce à la contrainte CASCADE, ce n'est pas obligatoire)
      await this.prisma
        .$executeRaw`DELETE FROM document_lines WHERE document_id = ${Number(id)}`;

      // Puis supprimer le devis lui-même
      await this.prisma.documents.delete({
        where: { id: Number(id) },
      });

      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du devis:', error);
      return false;
    }
  }

  /**
   * Convertit un devis en facture
   */
  async convertDevisToFacture(id: number): Promise<DevisWithLines | null> {
    try {
      // Commencer une transaction pour s'assurer que tout se passe bien
      const result = await this.prisma.$transaction(async (tx) => {
        // Traiter tx comme un ExtendedPrismaClient
        const txExtended = tx as unknown as ExtendedPrismaClient;

        // Récupérer le devis avec ses lignes
        const devis = await txExtended.documents.findFirst({
          where: {
            id: Number(id),
            type: 'devis',
          },
        });

        if (!devis) {
          return null;
        }

        // Générer une nouvelle référence pour la facture
        const devisRef = devis.reference;
        const factureRef = devisRef.replace('DEV-', 'FAC-');

        // Créer la facture à partir du devis
        const facture = await txExtended.documents.create({
          data: {
            project_id: devis.project_id,
            client_id: devis.client_id,
            type: 'facture',
            reference: factureRef,
            status: 'brouillon',
            amount: devis.amount,
            tva_rate: devis.tva_rate,
            issue_date: new Date(),
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            notes: `Facture basée sur le devis ${devisRef}`,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Récupérer les lignes du devis
        const devisLines = await txExtended.$queryRaw<RawDevisLine[]>`
          SELECT * FROM document_lines 
          WHERE document_id = ${devis.id} 
          ORDER BY sort_order ASC
        `;

        // Copier les lignes du devis vers la facture
        if (devisLines && devisLines.length > 0) {
          const factureLinesData = devisLines.map((line) => ({
            document_id: facture.id,
            material_id: line.material_id,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unit_price: line.unit_price,
            discount_percent: line.discount_percent,
            discount_amount: line.discount_amount,
            tax_rate: line.tax_rate,
            sort_order: line.sort_order,
            created_at: new Date(),
            updated_at: new Date(),
          }));

          await txExtended.document_lines.createMany({
            data: factureLinesData,
            skipDuplicates: false,
          });
        }

        // Mettre à jour le statut du devis
        await txExtended.documents.update({
          where: { id: devis.id },
          data: { status: 'valide' },
        });

        // Récupérer la facture créée avec ses lignes
        const createdFacture = await txExtended.documents.findUnique({
          where: { id: facture.id },
          include: {
            clients: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                company_name: true,
                email: true,
                phone: true,
                mobile: true,
              },
            },
            projects: {
              select: {
                id: true,
                name: true,
                reference: true,
              },
            },
          },
        });

        const factureLines = await txExtended.$queryRaw<RawDevisLine[]>`
          SELECT * FROM document_lines 
          WHERE document_id = ${facture.id} 
          ORDER BY sort_order ASC
        `;

        return {
          ...createdFacture,
          lines: factureLines,
        } as unknown as DevisWithLines;
      });

      return result;
    } catch (error) {
      console.error('Erreur lors de la conversion du devis en facture:', error);
      return null;
    }
  }
}
