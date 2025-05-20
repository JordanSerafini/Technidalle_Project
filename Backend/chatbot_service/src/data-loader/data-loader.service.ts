import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VectorStoreService } from '../embedding/vector-store.service';

@Injectable()
export class DataLoaderService implements OnModuleInit {
  private readonly logger = new Logger(DataLoaderService.name);

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

  async loadAllData() {
    this.logger.log('Chargement des données pour indexation...');

    // Entités principales
    await this.loadProjects();
    await this.loadClients();
    await this.loadStaff();

    // Entités secondaires
    await this.loadDocuments();
    await this.loadProjectStages();
    await this.loadMaterials();
    await this.loadEvents();
    await this.loadSiteReports();
    await this.loadTasks();

    this.logger.log('Chargement des données terminé.');
  }

  async loadProjects() {
    try {
      const projects = await this.prisma.projects.findMany({
        include: {
          clients: true,
          project_stages: true,
        },
      });

      this.logger.log(`Chargement de ${projects.length} projets.`);

      for (const project of projects) {
        // Créer un texte descriptif du projet
        const projectText = `
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

        // Générer et stocker l'embedding
        const embedding = await this.vectorStore.generateEmbedding(projectText);
        await this.vectorStore.storeEmbedding(
          'projects',
          project.id,
          projectText,
          embedding,
          { projectId: project.id, projectName: project.name },
        );
      }

      this.logger.log(`${projects.length} projets indexés avec succès.`);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des projets: ${error.message}`,
      );
    }
  }

  async loadClients() {
    try {
      const clients = await this.prisma.clients.findMany({
        include: {
          addresses: true,
        },
      });

      this.logger.log(`Chargement de ${clients.length} clients.`);

      for (const client of clients) {
        const clientText = `
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

        const embedding = await this.vectorStore.generateEmbedding(clientText);
        await this.vectorStore.storeEmbedding(
          'clients',
          client.id,
          clientText,
          embedding,
          {
            clientId: client.id,
            clientName:
              client.company_name || `${client.firstname} ${client.lastname}`,
          },
        );
      }

      this.logger.log(`${clients.length} clients indexés avec succès.`);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des clients: ${error.message}`,
      );
    }
  }

  async loadStaff() {
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

      for (const staff of staffMembers) {
        const staffText = `
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

        const embedding = await this.vectorStore.generateEmbedding(staffText);
        await this.vectorStore.storeEmbedding(
          'staff',
          staff.id,
          staffText,
          embedding,
          {
            staffId: staff.id,
            staffName: `${staff.firstname} ${staff.lastname}`,
          },
        );
      }

      this.logger.log(
        `${staffMembers.length} membres du personnel indexés avec succès.`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement du personnel: ${error.message}`,
      );
    }
  }

  async loadDocuments() {
    try {
      const documents = await this.prisma.documents.findMany({
        include: {
          projects: true,
          clients: true,
        },
      });

      this.logger.log(`Chargement de ${documents.length} documents.`);

      for (const document of documents) {
        const documentText = `
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

        const embedding =
          await this.vectorStore.generateEmbedding(documentText);
        await this.vectorStore.storeEmbedding(
          'documents',
          document.id,
          documentText,
          embedding,
          {
            documentId: document.id,
            documentReference: document.reference,
            documentType: document.type,
            projectId: document.project_id,
            projectName: document.projects?.name,
          },
        );
      }

      this.logger.log(`${documents.length} documents indexés avec succès.`);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des documents: ${error.message}`,
      );
    }
  }

  async loadProjectStages() {
    try {
      const stages = await this.prisma.project_stages.findMany({
        include: {
          projects: true,
        },
      });

      this.logger.log(`Chargement de ${stages.length} étapes de projet.`);

      for (const stage of stages) {
        const stageText = `
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

        const embedding = await this.vectorStore.generateEmbedding(stageText);
        await this.vectorStore.storeEmbedding(
          'project_stages',
          stage.id,
          stageText,
          embedding,
          {
            stageId: stage.id,
            stageName: stage.name,
            projectId: stage.project_id,
            projectName: stage.projects?.name,
          },
        );
      }

      this.logger.log(
        `${stages.length} étapes de projet indexées avec succès.`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des étapes de projet: ${error.message}`,
      );
    }
  }

  async loadMaterials() {
    try {
      const materials = await this.prisma.materials.findMany();

      this.logger.log(`Chargement de ${materials.length} matériaux.`);

      for (const material of materials) {
        const materialText = `
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

        const embedding =
          await this.vectorStore.generateEmbedding(materialText);
        await this.vectorStore.storeEmbedding(
          'materials',
          material.id,
          materialText,
          embedding,
          {
            materialId: material.id,
            materialName: material.name,
            materialReference: material.reference,
          },
        );
      }

      this.logger.log(`${materials.length} matériaux indexés avec succès.`);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des matériaux: ${error.message}`,
      );
    }
  }

  async loadEvents() {
    try {
      const events = await this.prisma.events.findMany({
        include: {
          projects: true,
          staff: true,
          clients: true,
        },
      });

      this.logger.log(`Chargement de ${events.length} événements.`);

      for (const event of events) {
        const eventText = `
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

        const embedding = await this.vectorStore.generateEmbedding(eventText);
        await this.vectorStore.storeEmbedding(
          'events',
          event.id,
          eventText,
          embedding,
          {
            eventId: event.id,
            eventTitle: event.title,
            eventType: event.event_type,
            projectId: event.project_id,
            projectName: event.projects?.name,
          },
        );
      }

      this.logger.log(`${events.length} événements indexés avec succès.`);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des événements: ${error.message}`,
      );
    }
  }

  async loadSiteReports() {
    try {
      const reports = await this.prisma.site_reports.findMany({
        include: {
          projects: true,
          staff: true,
        },
      });

      this.logger.log(`Chargement de ${reports.length} rapports de chantier.`);

      for (const report of reports) {
        const reportText = `
          Rapport: ${report.id}
          Projet: ${report.projects?.name || 'Non spécifié'} (Réf: ${report.projects?.reference || 'Non spécifiée'})
          Type: ${report.report_type || 'Non spécifié'}
          Description: ${report.description}
          Statut: ${report.status || 'Non spécifié'}
          Personnel: ${report.staff ? `${report.staff.firstname} ${report.staff.lastname}` : 'Non spécifié'}
          Date: ${report.created_at ? report.created_at.toISOString() : 'Non spécifiée'}
        `;

        const embedding = await this.vectorStore.generateEmbedding(reportText);
        await this.vectorStore.storeEmbedding(
          'site_reports',
          report.id,
          reportText,
          embedding,
          {
            reportId: report.id,
            projectId: report.project_id,
            projectName: report.projects?.name,
            reportType: report.report_type,
          },
        );
      }

      this.logger.log(
        `${reports.length} rapports de chantier indexés avec succès.`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des rapports de chantier: ${error.message}`,
      );
    }
  }

  async loadTasks() {
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

      for (const task of tasks) {
        const taskText = `
          Tâche: ${task.label}
          Description: ${task.description || 'Non spécifiée'}
          Étape: ${task.project_stages?.name || 'Non spécifiée'}
          Projet: ${task.project_stages?.projects?.name || 'Non spécifié'} (Réf: ${task.project_stages?.projects?.reference || 'Non spécifiée'})
          Assignée à: ${task.staff ? `${task.staff.firstname} ${task.staff.lastname}` : 'Non assignée'}
          Date d'échéance: ${task.due_date ? task.due_date.toISOString() : 'Non spécifiée'}
          Statut: ${task.status || 'Non spécifié'}
          Priorité: ${task.priority || 'Non spécifiée'}
        `;

        const embedding = await this.vectorStore.generateEmbedding(taskText);
        await this.vectorStore.storeEmbedding(
          'tasks',
          task.id,
          taskText,
          embedding,
          {
            taskId: task.id,
            taskLabel: task.label,
            stageId: task.stage_id,
            stageName: task.project_stages?.name,
            projectId: task.project_stages?.project_id,
            projectName: task.project_stages?.projects?.name,
          },
        );
      }

      this.logger.log(`${tasks.length} tâches indexées avec succès.`);
    } catch (error) {
      this.logger.error(
        `Erreur lors du chargement des tâches: ${error.message}`,
      );
    }
  }
}
