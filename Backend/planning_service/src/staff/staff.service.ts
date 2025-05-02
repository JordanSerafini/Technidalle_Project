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
// import { Prisma } from '../../generated/prisma'; // Prisma est importé implicitement via PrismaService

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
}
