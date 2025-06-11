import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import {
  Document,
  CreateDocumentDto,
  UpdateDocumentDto,
  ProjectMedia,
  CreateProjectMediaDto,
  UpdateProjectMediaDto,
  DocumentType,
  DocumentStatus,
  DocumentDetails,
} from './interfaces/document.interface';
import { Prisma } from '@prisma/client';

// Type pour les résultats de Prisma
type PrismaDocumentWithRelations = Prisma.documentsGetPayload<{
  include: {
    clients: {
      select: {
        id: true;
        firstname: true;
        lastname: true;
        company_name: true;
      };
    };
    projects: {
      select: {
        id: true;
        name: true;
      };
    };
  };
}>;

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async getAllDocuments(
    limit?: number,
    offset?: number,
    searchQuery?: string,
    clientId?: number,
    projectId?: number,
  ): Promise<Document[]> {
    // Construction de la requête where compatible avec Prisma
    const where: Record<string, unknown> = {
      ...(clientId ? { client_id: clientId } : {}),
      ...(projectId ? { project_id: projectId } : {}),
    };

    // Si searchQuery est défini, ajouter les conditions de recherche
    if (searchQuery && searchQuery.length > 1) {
      const searchLower = searchQuery.toLowerCase();
      console.log(`Recherche avec searchLower: ${searchLower}`);

      const orConditions: Prisma.Enumerable<Prisma.documentsWhereInput> = [
        { reference: { contains: searchQuery, mode: 'insensitive' } },
        { notes: { contains: searchQuery, mode: 'insensitive' } },
        { payment_method: { contains: searchQuery, mode: 'insensitive' } },
      ];

      // Recherche spécifique pour les statuts (qui sont des enum)
      if (searchLower.includes('ann') || searchLower.includes('annu')) {
        orConditions.push({ status: DocumentStatus.ANNULE });
      }
      if (searchLower.includes('brouillon')) {
        orConditions.push({ status: DocumentStatus.BROUILLON });
      }
      if (
        searchLower.includes('attente') ||
        searchLower.includes('en_attente')
      ) {
        orConditions.push({ status: DocumentStatus.EN_ATTENTE });
      }
      if (searchLower.includes('valid') || searchLower.includes('valide')) {
        orConditions.push({ status: DocumentStatus.VALIDE });
      }
      if (searchLower.includes('refus') || searchLower.includes('refuse')) {
        orConditions.push({ status: DocumentStatus.REFUSE });
      }

      // Recherche pour les types de documents (qui sont des enum)
      if (searchLower.includes('devis')) {
        orConditions.push({ type: DocumentType.DEVIS });
      }
      if (searchLower.includes('facture')) {
        orConditions.push({ type: DocumentType.FACTURE });
      }
      if (
        searchLower.includes('commande') ||
        searchLower.includes('bon_de_commande')
      ) {
        orConditions.push({ type: DocumentType.BON_DE_COMMANDE });
      }
      if (
        searchLower.includes('livraison') ||
        searchLower.includes('bon_de_livraison')
      ) {
        orConditions.push({ type: DocumentType.BON_DE_LIVRAISON });
      }
      if (
        searchLower.includes('technique') ||
        searchLower.includes('fiche_technique')
      ) {
        orConditions.push({ type: DocumentType.FICHE_TECHNIQUE });
      }
      if (
        searchLower.includes('photo') ||
        searchLower.includes('chantier') ||
        searchLower.includes('photo_chantier')
      ) {
        orConditions.push({ type: DocumentType.PHOTO_CHANTIER });
      }
      if (searchLower.includes('plan')) {
        orConditions.push({ type: DocumentType.PLAN });
      }
      if (searchLower.includes('autre')) {
        orConditions.push({ type: DocumentType.AUTRE });
      }

      where.OR = orConditions;
    }

    const documents = await this.prisma.documents.findMany({
      where: where as Prisma.documentsWhereInput,
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
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Recherche supplémentaire sur les données liées aux clients
    if (searchQuery && searchQuery.length > 1) {
      const searchLower = searchQuery.toLowerCase();

      const filteredDocuments = documents.filter(
        (doc: PrismaDocumentWithRelations) => {
          // Vérification spécifique pour le statut "annulé"
          if (
            doc.status === DocumentStatus.ANNULE &&
            (searchLower.includes('ann') || searchLower.includes('annu'))
          ) {
            return true;
          }

          // Vérification de base dans les champs de texte
          const defaultCheck =
            (doc.reference &&
              doc.reference.toLowerCase().includes(searchLower)) ||
            (doc.notes && doc.notes.toLowerCase().includes(searchLower)) ||
            (doc.payment_method &&
              doc.payment_method.toLowerCase().includes(searchLower));

          if (defaultCheck) return true;

          // Recherche dans les informations du client
          if (doc.clients) {
            const client = doc.clients;
            const searchInClient =
              (client.firstname &&
                client.firstname.toLowerCase().includes(searchLower)) ||
              (client.lastname &&
                client.lastname.toLowerCase().includes(searchLower)) ||
              (client.company_name &&
                client.company_name.toLowerCase().includes(searchLower));

            if (searchInClient) return true;
          }

          // Recherche dans les informations du projet
          if (doc.projects) {
            const project = doc.projects;
            if (
              project.name &&
              project.name.toLowerCase().includes(searchLower)
            ) {
              return true;
            }
          }

          // Recherche dans les montants (conversion du montant en chaîne)
          if (doc.amount !== null) {
            const amountStr = doc.amount.toString();
            if (amountStr.includes(searchQuery)) {
              return true;
            }
          }

          return false;
        },
      );

      return filteredDocuments as Document[];
    }

    return documents as Document[];
  }

  async getDocumentById(id: number): Promise<Document | null> {
    const document = await this.prisma.documents.findUnique({
      where: { id: Number(id) },
    });
    return document as Document | null;
  }

  async createDocument(documentDto: CreateDocumentDto): Promise<Document> {
    const document = await this.prisma.documents.create({
      data: {
        ...documentDto,
        created_at: new Date(),
      },
    });
    return document as Document;
  }

  async updateDocument(
    id: number,
    documentDto: UpdateDocumentDto,
  ): Promise<Document | null> {
    try {
      const document = await this.prisma.documents.update({
        where: { id: Number(id) },
        data: {
          ...documentDto,
          created_at: new Date(),
        },
      });
      return document as Document;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      await this.prisma.documents.delete({
        where: { id: Number(id) },
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getDocumentsByClientId(clientId: number): Promise<Document[]> {
    const documents = await this.prisma.documents.findMany({
      where: {
        client_id: Number(clientId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return documents as Document[];
  }

  async getDocumentsByProjectId(projectId: number): Promise<Document[]> {
    const documents = await this.prisma.documents.findMany({
      where: {
        project_id: Number(projectId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    return documents as Document[];
  }

  async getAllProjectMedia(
    limit?: number,
    offset?: number,
    projectId?: number,
  ): Promise<ProjectMedia[]> {
    const media = await this.prisma.project_media.findMany({
      where: {
        ...(projectId ? { project_id: projectId } : {}),
      },
      skip: offset ?? 0,
      take: limit ?? 100,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        projects: true,
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia[];
  }

  async getProjectMediaById(id: number): Promise<ProjectMedia | null> {
    const media = await this.prisma.project_media.findUnique({
      where: { id: Number(id) },
      include: {
        projects: true,
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia | null;
  }

  async getMediaByProjectId(projectId: number): Promise<ProjectMedia[]> {
    const media = await this.prisma.project_media.findMany({
      where: {
        project_id: Number(projectId),
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia[];
  }

  async createProjectMedia(
    mediaDto: CreateProjectMediaDto,
  ): Promise<ProjectMedia> {
    const media = await this.prisma.project_media.create({
      data: {
        project_id: mediaDto.project_id,
        stage_id: mediaDto.stage_id,
        staff_id: mediaDto.staff_id,
        media_type: mediaDto.media_type,
        file_path: mediaDto.file_path,
        description: mediaDto.description,
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        projects: true,
        staff: true,
        project_stages: true,
      },
    });
    return media as ProjectMedia;
  }

  async updateProjectMedia(
    id: number,
    mediaDto: UpdateProjectMediaDto,
  ): Promise<ProjectMedia | null> {
    try {
      const media = await this.prisma.project_media.update({
        where: { id: Number(id) },
        data: {
          project_id: mediaDto.project_id,
          stage_id: mediaDto.stage_id,
          staff_id: mediaDto.staff_id,
          media_type: mediaDto.media_type,
          file_path: mediaDto.file_path,
          description: mediaDto.description,
          updated_at: new Date(),
        },
        include: {
          projects: true,
          staff: true,
          project_stages: true,
        },
      });
      return media as ProjectMedia;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deleteProjectMedia(id: number): Promise<boolean> {
    try {
      await this.prisma.project_media.delete({
        where: { id: Number(id) },
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getDocumentDetails(id: number): Promise<DocumentDetails | null> {
    try {
      const document = await this.prisma.documents.findUnique({
        where: { id },
        include: {
          document_lines: {
            include: {
              materials: true,
            },
            orderBy: {
              sort_order: 'asc',
            },
          },
          clients: true,
          projects: true,
        },
      });

      if (!document) {
        return null;
      }

      // Calculer les totaux
      let subtotal_ht = 0;
      let total_discount = 0;
      let total_tax = 0;

      document.document_lines.forEach((line) => {
        const lineTotal = line.total_ht ? Number(line.total_ht) : 0;
        subtotal_ht += lineTotal;
        
        const lineDiscountAmount = line.discount_amount ? Number(line.discount_amount) : 0;
        total_discount += lineDiscountAmount;
        
        const lineTax = (lineTotal * Number(line.tax_rate)) / 100;
        total_tax += lineTax;
      });

      // Ajouter les frais de livraison au sous-total
      const shipping_costs = document.shipping_costs ? Number(document.shipping_costs) : 0;
      subtotal_ht += shipping_costs;

      // Appliquer la remise globale du document
      const document_discount = document.discount_amount ? Number(document.discount_amount) : 0;
      total_discount += document_discount;

      const total_ttc = subtotal_ht - document_discount + total_tax;

      // Transformer les données
      const documentDetails: DocumentDetails = {
        id: document.id,
        document_id: document.document_id,
        project_id: document.project_id,
        client_id: document.client_id,
        type: document.type as DocumentType,
        reference: document.reference,
        status: document.status as DocumentStatus | null,
        amount: document.amount ? Number(document.amount) : null,
        tva_rate: document.tva_rate ? Number(document.tva_rate) : 20,
        issue_date: document.issue_date,
        due_date: document.due_date,
        payment_date: document.payment_date,
        payment_method: document.payment_method,
        payment_terms: document.payment_terms,
        discount_rate: document.discount_rate ? Number(document.discount_rate) : 0,
        discount_amount: document.discount_amount ? Number(document.discount_amount) : 0,
        payment_status: document.payment_status || 'non_payé',
        amount_paid: document.amount_paid ? Number(document.amount_paid) : 0,
        balance_due: document.balance_due ? Number(document.balance_due) : null,
        legal_mentions: document.legal_mentions,
        validity_period: document.validity_period,
        signed_by_client: document.signed_by_client || false,
        signed_date: document.signed_date,
        shipping_costs: shipping_costs,
        notes: document.notes,
        file_path: document.file_path,
        created_at: document.created_at,
        updated_at: document.updated_at,
        // Relations
        lines: document.document_lines.map((line) => ({
          id: line.id,
          document_id: line.document_id,
          material_id: line.material_id,
          description: line.description,
          quantity: Number(line.quantity),
          unit: line.unit,
          unit_price: Number(line.unit_price),
          discount_percent: Number(line.discount_percent) || 0,
          discount_amount: Number(line.discount_amount) || 0,
          tax_rate: Number(line.tax_rate) || 20,
          total_ht: Number(line.total_ht) || 0,
          sort_order: line.sort_order || 0,
          created_at: line.created_at,
          updated_at: line.updated_at,
          material: line.materials ? {
            id: line.materials.id,
            name: line.materials.name,
            description: line.materials.description,
            reference: line.materials.reference,
            unit: line.materials.unit,
            price: line.materials.price ? Number(line.materials.price) : null,
            stock_quantity: line.materials.stock_quantity || 0,
            minimum_stock: line.materials.minimum_stock || 0,
            supplier: line.materials.supplier,
            supplier_reference: line.materials.supplier_reference,
          } : null,
        })),
        client: document.clients ? {
          id: document.clients.id,
          customer_id: document.clients.customer_id,
          company_name: document.clients.company_name,
          firstname: document.clients.firstname,
          lastname: document.clients.lastname,
          email: document.clients.email,
          phone: document.clients.phone,
          mobile: document.clients.mobile,
          siret: document.clients.siret,
          notes: document.clients.notes,
        } : null,
        project: document.projects ? {
          id: document.projects.id,
          project_id: document.projects.project_id,
          reference: document.projects.reference,
          name: document.projects.name,
          description: document.projects.description,
          client_id: document.projects.client_id,
          status: document.projects.status,
          start_date: document.projects.start_date,
          end_date: document.projects.end_date,
          estimated_duration: document.projects.estimated_duration,
          budget: document.projects.budget ? Number(document.projects.budget) : null,
          actual_cost: document.projects.actual_cost ? Number(document.projects.actual_cost) : null,
          margin: document.projects.margin ? Number(document.projects.margin) : null,
          priority: document.projects.priority,
          notes: document.projects.notes,
        } : null,
        // Totaux calculés
        subtotal_ht,
        total_discount,
        total_tax,
        total_ttc,
      };

      return documentDetails;
    } catch (error) {
      console.error(`Erreur lors de la récupération des détails du document ${id}:`, error);
      return null;
    }
  }
}
