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
        console.log('Ajout du statut ANNULE à la recherche');
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
      console.log('Conditions de recherche:', JSON.stringify(orConditions));
    }

    console.log('Requête finale:', JSON.stringify(where));

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

    console.log(`Nombre de documents trouvés: ${documents.length}`);

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

      console.log(
        `Nombre de documents après filtrage: ${filteredDocuments.length}`,
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
}
