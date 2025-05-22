import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VectorStoreService } from '../embedding/vector-store.service';

interface LoadOptions {
  forceReload?: boolean;  // Force le rechargement complet
  batchSize?: number;     // Taille des lots pour le traitement
}

@Injectable()
export class DataLoaderService implements OnModuleInit {
  private readonly logger = new Logger(DataLoaderService.name);
  private readonly DEFAULT_BATCH_SIZE = 50;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  async onModuleInit() {
    // Charge les données au démarrage du service
    this.logger.log('Initialisation du chargement des données...');

    // Commentez cette ligne en développement si vous ne voulez pas charger
    // les données à chaque redémarrage du service
    // await this.loadAllData();
  }

  async loadAllData(options: LoadOptions = {}) {
    this.logger.log('Chargement des données pour indexation...');

    // Entités principales
    await this.loadProjects(options);
    await this.loadClients(options);
    await this.loadStaff(options);

    // Entités secondaires
    await this.loadDocuments(options);
    await this.loadProjectStages(options);
    await this.loadMaterials(options);
    await this.loadEvents(options);
    await this.loadSiteReports(options);
    await this.loadTasks(options);

    this.logger.log('Chargement des données terminé.');
  }

  private async checkExistingEmbedding(sourceType: string, sourceId: number): Promise<boolean> {
    const existing = await this.prisma.vector_embeddings.findFirst({
      where: {
        source_type: sourceType,
        source_id: sourceId,
      },
    });
    return !!existing;
  }

  private async processBatch<T>(
    items: T[],
    sourceType: string,
    textGenerator: (item: T) => string,
    metadataGenerator: (item: T) => any,
    options: LoadOptions = {},
  ) {
    const batchSize = options.batchSize || this.DEFAULT_BATCH_SIZE;
    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      for (const item of batch) {
        try {
          const sourceId = (item as any).id;
          
          // Vérifier si l'embedding existe déjà
          if (!options.forceReload && await this.checkExistingEmbedding(sourceType, sourceId)) {
            skipped++;
            continue;
          }

          const text = textGenerator(item);
          const embedding = await this.vectorStore.generateEmbedding(text);
          await this.vectorStore.storeEmbedding(
            sourceType,
            sourceId,
            text,
            embedding,
            metadataGenerator(item),
          );
          processed++;
        } catch (error) {
          this.logger.error(
            `Erreur lors du traitement de ${sourceType} #${(item as any).id}: ${error.message}`,
          );
          errors++;
        }
      }

      this.logger.log(
        `Progression ${sourceType}: ${i + batch.length}/${items.length} (${processed} traités, ${skipped} ignorés, ${errors} erreurs)`,
      );
    }

    return { processed, skipped, errors };
  }

  async loadProjects(options: LoadOptions = {}) {
    try {
      const projects = await this.prisma.projects.findMany({
        include: {
          clients: true,
          project_stages: true,
        },
      });

      this.logger.log(`Chargement de ${projects.length} projets.`);

      const textGenerator = (project: any) => `
        Projet: ${project.name}
        Référence: ${project.reference}
        Description: ${project.description || 'Non spécifiée'}
        Client: ${project.clients ? project.clients.company_name || `${project.clients.firstname} ${project.clients.lastname}` : 'Non spécifié'}
        Statut: ${project.status || 'Non spécifié'}
        Date de début: ${project.start_date ? project.start_date.toISOString() : 'Non spécifiée'}
        Date de fin: ${project.end_date ? project.end_date.toISOString() : 'Non spécifiée'}
        Budget: ${project.budget || 'Non spécifié'}
        Notes: ${project.notes || 'Aucune'}
      `;

      const metadataGenerator = (project: any) => ({
        projectId: project.id,
        projectName: project.name,
        projectReference: project.reference,
      });

      const result = await this.processBatch(
        projects,
        'projects',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Projets indexés: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des projets: ${error.message}`,
      );
    }
  }

  async loadClients(options: LoadOptions = {}) {
    try {
      const clients = await this.prisma.clients.findMany({
        include: {
          addresses: true,
        },
      });

      this.logger.log(`Chargement de ${clients.length} clients.`);

      const textGenerator = (client: any) => `
        Client: ${client.company_name || `${client.firstname} ${client.lastname}`}
        Email: ${client.email || 'Non spécifié'}
        Téléphone: ${client.phone || 'Non spécifié'}
        Mobile: ${client.mobile || 'Non spécifié'}
        SIRET: ${client.siret || 'Non spécifié'}
        Adresse: ${
          client.addresses
            ? `${client.addresses.street_number || ''} ${client.addresses.street_name || ''}, ${client.addresses.city || ''}, ${client.addresses.zip_code || ''}`
            : 'Non spécifiée'
        }
        Notes: ${client.notes || 'Aucune'}
      `;

      const metadataGenerator = (client: any) => ({
        clientId: client.id,
        clientName: client.company_name || `${client.firstname} ${client.lastname}`,
      });

      const result = await this.processBatch(
        clients,
        'clients',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Clients indexés: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des clients: ${error.message}`,
      );
    }
  }

  async loadStaff(options: LoadOptions = {}) {
    try {
      const staffMembers = await this.prisma.staff.findMany({
        include: {
          roles: true,
          addresses: true,
        },
      });

      this.logger.log(
        `Chargement de ${staffMembers.length} membres du personnel.`,
      );

      const textGenerator = (staff: any) => `
        Personnel: ${staff.firstname} ${staff.lastname}
        Email: ${staff.email || 'Non spécifié'}
        Rôle: ${staff.roles?.name || 'Non spécifié'}
        Téléphone: ${staff.phone || 'Non spécifié'}
        Mobile: ${staff.mobile || 'Non spécifié'}
        Date d'embauche: ${staff.hire_date ? staff.hire_date.toISOString() : 'Non spécifiée'}
        Disponible: ${staff.is_available ? 'Oui' : 'Non'}
        Adresse: ${
          staff.addresses
            ? `${staff.addresses.street_number || ''} ${staff.addresses.street_name || ''}, ${staff.addresses.city || ''}, ${staff.addresses.zip_code || ''}`
            : 'Non spécifiée'
        }
      `;

      const metadataGenerator = (staff: any) => ({
        staffId: staff.id,
        staffName: `${staff.firstname} ${staff.lastname}`,
        staffRole: staff.roles?.name,
      });

      const result = await this.processBatch(
        staffMembers,
        'staff',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Personnel indexé: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement du personnel: ${error.message}`,
      );
    }
  }

  async loadDocuments(options: LoadOptions = {}) {
    try {
      const documents = await this.prisma.documents.findMany({
        include: {
          projects: true,
          clients: true,
        },
      });

      this.logger.log(`Chargement de ${documents.length} documents.`);

      const textGenerator = (document: any) => `
        Document: ${document.reference}
        Type: ${document.type || 'Non spécifié'}
        Projet: ${document.projects?.name || 'Non spécifié'}
        Client: ${document.clients?.company_name || document.clients?.firstname + ' ' + document.clients?.lastname || 'Non spécifié'}
        Statut: ${document.status || 'Non spécifié'}
        Montant: ${document.amount || 'Non spécifié'} €
        TVA: ${document.tva_rate || '20'}%
        Date d'émission: ${document.issue_date ? document.issue_date.toISOString() : 'Non spécifiée'}
        Date d'échéance: ${document.due_date ? document.due_date.toISOString() : 'Non spécifiée'}
        Moyen de paiement: ${document.payment_method || 'Non spécifié'}
        Conditions de paiement: ${document.payment_terms || 'Non spécifiées'}
        Statut de paiement: ${document.payment_status || 'Non spécifié'}
        Notes: ${document.notes || 'Aucune'}
      `;

      const metadataGenerator = (document: any) => ({
        documentId: document.id,
        documentReference: document.reference,
        documentType: document.type,
        projectId: document.project_id,
        projectName: document.projects?.name,
      });

      const result = await this.processBatch(
        documents,
        'documents',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Documents indexés: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des documents: ${error.message}`,
      );
    }
  }

  async loadProjectStages(options: LoadOptions = {}) {
    try {
      const stages = await this.prisma.project_stages.findMany({
        include: {
          projects: true,
        },
      });

      this.logger.log(`Chargement de ${stages.length} étapes de projet.`);

      const textGenerator = (stage: any) => `
        Étape: ${stage.name}
        Projet: ${stage.projects?.name || 'Non spécifié'} (Réf: ${stage.projects?.reference || 'Non spécifiée'})
        Description: ${stage.description || 'Non spécifiée'}
        Statut: ${stage.status || 'Non spécifié'}
        Date de début: ${stage.start_date ? stage.start_date.toISOString() : 'Non spécifiée'}
        Date de fin: ${stage.end_date ? stage.end_date.toISOString() : 'Non spécifiée'}
        Durée estimée: ${stage.estimated_duration || 'Non spécifiée'} jours
        Heures estimées: ${stage.estimated_hours || 'Non spécifiées'} heures
        Progression: ${stage.completion_percentage || '0'}%
        Ordre: ${stage.order_index}
        Notes: ${stage.notes || 'Aucune'}
      `;

      const metadataGenerator = (stage: any) => ({
        stageId: stage.id,
        stageName: stage.name,
        projectId: stage.project_id,
        projectName: stage.projects?.name,
      });

      const result = await this.processBatch(
        stages,
        'project_stages',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Étapes de projet indexées: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des étapes de projet: ${error.message}`,
      );
    }
  }

  async loadMaterials(options: LoadOptions = {}) {
    try {
      const materials = await this.prisma.materials.findMany();

      this.logger.log(`Chargement de ${materials.length} matériaux.`);

      const textGenerator = (material: any) => `
        Matériau: ${material.name}
        Référence: ${material.reference || 'Non spécifiée'}
        Description: ${material.description || 'Non spécifiée'}
        Unité: ${material.unit}
        Prix: ${material.price || 'Non spécifié'} €
        Stock actuel: ${material.stock_quantity || '0'} ${material.unit}
        Stock minimum: ${material.minimum_stock || '0'} ${material.unit}
        Fournisseur: ${material.supplier || 'Non spécifié'}
        Référence fournisseur: ${material.supplier_reference || 'Non spécifiée'}
      `;

      const metadataGenerator = (material: any) => ({
        materialId: material.id,
        materialName: material.name,
        materialReference: material.reference,
      });

      const result = await this.processBatch(
        materials,
        'materials',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Matériaux indexés: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des matériaux: ${error.message}`,
      );
    }
  }

  async loadEvents(options: LoadOptions = {}) {
    try {
      const events = await this.prisma.events.findMany({
        include: {
          projects: true,
          staff: true,
          clients: true,
        },
      });

      this.logger.log(`Chargement de ${events.length} événements.`);

      const textGenerator = (event: any) => `
        Événement: ${event.title}
        Type: ${event.event_type || 'Non spécifié'}
        Description: ${event.description || 'Non spécifiée'}
        Date de début: ${event.start_date ? event.start_date.toISOString() : 'Non spécifiée'}
        Date de fin: ${event.end_date ? event.end_date.toISOString() : 'Non spécifiée'}
        Journée entière: ${event.all_day ? 'Oui' : 'Non'}
        Lieu: ${event.location || 'Non spécifié'}
        Projet: ${event.projects?.name || 'Non spécifié'}
        Personnel impliqué: ${event.staff ? `${event.staff.firstname} ${event.staff.lastname}` : 'Non spécifié'}
        Client: ${event.clients ? event.clients.company_name || `${event.clients.firstname} ${event.clients.lastname}` : 'Non spécifié'}
        Statut: ${event.status || 'Non spécifié'}
      `;

      const metadataGenerator = (event: any) => ({
        eventId: event.id,
        eventTitle: event.title,
        eventType: event.event_type,
        projectId: event.project_id,
        projectName: event.projects?.name,
      });

      const result = await this.processBatch(
        events,
        'events',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Événements indexés: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des événements: ${error.message}`,
      );
    }
  }

  async loadSiteReports(options: LoadOptions = {}) {
    try {
      const reports = await this.prisma.site_reports.findMany({
        include: {
          projects: true,
          staff: true,
        },
      });

      this.logger.log(`Chargement de ${reports.length} rapports de chantier.`);

      const textGenerator = (report: any) => `
        Rapport: ${report.id}
        Projet: ${report.projects?.name || 'Non spécifié'} (Réf: ${report.projects?.reference || 'Non spécifiée'})
        Type: ${report.report_type || 'Non spécifié'}
        Description: ${report.description}
        Statut: ${report.status || 'Non spécifié'}
        Personnel: ${report.staff ? `${report.staff.firstname} ${report.staff.lastname}` : 'Non spécifié'}
        Date: ${report.created_at ? report.created_at.toISOString() : 'Non spécifiée'}
      `;

      const metadataGenerator = (report: any) => ({
        reportId: report.id,
        projectId: report.project_id,
        projectName: report.projects?.name,
        reportType: report.report_type,
      });

      const result = await this.processBatch(
        reports,
        'site_reports',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Rapports de chantier indexés: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des rapports de chantier: ${error.message}`,
      );
    }
  }

  async loadTasks(options: LoadOptions = {}) {
    try {
      const tasks = await this.prisma.tasks.findMany({
        include: {
          project_stages: {
            include: {
              projects: true,
            },
          },
          staff: true,
        },
      });

      this.logger.log(`Chargement de ${tasks.length} tâches.`);

      const textGenerator = (task: any) => `
        Tâche: ${task.label}
        Description: ${task.description || 'Non spécifiée'}
        Étape: ${task.project_stages?.name || 'Non spécifiée'}
        Projet: ${task.project_stages?.projects?.name || 'Non spécifié'} (Réf: ${task.project_stages?.projects?.reference || 'Non spécifiée'})
        Assignée à: ${task.staff ? `${task.staff.firstname} ${task.staff.lastname}` : 'Non assignée'}
        Date d'échéance: ${task.due_date ? task.due_date.toISOString() : 'Non spécifiée'}
        Statut: ${task.status || 'Non spécifié'}
        Priorité: ${task.priority || 'Non spécifiée'}
      `;

      const metadataGenerator = (task: any) => ({
        taskId: task.id,
        taskLabel: task.label,
        stageId: task.stage_id,
        stageName: task.project_stages?.name,
        projectId: task.project_stages?.project_id,
        projectName: task.project_stages?.projects?.name,
      });

      const result = await this.processBatch(
        tasks,
        'tasks',
        textGenerator,
        metadataGenerator,
        options,
      );

      this.logger.log(
        `Tâches indexées: ${result.processed} traités, ${result.skipped} ignorés, ${result.errors} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des tâches: ${error.message}`,
      );
    }
  }
}
