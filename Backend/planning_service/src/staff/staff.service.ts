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
// Modifiée pour inclure le type et potentiellement un titre
interface ScheduleItem {
  type: 'event' | 'assignment'; // Différencie un événement ponctuel d'une période d'assignation
  id: string; // ID unique préfixé (e.g., "event-123", "assign-456")
  title: string; // Titre de l'événement ou description de l'assignation
  startTime: string; // ISO string date/heure de début (peut être l'heure réelle ou début/fin de journée selon contexte)
  endTime: string | null; // ISO string date/heure de fin (peut être l'heure réelle ou début/fin de journée selon contexte)
  actualStartTime?: string | null; // Ajouté: Heure de début réelle de l'assignation/événement
  actualEndTime?: string | null; // Ajouté: Heure de fin réelle de l'assignation/événement
  allDay: boolean; // Indique si c'est un événement/assignation sur toute la journée DANS LE CONTEXTE ACTUEL (jour/semaine)
  project?: Partial<ProjectDetails> | null; // Détails partiels du projet
  stage?: Partial<StageDetails> | null; // Détails partiels de l'étape
  // Champs spécifiques aux événements
  eventType?: string | null;
  // Champs spécifiques aux assignations
  role?: string | null;
  hoursPlanned?: number | null; // Ajouté pour 'assignment'
  hoursWorked?: number | null; // Ajouté pour 'assignment'
}

// Interface pour typer les résultats de la requête brute dans debugStaffAssignments
interface RawAssignmentDebugInfo {
  id: string;
  project_id: string;
  staff_id: string;
  stage_id: string | null;
  role_description: string | null;
  start_date: Date;
  end_date: Date | null;
  hours_planned: string | null;
  hours_worked: string | null;
  project_name: string | null;
  project_reference: string | null;
  staff_name: string | null;
  stage_name: string | null;
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

  // Helper pour obtenir le début et la fin d'un jour UTC
  private getDateRange(date: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
  }

  async getDailySchedule(staffId: string): Promise<any> {
    const staffNumericId = parseInt(staffId, 10);
    if (isNaN(staffNumericId)) {
      throw new NotFoundException(`Staff with ID '${staffId}' not valid.`);
    }

    this.logger.log(
      `Récupération du planning journalier (événements + étapes assignées) pour l'employé ${staffId}`,
    );
    const today = new Date();
    const { startOfDay, endOfDay } = this.getDateRange(today);

    try {
      // 1. Trouver les événements spécifiques du jour
      const events = await this.prisma.events.findMany({
        where: {
          staff_id: staffNumericId,
          OR: [
            { start_date: { gte: startOfDay, lte: endOfDay } },
            { end_date: { gte: startOfDay, lte: endOfDay } },
            { start_date: { lt: startOfDay }, end_date: { gt: endOfDay } },
          ],
        },
        select: {
          id: true,
          title: true,
          start_date: true,
          end_date: true,
          project_id: true,
          stage_id: true,
          event_type: true,
          all_day: true,
          projects: { select: { id: true, name: true, reference: true } }, // Détails projet sélectionnés
          project_stages: { select: { id: true, name: true, status: true } }, // Détails étape sélectionnés
        },
        orderBy: { start_date: 'asc' },
      });
      this.logger.log(`Trouvé ${events.length} événement(s) pour aujourd'hui.`);

      // 2. Trouver les assignations (project_staff) actives aujourd'hui
      const assignments = await this.prisma.project_staff.findMany({
        where: {
          staff_id: staffNumericId,
          start_date: { lte: endOfDay },
          OR: [{ end_date: null }, { end_date: { gte: startOfDay } }],
        },
        select: {
          id: true,
          role_description: true,
          start_date: true,
          end_date: true,
          hours_planned: true,
          hours_worked: true,
          projects: {
            select: {
              id: true,
              name: true,
              reference: true,
              addresses: true,
              clients: true,
            },
          },
          project_stages: { select: { id: true, name: true, status: true } },
          staff: { select: { firstname: true, lastname: true } },
        },
      });
      const staffNameForLog = assignments[0]?.staff
        ? `${assignments[0].staff.firstname} ${assignments[0].staff.lastname}`
        : `Staff ID ${staffNumericId}`;
      this.logger.log(
        `Trouvé ${assignments.length} assignation(s) active(s) aujourd'hui pour ${staffNameForLog}.`,
      );

      // 3. Combiner et formater les résultats
      const formattedEvents: ScheduleItem[] = events.map((event) => ({
        type: 'event',
        id: `event-${event.id}`,
        title: event.title ?? 'Événement sans titre',
        startTime: event.start_date.toISOString(),
        endTime: event.end_date.toISOString(),
        allDay: event.all_day ?? false,
        eventType: event.event_type,
        // Utiliser les objets sélectionnés directement
        project: event.projects,
        stage: event.project_stages,
      }));

      const formattedAssignments: ScheduleItem[] = assignments.map((assign) => {
        let title = 'Assignation Projet/Étape';
        if (assign.projects) {
          title = `Projet: ${assign.projects.name} (${assign.projects.reference})`;
          if (assign.project_stages) {
            title = `Étape: ${assign.project_stages.name} (${assign.projects.reference})`;
          }
        }

        const assignStartDate = assign.start_date;
        const assignEndDate = assign.end_date;
        let effectiveStartTime = startOfDay;
        let effectiveEndTime = endOfDay;
        let isAllDay = true;

        if (assignStartDate) {
          const startDateObj = new Date(assignStartDate);
          const endDateObj = assignEndDate ? new Date(assignEndDate) : null;

          const startsToday =
            startDateObj >= startOfDay && startDateObj <= endOfDay;
          const endsToday =
            endDateObj && endDateObj >= startOfDay && endDateObj <= endOfDay;

          // Cas 1: Commence et finit aujourd'hui avec des heures spécifiques (ou au moins une heure spécifique)
          if (startsToday && endsToday) {
            const isFullDayExactly =
              startDateObj.getTime() === startOfDay.getTime() &&
              endDateObj.getTime() === endOfDay.getTime();

            if (!isFullDayExactly) {
              effectiveStartTime = startDateObj;
              effectiveEndTime = endDateObj;
              isAllDay = false;
            }
          }
          // Cas 2: Commence aujourd'hui (heure spé?) mais finit plus tard (ou jamais)
          else if (startsToday && (!endDateObj || endDateObj > endOfDay)) {
            const specificStartTime =
              startDateObj.getUTCHours() !== 0 ||
              startDateObj.getUTCMinutes() !== 0 ||
              startDateObj.getUTCSeconds() !== 0 ||
              startDateObj.getUTCMilliseconds() !== 0;
            if (specificStartTime) {
              effectiveStartTime = startDateObj;
              // effectiveEndTime reste endOfDay
              isAllDay = false;
            } // else: commence à minuit -> allDay true
          }
          // Cas 3: Finit aujourd'hui (heure spé?) mais a commencé avant
          else if (endsToday && startDateObj < startOfDay) {
            const specificEndTime = !(
              endDateObj.getUTCHours() === 23 &&
              endDateObj.getUTCMinutes() === 59 &&
              endDateObj.getUTCSeconds() === 59 &&
              endDateObj.getUTCMilliseconds() === 999
            );
            if (specificEndTime) {
              // effectiveStartTime reste startOfDay
              effectiveEndTime = endDateObj;
              isAllDay = false;
            } // else: finit à 23:59:59 -> allDay true
          }
          // Cas 4: S'étend sur toute la journée (commence avant, finit après/jamais)
          // Couvert implicitement par le défaut (isAllDay = true)
        }
        // Si pas de startDate, ou si les conditions ci-dessus ne s'appliquent pas, on reste sur allDay: true

        // Sanity check: If isAllDay ended up false, but times are identical, it's likely bad data or a zero-duration event.
        // Treat as allDay to avoid confusion, but log it.
        if (
          !isAllDay &&
          effectiveStartTime.getTime() === effectiveEndTime.getTime()
        ) {
          this.logger.warn(
            `Assignation ID ${assign.id} resulted in allDay=false but identical start/end times (${effectiveStartTime.toISOString()}). Reverting to allDay=true. Check data source.`,
          );
          isAllDay = true;
          // Optionally reset times back to full day if reverting
          effectiveStartTime = startOfDay;
          effectiveEndTime = endOfDay;
        }

        return {
          type: 'assignment',
          id: `assign-${assign.id}`,
          title,
          startTime: effectiveStartTime.toISOString(),
          endTime: effectiveEndTime.toISOString(),
          allDay: isAllDay,
          project: assign.projects,
          stage: assign.project_stages,
          role: assign.role_description,
          hoursPlanned: assign.hours_planned,
          hoursWorked: assign.hours_worked,
          actualStartTime: assign.start_date?.toISOString(),
          actualEndTime: assign.end_date?.toISOString() ?? null,
        };
      });

      const combinedSchedule = [...formattedEvents, ...formattedAssignments];

      return {
        date: today.toISOString().split('T')[0],
        staffId: staffId,
        schedule: combinedSchedule,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching daily schedule for staff ${staffId}`,
        error instanceof Error ? error.message : error,
      );
      throw new Error(`Could not retrieve daily schedule for staff ${staffId}`);
    }
  }

  async getWeeklySchedule(staffId: string, date?: string): Promise<any> {
    const staffNumericId = parseInt(staffId, 10);
    if (isNaN(staffNumericId)) {
      throw new NotFoundException(`Staff with ID '${staffId}' not valid.`);
    }

    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStartDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate() + diffToMonday,
      ),
    );
    weekStartDate.setUTCHours(0, 0, 0, 0);

    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
    weekEndDate.setUTCHours(23, 59, 59, 999);

    this.logger.log(
      `Récupération du planning semaine (événements + étapes) du ${weekStartDate.toISOString().split('T')[0]} au ${weekEndDate.toISOString().split('T')[0]} pour l'employé ${staffId}`,
    );

    try {
      // 1. Trouver les événements de la semaine
      const events = await this.prisma.events.findMany({
        where: {
          staff_id: staffNumericId,
          start_date: { lte: weekEndDate },
          end_date: { gte: weekStartDate },
        },
        select: {
          id: true,
          title: true,
          start_date: true,
          end_date: true,
          project_id: true,
          stage_id: true,
          event_type: true,
          all_day: true,
          projects: { select: { id: true, name: true, reference: true } },
          project_stages: { select: { id: true, name: true, status: true } },
        },
        orderBy: { start_date: 'asc' },
      });
      this.logger.log(`Trouvé ${events.length} événement(s) pour la semaine.`);

      // 2. Trouver les assignations actives pendant la semaine
      const assignments = await this.prisma.project_staff.findMany({
        where: {
          staff_id: staffNumericId,
          start_date: { lte: weekEndDate },
          OR: [{ end_date: null }, { end_date: { gte: weekStartDate } }],
        },
        select: {
          id: true,
          role_description: true,
          start_date: true,
          end_date: true,
          projects: {
            select: {
              id: true,
              name: true,
              reference: true,
              addresses: true,
              clients: true,
            },
          },
          project_stages: { select: { id: true, name: true, status: true } },
          staff: { select: { firstname: true, lastname: true } },
        },
      });
      const staffNameForLog = assignments[0]?.staff
        ? `${assignments[0].staff.firstname} ${assignments[0].staff.lastname}`
        : `Staff ID ${staffNumericId}`;
      this.logger.log(
        `Trouvé ${assignments.length} assignation(s) active(s) pendant la semaine pour ${staffNameForLog}.`,
      );

      // 3. Structurer le planning hebdomadaire
      const weeklyPlanning: Record<string, ScheduleItem[]> = {};

      // Initialiser les jours de la semaine
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStartDate);
        day.setUTCDate(weekStartDate.getUTCDate() + i);
        weeklyPlanning[day.toISOString().split('T')[0]] = [];
      }

      // Traiter les événements
      events.forEach((event) => {
        const eventStart = new Date(event.start_date);
        const eventEnd = new Date(event.end_date);
        let loopSafety = 0;

        for (
          let d = new Date(eventStart);
          d <= eventEnd;
          d.setUTCDate(d.getUTCDate() + 1)
        ) {
          if (loopSafety++ > 366) break; // Safety break
          if (d >= weekStartDate && d <= weekEndDate) {
            const dayStr = d.toISOString().split('T')[0];
            if (weeklyPlanning[dayStr]) {
              weeklyPlanning[dayStr].push({
                type: 'event',
                id: `event-${event.id}`,
                title: event.title ?? 'Événement sans titre',
                startTime: event.start_date.toISOString(),
                endTime: event.end_date.toISOString(),
                allDay: event.all_day ?? false,
                eventType: event.event_type,
                project: event.projects,
                stage: event.project_stages,
              });
            }
          }
          if (
            d.getUTCFullYear() === eventEnd.getUTCFullYear() &&
            d.getUTCMonth() === eventEnd.getUTCMonth() &&
            d.getUTCDate() === eventEnd.getUTCDate()
          ) {
            break;
          }
        }
      });

      // Traiter les assignations
      assignments.forEach((assign) => {
        const assignStart = new Date(assign.start_date);
        const assignEnd = assign.end_date
          ? new Date(assign.end_date)
          : new Date('9999-12-31');
        let loopSafety = 0;

        for (
          let d = new Date(assignStart);
          d <= assignEnd;
          d.setUTCDate(d.getUTCDate() + 1)
        ) {
          if (loopSafety++ > 365 * 20) break; // Safety break for long assignments
          if (d >= weekStartDate && d <= weekEndDate) {
            const dayStr = d.toISOString().split('T')[0];
            if (weeklyPlanning[dayStr]) {
              let title = 'Assignation Projet/Étape';
              if (assign.projects) {
                title = `Projet: ${assign.projects.name} (${assign.projects.reference})`;
                if (assign.project_stages) {
                  title = `Étape: ${assign.project_stages.name} (${assign.projects.reference})`;
                }
              }
              // Pour la vue hebdo, on continue d'afficher comme "allDay" pour le jour donné,
              // mais on fournit les vraies dates start/end de l'assignation pour info.
              weeklyPlanning[dayStr].push({
                type: 'assignment',
                id: `assign-${assign.id}`,
                title,
                // Heures affichées pour la journée dans la vue semaine
                startTime: d.toISOString().split('T')[0] + 'T00:00:00.000Z',
                endTime: d.toISOString().split('T')[0] + 'T23:59:59.999Z',
                allDay: true,
                // Vraies heures de début/fin de l'assignation complète
                actualStartTime: assign.start_date.toISOString(),
                actualEndTime: assign.end_date?.toISOString() ?? null,
                project: assign.projects,
                stage: assign.project_stages,
                role: assign.role_description,
              });
            }
          }
          // Condition de sortie si l'assignation se termine ce jour-là (et a une date de fin)
          if (
            assign.end_date &&
            d.getUTCFullYear() === assignEnd.getUTCFullYear() &&
            d.getUTCMonth() === assignEnd.getUTCMonth() &&
            d.getUTCDate() === assignEnd.getUTCDate()
          ) {
            break;
          }
          // Condition de sortie si on dépasse la date de fin de semaine (important pour assignations sans fin)
          if (d > weekEndDate) {
            break;
          }
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
          project_stages: true, // Inclure aussi les détails de l'étape directement si possible
        },
        orderBy: {
          start_date: 'asc',
        },
      });

      this.logger.log(
        `Trouvé ${events.length} événements pour l'employé ${staffId}`,
      );

      // Simplification : On retourne directement les événements avec les détails inclus par Prisma
      // L'enrichissement via microservice devient moins nécessaire si Prisma inclut déjà ce qu'il faut
      return events;

      /* Code d'enrichissement précédent (commenté pour simplification)
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
      const projectsMap = new Map<number, any>();
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
      const stagesMap = new Map<number, any>();

      if (stageIds.length > 0) {
        const uniqueStageIds = [...new Set(stageIds)];
        this.logger.log(
          `Récupération des détails pour ${uniqueStageIds.length} étapes uniques: ${JSON.stringify(uniqueStageIds)}`,
        );

         try {
           // Tenter de récupérer via microservice en premier
           const stagesPromises = uniqueStageIds.map((id) =>
             firstValueFrom(
               this.projectsClient.send({ cmd: 'get_stage_by_id' }, { id }),
             ).catch((err) => {
               this.logger.warn(
                 `Erreur lors de la récupération de l'étape ${id} via microservice: ${err}, fallback vers Prisma`,
               );
               return null; // Retourner null en cas d'échec pour essayer Prisma ensuite
             }),
           );

           const stagesDetailsList = await Promise.all(stagesPromises);
           let stagesFromMicroservice = 0;
           const stagesToFetchFromPrisma: number[] = [];

           stagesDetailsList.forEach((stage, index) => {
             if (stage) {
               stagesMap.set(stage.id, stage);
               stagesFromMicroservice++;
             } else {
               // Si le microservice a échoué, ajouter l'ID pour le fetch Prisma
               stagesToFetchFromPrisma.push(uniqueStageIds[index]);
             }
           });
           this.logger.log(`Récupéré ${stagesFromMicroservice} étapes depuis le microservice`);

           // Récupérer les étapes restantes directement depuis Prisma
           if (stagesToFetchFromPrisma.length > 0) {
               this.logger.log(`Tentative de récupération de ${stagesToFetchFromPrisma.length} étape(s) depuis Prisma`);
               const stagesFromPrisma = await this.prisma.project_stages.findMany({
                 where: { id: { in: stagesToFetchFromPrisma } },
               });
               stagesFromPrisma.forEach((stage) => {
                 stagesMap.set(stage.id, stage);
               });
               this.logger.log(`Récupéré ${stagesFromPrisma.length} étape(s) supplémentaire(s) depuis Prisma`);
           }

         } catch (err) {
           this.logger.error(
             `Erreur majeure lors de la récupération des étapes: ${err}`,
           );
         }
      }


      // Enrichir chaque événement avec les détails
      const enrichedEvents = events.map((event) => {
        const enrichedEvent: any = { ...event };

        // Ajouter les détails du projet si disponibles
        if (event.project_id && projectsMap.has(event.project_id)) {
          enrichedEvent.project = projectsMap.get(event.project_id);
        } else if (event.projects) { // Utiliser les données incluses par Prisma si dispo
            enrichedEvent.project = event.projects;
        }


        // Ajouter les détails de l'étape si disponibles
        if (event.stage_id && stagesMap.has(event.stage_id)) {
          const stageDetails = stagesMap.get(event.stage_id);
           this.logger.debug(
            `Ajout des détails de l'étape ${event.stage_id} à l'événement ${event.id}`,
           );
          enrichedEvent.stage = stageDetails;
        } else if (event.project_stages) { // Utiliser les données incluses par Prisma si dispo
             enrichedEvent.stage = event.project_stages;
        }


        return enrichedEvent;
      });

      this.logger.log(`Retour de ${enrichedEvents.length} événements enrichis`);
      return enrichedEvents;
      */
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
      `Assignation de l'employé ${assignmentData.staffId} au projet ${assignmentData.projectId}${assignmentData.stageId ? ` (Étape ${assignmentData.stageId})` : ''}`,
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

      // Vérifier si une assignation similaire (même staff, même projet, même étape si fournie) existe déjà
      const existingAssignment = await this.prisma.project_staff.findFirst({
        where: {
          staff_id: assignmentData.staffId,
          project_id: assignmentData.projectId,
          // Comparer stage_id seulement s'il est fourni, sinon comparer avec null
          stage_id:
            assignmentData.stageId === undefined
              ? null
              : assignmentData.stageId,
        },
      });

      if (existingAssignment) {
        this.logger.warn(
          `Une assignation similaire existe déjà (ID: ${existingAssignment.id}) pour le staff ${assignmentData.staffId} sur le projet ${assignmentData.projectId}${assignmentData.stageId ? ` et l'étape ${assignmentData.stageId}` : ''}. Mise à jour envisagée ou doublon évité.`,
        );
        // Optionnel : Mettre à jour l'existant au lieu de créer ? Ou retourner une erreur ?
        // Pour l'instant, on log un avertissement et on continue (crée un doublon potentiel si stageId est géré différemment)
        // throw new Error(`Une assignation existe déjà pour cet employé sur ce projet/étape.`);
      }

      // Créer l'assignation
      const newAssignment = await this.prisma.project_staff.create({
        data: {
          project_id: assignmentData.projectId,
          staff_id: assignmentData.staffId,
          stage_id: assignmentData.stageId || null,
          role_description: assignmentData.roleDescription || null,
          start_date: new Date(assignmentData.startDate),
          // Gérer la date de fin : si vide/null, stocker null, sinon convertir en Date
          end_date:
            assignmentData.endDate && assignmentData.endDate.length > 0
              ? new Date(assignmentData.endDate)
              : null,
          // Gérer les heures : si vide/null/0, stocker null, sinon convertir en nombre
          hours_planned:
            assignmentData.hoursPlanned &&
            !isNaN(Number(assignmentData.hoursPlanned)) &&
            Number(assignmentData.hoursPlanned) > 0
              ? Number(assignmentData.hoursPlanned)
              : null,
        },
        include: {
          projects: true,
          staff: true,
          project_stages: true, // Inclure aussi l'étape
        },
      });

      this.logger.log(
        `Employé ${assignmentData.staffId} assigné avec succès (ID: ${newAssignment.id}) au projet ${assignmentData.projectId}${newAssignment.stage_id ? ` (Étape ${newAssignment.stage_id})` : ''}`,
      );
      return newAssignment;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'assignation de l'employé ${assignmentData.staffId} au projet ${assignmentData.projectId}`,
        error instanceof Error ? error.message : error,
      );
      // Renvoyer une erreur spécifique ou générique selon le besoin
      throw error; // Laisser l'appelant gérer l'erreur (e.g., API Gateway)
    }
  }

  async updateStaffAssignment(updateData: {
    id: number;
    roleDescription?: string;
    startDate?: string;
    endDate?: string | null; // Permettre null pour supprimer la date de fin
    hoursPlanned?: number | null; // Permettre null
    hoursWorked?: number | null; // Permettre null
    stageId?: number | null; // Permettre null pour désassigner d'une étape spécifique
  }): Promise<any> {
    this.logger.log(`Mise à jour de l'assignation ${updateData.id}`);

    try {
      // Vérifier que l'assignation existe
      const assignmentExists = await this.prisma.project_staff.findUnique({
        where: { id: updateData.id },
        include: { projects: true }, // Inclure le projet pour vérifier l'appartenance de l'étape
      });

      if (!assignmentExists) {
        throw new NotFoundException(
          `Assignation avec ID ${updateData.id} non trouvée`,
        );
      }

      // Préparer l'objet de données pour la mise à jour
      const dataToUpdate: Partial<{
        role_description: string | null;
        start_date: Date;
        end_date: Date | null;
        hours_planned: number | null;
        hours_worked: number | null;
        stage_id: number | null;
      }> = {};

      // Ajouter les champs seulement s'ils sont définis dans updateData
      if (updateData.roleDescription !== undefined) {
        dataToUpdate.role_description = updateData.roleDescription || null;
      }
      if (updateData.startDate !== undefined) {
        dataToUpdate.start_date = new Date(updateData.startDate);
      }
      // Gérer la mise à jour de end_date (peut être une date ou null)
      if (updateData.endDate !== undefined) {
        dataToUpdate.end_date = updateData.endDate
          ? new Date(updateData.endDate)
          : null;
      }
      // Gérer la mise à jour des heures (peut être un nombre ou null)
      if (updateData.hoursPlanned !== undefined) {
        dataToUpdate.hours_planned =
          updateData.hoursPlanned &&
          !isNaN(Number(updateData.hoursPlanned)) &&
          Number(updateData.hoursPlanned) > 0
            ? Number(updateData.hoursPlanned)
            : null;
      }
      if (updateData.hoursWorked !== undefined) {
        dataToUpdate.hours_worked =
          updateData.hoursWorked && !isNaN(Number(updateData.hoursWorked))
            ? Number(updateData.hoursWorked)
            : null;
      }

      // Gérer la mise à jour de stageId (peut être un ID ou null)
      if (updateData.stageId !== undefined) {
        if (updateData.stageId === null) {
          // Si on met stageId à null, pas besoin de vérifier l'étape
          dataToUpdate.stage_id = null;
        } else {
          // Si on assigne à une nouvelle étape, vérifier qu'elle existe et appartient au bon projet
          const stageExists = await this.prisma.project_stages.findUnique({
            where: { id: updateData.stageId },
          });

          if (!stageExists) {
            throw new NotFoundException(
              `Étape avec ID ${updateData.stageId} non trouvée`,
            );
          }
          // Utiliser assignmentExists.project_id qui vient de l'include
          if (stageExists.project_id !== assignmentExists.project_id) {
            throw new Error(
              `L'étape ${updateData.stageId} n'appartient pas au projet ${assignmentExists.project_id}`,
            );
          }
          dataToUpdate.stage_id = updateData.stageId;
        }
      }

      // Mettre à jour l'assignation si dataToUpdate n'est pas vide
      if (Object.keys(dataToUpdate).length === 0) {
        this.logger.warn(
          `Aucune donnée à mettre à jour pour l'assignation ${updateData.id}.`,
        );
        return assignmentExists; // Retourner l'assignation existante sans modification
      }

      const updatedAssignment = await this.prisma.project_staff.update({
        where: { id: updateData.id },
        data: dataToUpdate,
        include: {
          projects: true,
          staff: true,
          project_stages: true,
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
        // Ne pas jeter d'erreur si elle n'existe pas, juste retourner false ou log
        this.logger.warn(
          `Tentative de suppression de l'assignation ${assignmentId} qui n'existe pas.`,
        );
        // throw new NotFoundException(`Assignation avec ID ${assignmentId} non trouvée`);
        return false; // Indiquer que la suppression n'a pas eu lieu
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
      throw error; // Propager l'erreur pour gestion centralisée
    }
  }

  async debugStaffAssignments(staffId: number): Promise<any> {
    this.logger.log(`Diagnostic des assignations pour l'employé ${staffId}`);

    try {
      // Vérification directe de la présence d'assignations
      const rawResult = await this.prisma.$queryRaw<
        [{ count: string }]
      >`SELECT COUNT(*)::text as count FROM project_staff WHERE staff_id = ${staffId}`;
      const count = parseInt(rawResult[0].count, 10);

      // Récupération des données brutes de project_staff et conversion des nombres
      const rawAssignments = await this.prisma.$queryRaw<
        RawAssignmentDebugInfo[]
      >`
        SELECT
          ps.id::text as id,
          ps.project_id::text as project_id,
          ps.staff_id::text as staff_id,
          ps.stage_id::text as stage_id,
          ps.role_description,
          ps.start_date,
          ps.end_date,
          ps.hours_planned::text as hours_planned,
          ps.hours_worked::text as hours_worked,
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

      // État des tables impliquées avec conversion pour éviter BigInt
      const tableStats = {
        project_staff: Number(await this.prisma.project_staff.count()),
        staff: Number(
          await this.prisma.staff.count({
            where: { id: staffId },
          }),
        ),
        projects: Number(await this.prisma.projects.count()),
        project_stages: Number(await this.prisma.project_stages.count()),
      };

      // Vérifier si les assignations sont correctes
      const assignmentValidation = rawAssignments.map(
        (assignment: RawAssignmentDebugInfo) => {
          return {
            id: assignment.id,
            isValid: !!assignment.project_name && !!assignment.staff_name,
            hasStage: !!assignment.stage_name,
            projectExists: !!assignment.project_name,
            staffExists: !!assignment.staff_name,
          };
        },
      );

      // Récupérer les informations du staff de façon sécurisée
      const staffInfo = await this.prisma.staff.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          email: true,
          role_id: true,
        },
      });

      // Retourner le diagnostic complet
      return {
        count,
        rawAssignments,
        tableStats,
        assignmentValidation,
        staff: staffInfo,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors du diagnostic des assignations pour le staff ${staffId}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(
        `Erreur de diagnostic pour le staff ${staffId}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      );
    }
  }
}
