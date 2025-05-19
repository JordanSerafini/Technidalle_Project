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

    // Charger les projets
    await this.loadProjects();

    // Charger les clients
    await this.loadClients();

    // Charger le personnel
    await this.loadStaff();

    // Autres types de données selon les besoins

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
          Client: ${project.clients?.name || 'Non spécifié'}
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
}
