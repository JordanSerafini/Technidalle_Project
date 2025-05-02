import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../prisma/prisma.service'; // Assurez-vous que ce chemin est correct
import { firstValueFrom } from 'rxjs';

// Interface simplifiée pour l'adresse (basée sur ce que projects_service renvoie)
interface AddressSummary {
  id: number;
  street_number?: string | null;
  street_name: string;
  zip_code: string;
  city: string;
  // Ajoutez d'autres champs d'adresse si nécessaire
}

// Interface simplifiée pour le client
interface ClientSummary {
  id: number;
  firstname: string;
  lastname: string;
  company_name?: string | null;
}

// Interface pour les détails de l'étape retournés par projects_service
// (Basée sur le modèle Prisma project_stages)
interface StageDetails {
  id: number;
  name: string;
  description?: string | null;
  status?: string | null;
  order_index: number;
  // Ajoutez d'autres champs si nécessaire
}

// ProjectDetails: ne contient plus project_stages
interface ProjectDetails {
  id: number;
  name: string;
  reference: string;
  status?: string | null;
  notes?: string | null;
  addresses?: AddressSummary | null;
  clients?: ClientSummary | null;
  // project_stages est retiré
}

// ScheduleAssignment: inclut maintenant projet ET étape (optionnelle)
interface ScheduleAssignment {
  date: string;
  startTime: string;
  endTime: string;
  project: ProjectDetails | { id: number; name: string }; // Détails du projet global
  stage?: StageDetails | null; // Détails de l'étape spécifique (si event.stage_id existe)
}

@Injectable()
export class StaffService implements OnModuleInit {
  private readonly logger = new Logger(StaffService.name);

  constructor(
    @Inject('PROJECTS_SERVICE') private readonly projectsClient: ClientProxy,
    private readonly prisma: PrismaService, // Injection de PrismaService
  ) {}

  async onModuleInit() {
    // Test de connexion au service des projets
    try {
      // Utiliser une commande simple comme 'ping' si elle existe, sinon une commande existante
      await firstValueFrom(
        this.projectsClient.send({ cmd: 'get_all_tags' }, {}),
      );
      this.logger.log(
        'StaffService initialized and successfully connected to ProjectsService',
      );
    } catch (error) {
      this.logger.error(
        'StaffService failed to connect to ProjectsService on init',
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Helper pour obtenir le début et la fin d'un jour
  private getDateRange(date: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  async getDailySchedule(staffId: string): Promise<any> {
    const staffNumericId = parseInt(staffId, 10);
    if (isNaN(staffNumericId)) {
      throw new NotFoundException(`Staff with ID '${staffId}' not valid.`);
    }

    this.logger.log(
      `Récupération du planning journalier pour l'employé ${staffId}`,
    );
    const today = new Date();
    const { startOfDay, endOfDay } = this.getDateRange(today);

    try {
      // 1. Trouver les événements (inclure stage_id maintenant)
      const rawEvents = await this.prisma.events.findMany({
        where: {
          staff_id: staffNumericId,
          project_id: { not: null },
          OR: [
            { start_date: { lte: endOfDay }, end_date: { gte: startOfDay } },
          ],
        },
        // Sélectionner stage_id
        select: {
          id: true,
          start_date: true,
          end_date: true,
          project_id: true,
          stage_id: true, // Récupérer l'ID de l'étape
        },
        orderBy: { start_date: 'asc' },
      });

      // 2. Filtrer les événements valides (project_id non null)
      // On garde stage_id potentiellement null
      const events = rawEvents.filter(
        (event): event is typeof event & { project_id: number } =>
          event.project_id !== null,
      );

      if (events.length === 0) {
        return {
          date: today.toISOString().split('T')[0],
          staffId: staffId,
          chantiers: [],
        };
      }

      // 3. Récupérer les IDs uniques des projets ET des étapes
      const uniqueProjectIds = [...new Set(events.map((e) => e.project_id))];
      const uniqueStageIds = [
        ...new Set(
          events
            .map((e) => e.stage_id)
            .filter((id): id is number => id !== null),
        ),
      ];

      // 4. Obtenir les détails des projets ET des étapes
      const [projectsDetailsList, stagesDetailsList] = await Promise.all([
        // Appel pour les projets
        Promise.all(
          uniqueProjectIds.map(
            (
              id, // id est garanti number ici
            ) =>
              firstValueFrom(
                this.projectsClient.send<ProjectDetails>(
                  { cmd: 'get_project_by_id' },
                  { id },
                ),
              ).catch((err) => {
                this.logger.warn(
                  `Could not fetch details for project ${id}: ${err instanceof Error ? err.message : err}`,
                );
                return null;
              }),
          ),
        ),
        // Appel pour les étapes
        Promise.all(
          uniqueStageIds.map((id) =>
            firstValueFrom(
              this.projectsClient.send<StageDetails>(
                { cmd: 'get_stage_by_id' }, // Nouvelle commande
                { id },
              ),
            ).catch((err) => {
              this.logger.warn(
                `Could not fetch details for stage ${id}: ${err instanceof Error ? err.message : err}`,
              );
              return null;
            }),
          ),
        ),
      ]);

      const projectsDetailsMap = new Map<number, ProjectDetails>();
      projectsDetailsList.forEach((project) => {
        if (project) {
          projectsDetailsMap.set(project.id, project);
        }
      });

      const stagesDetailsMap = new Map<number, StageDetails>();
      stagesDetailsList.forEach((stage) => {
        if (stage) {
          stagesDetailsMap.set(stage.id, stage);
        }
      });

      // 5. Combiner les détails projet et étape
      const schedule: ScheduleAssignment[] = events.map((event) => {
        const projectDetails = projectsDetailsMap.get(event.project_id);
        // Récupérer les détails de l'étape SEULEMENT si event.stage_id existe
        const stageDetails = event.stage_id
          ? stagesDetailsMap.get(event.stage_id)
          : null;

        return {
          date: event.start_date.toISOString().split('T')[0],
          startTime: event.start_date.toISOString(),
          endTime: event.end_date.toISOString(),
          project: projectDetails
            ? projectDetails
            : { id: event.project_id, name: 'Projet introuvable' }, // Renommé le fallback
          stage: stageDetails, // Ajouter les détails de l'étape (peut être null)
        };
      });

      return {
        date: today.toISOString().split('T')[0],
        staffId: staffId,
        // Le nom de la clé reste 'chantiers' pour la cohérence avec l'API Gateway
        // mais contient maintenant des ScheduleAssignment enrichis
        chantiers: schedule,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching daily schedule for staff ${staffId}`,
        error instanceof Error ? error.message : error,
      );
      // Renvoyer une erreur plus significative ou laisser NestJS gérer
      throw new Error(`Could not retrieve daily schedule for staff ${staffId}`);
    }
  }

  async getWeeklySchedule(staffId: string, date?: string): Promise<any> {
    const staffNumericId = parseInt(staffId, 10);
    if (isNaN(staffNumericId)) {
      throw new NotFoundException(`Staff with ID '${staffId}' not valid.`);
    }

    const targetDate = date ? new Date(date) : new Date();
    const weekStartDate = new Date(targetDate);
    const dayOfWeek = targetDate.getDay(); // 0 = Dimanche, 1 = Lundi, ...
    const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    weekStartDate.setDate(diff);
    weekStartDate.setHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    this.logger.log(
      `Récupération du planning semaine du ${weekStartDate.toISOString().split('T')[0]} au ${weekEndDate.toISOString().split('T')[0]} pour l'employé ${staffId}`,
    );

    try {
      // 1. Trouver les événements (inclure stage_id)
      const rawEvents = await this.prisma.events.findMany({
        where: {
          staff_id: staffNumericId,
          project_id: { not: null },
          OR: [
            {
              start_date: { lte: weekEndDate },
              end_date: { gte: weekStartDate },
            },
          ],
        },
        select: {
          id: true,
          start_date: true,
          end_date: true,
          project_id: true,
          stage_id: true,
        },
        orderBy: { start_date: 'asc' },
      });

      // 2. Filtrer les événements valides
      const events = rawEvents.filter(
        (event): event is typeof event & { project_id: number } =>
          event.project_id !== null,
      );

      if (events.length === 0) {
        return {
          weekOf: weekStartDate.toISOString().split('T')[0],
          staffId: staffId,
          planning: {},
        };
      }

      // 3. Récupérer les IDs uniques projets ET étapes
      const uniqueProjectIds = [...new Set(events.map((e) => e.project_id))];
      const uniqueStageIds = [
        ...new Set(
          events
            .map((e) => e.stage_id)
            .filter((id): id is number => id !== null),
        ),
      ];

      // 4. Obtenir les détails projets ET étapes (Promise.all)
      const [projectsDetailsList, stagesDetailsList] = await Promise.all([
        Promise.all(
          uniqueProjectIds.map(
            (
              id, // id est garanti number ici
            ) =>
              firstValueFrom(
                this.projectsClient.send<ProjectDetails>(
                  { cmd: 'get_project_by_id' },
                  { id },
                ),
              ).catch((err) => {
                this.logger.warn(
                  `Could not fetch details for project ${id}: ${err instanceof Error ? err.message : err}`,
                );
                return null;
              }),
          ),
        ),
        Promise.all(
          uniqueStageIds.map((id) =>
            firstValueFrom(
              this.projectsClient.send<StageDetails>(
                { cmd: 'get_stage_by_id' },
                { id },
              ),
            ).catch((err) => {
              this.logger.warn(
                `Could not fetch details for stage ${id}: ${err instanceof Error ? err.message : err}`,
              );
              return null;
            }),
          ),
        ),
      ]);

      const projectsDetailsMap = new Map<number, ProjectDetails>();
      projectsDetailsList.forEach((project) => {
        if (project) {
          projectsDetailsMap.set(project.id, project);
        }
      });

      const stagesDetailsMap = new Map<number, StageDetails>();
      stagesDetailsList.forEach((stage) => {
        if (stage) {
          stagesDetailsMap.set(stage.id, stage);
        }
      });

      // 5. Structurer le planning hebdomadaire
      const weeklyPlanning: Record<string, ScheduleAssignment[]> = {};

      // Initialiser les jours de la semaine
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStartDate);
        day.setDate(weekStartDate.getDate() + i);
        weeklyPlanning[day.toISOString().split('T')[0]] = [];
      }

      events.forEach((event) => {
        const eventStartDate = new Date(event.start_date);
        const eventEndDate = new Date(event.end_date);

        // Gérer les événements sur plusieurs jours en les ajoutant à chaque jour concerné
        const currentDate = new Date(eventStartDate);
        currentDate.setHours(0, 0, 0, 0);
        const lastDate = new Date(eventEndDate);
        lastDate.setHours(0, 0, 0, 0);

        while (currentDate <= lastDate) {
          const currentDateStr = currentDate.toISOString().split('T')[0];
          if (weeklyPlanning[currentDateStr] !== undefined) {
            const projectDetails = projectsDetailsMap.get(event.project_id);
            const stageDetails = event.stage_id
              ? stagesDetailsMap.get(event.stage_id)
              : null;

            weeklyPlanning[currentDateStr].push({
              date: currentDateStr,
              startTime: event.start_date.toISOString(),
              endTime: event.end_date.toISOString(),
              project: projectDetails
                ? projectDetails
                : { id: event.project_id, name: 'Projet introuvable' },
              stage: stageDetails,
            });
          }
          // Passer au jour suivant
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      return {
        weekOf: weekStartDate.toISOString().split('T')[0],
        staffId: staffId,
        planning: weeklyPlanning,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching weekly schedule for staff ${staffId}`,
        error instanceof Error ? error.message : error,
      );
      throw new Error(
        `Could not retrieve weekly schedule for staff ${staffId}`,
      );
    }
  }

  async getEventsByStaff(staffId: number): Promise<any> {
    if (isNaN(staffId) || staffId <= 0) {
      throw new NotFoundException(`Staff ID '${staffId}' is not valid.`);
    }

    this.logger.log(`Récupération des événements pour l'employé ${staffId}`);

    try {
      // Récupérer tous les événements liés à ce membre du staff
      const events = await this.prisma.events.findMany({
        where: {
          staff_id: staffId,
        },
        include: {
          // Inclure toutes les relations pertinentes
          projects: true, // Récupérer toutes les données du projet
        },
        orderBy: {
          start_date: 'asc',
        },
      });

      this.logger.log(
        `Trouvé ${events.length} événements pour l'employé ${staffId}`,
      );

      if (events.length === 0) {
        return [];
      }

      // Récupérer les IDs des projets et des étapes
      const projectIds = events
        .map((event) => event.project_id)
        .filter((id): id is number => id !== null);

      const stageIds = events
        .map((event) => event.stage_id)
        .filter((id): id is number => id !== null);

      this.logger.log(
        `Événements liés à ${projectIds.length} projets et ${stageIds.length} étapes`,
      );

      // Récupérer les détails des projets si nécessaire
      const projectsMap = new Map();
      if (projectIds.length > 0) {
        const uniqueProjectIds = [...new Set(projectIds)];
        this.logger.log(
          `Récupération des détails pour ${uniqueProjectIds.length} projets uniques`,
        );

        try {
          const projectsPromises = uniqueProjectIds.map((id) =>
            firstValueFrom(
              this.projectsClient.send({ cmd: 'get_project_by_id' }, { id }),
            ).catch((err) => {
              this.logger.warn(
                `Erreur lors de la récupération du projet ${id}: ${err}`,
              );
              return null;
            }),
          );

          const projectsDetailsList = await Promise.all(projectsPromises);
          projectsDetailsList.forEach((project) => {
            if (project) {
              projectsMap.set(project.id, project);
            }
          });

          this.logger.log(
            `Récupéré avec succès ${projectsMap.size}/${uniqueProjectIds.length} projets`,
          );
        } catch (err) {
          this.logger.error(
            `Erreur lors de la récupération des projets: ${err}`,
          );
        }
      }

      // Récupérer les détails des étapes
      const stagesMap = new Map();

      if (stageIds.length > 0) {
        const uniqueStageIds = [...new Set(stageIds)];
        this.logger.log(
          `Récupération des détails pour ${uniqueStageIds.length} étapes uniques: ${JSON.stringify(uniqueStageIds)}`,
        );

        try {
          // Récupérer directement depuis Prisma plutôt que via microservice
          const stages = await this.prisma.project_stages.findMany({
            where: {
              id: {
                in: uniqueStageIds,
              },
            },
          });

          stages.forEach((stage) => {
            stagesMap.set(stage.id, stage);
          });

          this.logger.log(
            `Récupéré ${stages.length} étapes depuis la base de données`,
          );

          // Récupérer aussi via le microservice pour avoir des données complètes
          const stagesPromises = uniqueStageIds.map((id) =>
            firstValueFrom(
              this.projectsClient.send({ cmd: 'get_stage_by_id' }, { id }),
            ).catch((err) => {
              this.logger.warn(
                `Erreur lors de la récupération de l'étape ${id} via microservice: ${err}`,
              );
              return null;
            }),
          );

          const stagesDetailsList = await Promise.all(stagesPromises);
          let stagesFromMicroservice = 0;

          stagesDetailsList.forEach((stage) => {
            if (stage) {
              stagesMap.set(stage.id, stage);
              stagesFromMicroservice++;
            }
          });

          this.logger.log(
            `Récupéré ${stagesFromMicroservice} étapes depuis le microservice`,
          );
        } catch (err) {
          this.logger.error(
            `Erreur lors de la récupération des étapes: ${err}`,
          );
        }
      }

      // Enrichir chaque événement avec les détails
      const enrichedEvents = events.map((event) => {
        const enrichedEvent: any = { ...event };

        // Ajouter les détails du projet si disponibles
        if (event.project_id && projectsMap.has(event.project_id)) {
          enrichedEvent.project = projectsMap.get(event.project_id);
        }

        // Ajouter les détails de l'étape si disponibles
        if (event.stage_id && stagesMap.has(event.stage_id)) {
          const stageDetails = stagesMap.get(event.stage_id);
          this.logger.debug(
            `Ajout des détails de l'étape ${event.stage_id} à l'événement ${event.id}`,
          );
          enrichedEvent.stage = stageDetails;
        }

        return enrichedEvent;
      });

      this.logger.log(`Retour de ${enrichedEvents.length} événements enrichis`);
      return enrichedEvents;
    } catch (error) {
      this.logger.error(
        `Error fetching events for staff ${staffId}`,
        error instanceof Error ? error.message : error,
      );
      throw new Error(`Could not retrieve events for staff ${staffId}`);
    }
  }

  async getAssignmentsByStaff(staffId: number): Promise<any> {
    if (isNaN(staffId) || staffId <= 0) {
      throw new NotFoundException(`Staff ID '${staffId}' is not valid.`);
    }

    this.logger.log(`Récupération des assignations pour l'employé ${staffId}`);

    try {
      // Récupérer toutes les assignations du membre du staff depuis project_staff
      // avec une requête simplifiée pour éviter les problèmes
      const assignments = await this.prisma.project_staff.findMany({
        where: {
          staff_id: staffId,
        },
        include: {
          // Inclure les informations du projet et du staff
          projects: true,
          staff: true,
          // Inclure les informations de l'étape si présente
          project_stages: true,
        },
      });

      this.logger.log(
        `Trouvé ${assignments.length} assignations pour l'employé ${staffId}`,
      );

      // Retourner directement les assignations sans transformation
      return assignments;
    } catch (error) {
      this.logger.error(
        `Error fetching assignments for staff ${staffId}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(
        `Could not retrieve assignments for staff ${staffId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async assignStaffToProject(assignmentData: {
    projectId: number;
    staffId: number;
    stageId?: number;
    roleDescription?: string;
    startDate: string;
    endDate?: string;
    hoursPlanned?: number;
  }): Promise<any> {
    this.logger.log(
      `Assignation de l'employé ${assignmentData.staffId} au projet ${assignmentData.projectId}`,
    );

    try {
      // Vérifier que le projet existe
      const projectExists = await this.prisma.projects.findUnique({
        where: { id: assignmentData.projectId },
      });

      if (!projectExists) {
        throw new NotFoundException(
          `Projet avec ID ${assignmentData.projectId} non trouvé`,
        );
      }

      // Vérifier que l'employé existe
      const staffExists = await this.prisma.staff.findUnique({
        where: { id: assignmentData.staffId },
      });

      if (!staffExists) {
        throw new NotFoundException(
          `Employé avec ID ${assignmentData.staffId} non trouvé`,
        );
      }

      // Si une étape est spécifiée, vérifier qu'elle existe et appartient au projet
      if (assignmentData.stageId) {
        const stageExists = await this.prisma.project_stages.findUnique({
          where: { id: assignmentData.stageId },
        });

        if (!stageExists) {
          throw new NotFoundException(
            `Étape avec ID ${assignmentData.stageId} non trouvée`,
          );
        }

        if (stageExists.project_id !== assignmentData.projectId) {
          throw new Error(
            `L'étape ${assignmentData.stageId} n'appartient pas au projet ${assignmentData.projectId}`,
          );
        }
      }

      // Créer l'assignation
      const newAssignment = await this.prisma.project_staff.create({
        data: {
          project_id: assignmentData.projectId,
          staff_id: assignmentData.staffId,
          stage_id: assignmentData.stageId || null,
          role_description: assignmentData.roleDescription || null,
          start_date: new Date(assignmentData.startDate),
          end_date: assignmentData.endDate
            ? new Date(assignmentData.endDate)
            : null,
          hours_planned: assignmentData.hoursPlanned || null,
        },
        include: {
          projects: true,
          staff: true,
        },
      });

      this.logger.log(
        `Employé ${assignmentData.staffId} assigné avec succès au projet ${assignmentData.projectId}`,
      );
      return newAssignment;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'assignation de l'employé ${assignmentData.staffId} au projet ${assignmentData.projectId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  async updateStaffAssignment(updateData: {
    id: number;
    roleDescription?: string;
    startDate?: string;
    endDate?: string;
    hoursPlanned?: number;
    hoursWorked?: number;
    stageId?: number;
  }): Promise<any> {
    this.logger.log(`Mise à jour de l'assignation ${updateData.id}`);

    try {
      // Vérifier que l'assignation existe
      const assignmentExists = await this.prisma.project_staff.findUnique({
        where: { id: updateData.id },
      });

      if (!assignmentExists) {
        throw new NotFoundException(
          `Assignation avec ID ${updateData.id} non trouvée`,
        );
      }

      // Si une étape est spécifiée, vérifier qu'elle existe et appartient au projet
      if (updateData.stageId !== undefined) {
        if (updateData.stageId === null) {
          // Pas de vérification nécessaire si on veut retirer l'assignation à une étape
        } else {
          const stageExists = await this.prisma.project_stages.findUnique({
            where: { id: updateData.stageId },
          });

          if (!stageExists) {
            throw new NotFoundException(
              `Étape avec ID ${updateData.stageId} non trouvée`,
            );
          }

          if (stageExists.project_id !== assignmentExists.project_id) {
            throw new Error(
              `L'étape ${updateData.stageId} n'appartient pas au projet ${assignmentExists.project_id}`,
            );
          }
        }
      }

      // Mettre à jour l'assignation
      const updatedAssignment = await this.prisma.project_staff.update({
        where: { id: updateData.id },
        data: {
          role_description:
            updateData.roleDescription !== undefined
              ? updateData.roleDescription
              : undefined,
          start_date: updateData.startDate
            ? new Date(updateData.startDate)
            : undefined,
          end_date:
            updateData.endDate === null
              ? null
              : updateData.endDate
                ? new Date(updateData.endDate)
                : undefined,
          hours_planned:
            updateData.hoursPlanned !== undefined
              ? updateData.hoursPlanned
              : undefined,
          hours_worked:
            updateData.hoursWorked !== undefined
              ? updateData.hoursWorked
              : undefined,
          stage_id:
            updateData.stageId !== undefined ? updateData.stageId : undefined,
        },
        include: {
          projects: true,
          staff: true,
        },
      });

      this.logger.log(`Assignation ${updateData.id} mise à jour avec succès`);
      return updatedAssignment;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de l'assignation ${updateData.id}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  async removeStaffAssignment(assignmentId: number): Promise<boolean> {
    this.logger.log(`Suppression de l'assignation ${assignmentId}`);

    try {
      // Vérifier que l'assignation existe
      const assignmentExists = await this.prisma.project_staff.findUnique({
        where: { id: assignmentId },
      });

      if (!assignmentExists) {
        throw new NotFoundException(
          `Assignation avec ID ${assignmentId} non trouvée`,
        );
      }

      // Supprimer l'assignation
      await this.prisma.project_staff.delete({
        where: { id: assignmentId },
      });

      this.logger.log(`Assignation ${assignmentId} supprimée avec succès`);
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de l'assignation ${assignmentId}`,
        error instanceof Error ? error.message : error,
      );
      throw error;
    }
  }

  async debugStaffAssignments(staffId: number): Promise<any> {
    this.logger.log(`Diagnostic des assignations pour l'employé ${staffId}`);

    try {
      // Vérification directe de la présence d'assignations
      const rawCount = await this.prisma
        .$queryRaw<[{ count: string }]>`SELECT COUNT(*) as count FROM project_staff WHERE staff_id = ${staffId}`;
  
      // Récupération des données brutes de project_staff
      const rawAssignments = await this.prisma
        .$queryRaw<any[]>`
        SELECT 
          ps.*, 
          p.name as project_name, 
          p.reference as project_reference,
          s.firstname || ' ' || s.lastname as staff_name,
          ps2.name as stage_name
        FROM 
          project_staff ps
        LEFT JOIN 
          projects p ON ps.project_id = p.id
        LEFT JOIN 
          staff s ON ps.staff_id = s.id
        LEFT JOIN 
          project_stages ps2 ON ps.stage_id = ps2.id
        WHERE 
          ps.staff_id = ${staffId}
        ORDER BY 
          ps.start_date ASC
      `;

      // État des tables impliquées
      const tableStats = {
        project_staff: await this.prisma.project_staff.count(),
        staff: await this.prisma.staff.count({
          where: { id: staffId },
        }),
        projects: await this.prisma.projects.count(),
        project_stages: await this.prisma.project_stages.count(),
      };

      // Vérifier si les assignations sont correctes
      const assignmentValidation = rawAssignments.map((assignment: any) => {
        return {
          id: assignment.id,
          isValid: !!assignment.project_name && !!assignment.staff_name,
          hasStage: !!assignment.stage_name,
          projectExists: !!assignment.project_name,
          staffExists: !!assignment.staff_name,
        };
      });

      // Retourner le diagnostic complet
      return {
        count: rawCount[0].count,
        rawAssignments,
        tableStats,
        assignmentValidation,
        staff: await this.prisma.staff.findUnique({
          where: { id: staffId },
        }),
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du diagnostic des assignations pour le staff ${staffId}`,
        error instanceof Error ? error.message : error,
      );
      throw new Error(
        `Erreur de diagnostic pour le staff ${staffId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }
  }
}
