import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  CreateClientDto,
  CreateClientWithAddressDto,
  UpdateClientDto,
} from './interfaces/client.interface';
import {
  Address,
  CreateAddressDto,
  UpdateAddressDto,
  ClientAddress,
  CreateClientAddressDto,
  UpdateClientAddressDto,
  ProjectAddress,
  CreateProjectAddressDto,
  UpdateProjectAddressDto,
  AddressType,
} from './interfaces/address.interface';
import { GeocodingResponse } from './interfaces/geocoding.interface';
import { PrismaService } from './prisma/prisma.service';

// Interface pour les réponses de l'API Nominatim
interface NominatimResponse {
  lat: string;
  lon: string;
  display_name?: string;
  class?: string;
  type?: string;
  importance?: number;
}

// Fonction utilitaire pour convertir AddressType en address_type de Prisma
function convertAddressType(addressType: AddressType): any {
  if (addressType === AddressType.SIEGE_SOCIAL) {
    return 'si_ge_social'; // Conversion spéciale pour siège_social
  }
  return addressType.toLowerCase();
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private prisma: PrismaService) {}

  // Clients API
  async getAllClients(data?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
    typeFilter?: string;
    cityFilter?: string;
    statusFilter?: string;
    lastOrderFilter?: string;
  }): Promise<Client[]> {
    type WhereCondition = {
      OR?: any[];
      AND?: any[];
      company_name?: string | { not: string | null };
      status?: any;
      addresses?: any;
      last_order_date?: any;
    };

    const whereConditions: WhereCondition = {};

    // Filtrage par recherche textuelle
    if (data?.searchQuery) {
      whereConditions.OR = [
        { firstname: { contains: data.searchQuery, mode: 'insensitive' } },
        { lastname: { contains: data.searchQuery, mode: 'insensitive' } },
        { email: { contains: data.searchQuery, mode: 'insensitive' } },
        { phone: { contains: data.searchQuery, mode: 'insensitive' } },
        { mobile: { contains: data.searchQuery, mode: 'insensitive' } },
        { company_name: { contains: data.searchQuery, mode: 'insensitive' } },
      ];
    }

    // Filtrage par type de client (particulier/entreprise)
    if (data?.typeFilter) {
      if (data.typeFilter === 'Particulier') {
        whereConditions.company_name = 'Particulier';
      } else if (data.typeFilter === 'Entreprise') {
        whereConditions.AND = whereConditions.AND || [];
        whereConditions.AND.push({
          company_name: {
            not: 'Particulier',
          },
        });
        whereConditions.AND.push({
          company_name: {
            not: null,
          },
        });
      }
    }

    // Filtrage par statut
    if (data?.statusFilter) {
      let statusValue = '';

      if (data.statusFilter === 'Actif') {
        statusValue = 'active';
      } else if (data.statusFilter === 'Inactif') {
        statusValue = 'inactive';
      } else if (data.statusFilter === 'Prospect') {
        statusValue = 'prospect';
      }

      if (statusValue) {
        whereConditions.OR = whereConditions.OR || [];
        whereConditions.OR.push(
          { status: { equals: statusValue, mode: 'insensitive' } },
          { status: { equals: data.statusFilter, mode: 'insensitive' } },
        );
      }
    }

    // Filtrage par ville
    if (data?.cityFilter) {
      whereConditions.addresses = {
        city: { equals: data.cityFilter, mode: 'insensitive' },
      };
    }

    // Filtrage par commandes
    if (data?.lastOrderFilter) {
      // Cette partie nécessitera une extension du modèle de données pour stocker
      // les informations relatives aux commandes, ou une jointure avec une table
      // commandes, si disponible dans le schéma Prisma
      if (data.lastOrderFilter === 'Avec commandes') {
        whereConditions.last_order_date = {
          not: null,
        };
      } else if (data.lastOrderFilter === 'Sans commande') {
        whereConditions.last_order_date = null;
      } else if (data.lastOrderFilter === 'Récentes') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        whereConditions.last_order_date = {
          gte: threeMonthsAgo,
        };
      }
    }

    const dbClients = await this.prisma.clients.findMany({
      where: whereConditions,
      include: {
        addresses: true,
      },
      orderBy: [{ lastname: 'asc' }, { firstname: 'asc' }],
      skip: data?.offset || 0,
      take: data?.limit || undefined,
    });
    return dbClients as Client[];
  }

  async getClientById(id: number): Promise<Client | null> {
    const dbClient = await this.prisma.clients.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });
    return dbClient as Client | null;
  }

  async createClient(clientDto: CreateClientDto): Promise<Client> {
    // Validation des champs requis
    if (!clientDto.firstname || !clientDto.lastname || !clientDto.email) {
      throw new Error('Les champs firstname, lastname et email sont requis');
    }

    const dbClient = await this.prisma.clients.create({
      data: {
        firstname: clientDto.firstname,
        lastname: clientDto.lastname,
        email: clientDto.email,
        company_name: clientDto.company_name,
        phone: clientDto.phone,
        mobile: clientDto.mobile,
        address_id: clientDto.address_id,
        siret: clientDto.siret,
        notes: clientDto.notes,
      },
      include: {
        addresses: true,
      },
    });
    return dbClient as Client;
  }

  async updateClient(
    id: number,
    clientDto: UpdateClientDto,
  ): Promise<Client | null> {
    try {
      const dbClient = await this.prisma.clients.update({
        where: { id },
        data: {
          ...clientDto,
        },
      });
      return dbClient as Client;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour du client ${id}:`,
        error,
      );
      return null;
    }
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      await this.prisma.clients.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du client ${id}:`,
        error,
      );
      return false;
    }
  }

  // Addresses API
  async getAddressesByClientId(clientId: number): Promise<Address[]> {
    try {
      // Vérifier d'abord s'il existe des adresses dans la nouvelle table de liaison
      const clientAddresses = await this.prisma.client_addresses.findMany({
        where: { client_id: clientId },
        include: { addresses: true },
      });

      if (clientAddresses && clientAddresses.length > 0) {
        // Retourner les adresses de la nouvelle table de liaison
        return clientAddresses.map(ca => ca.addresses) as Address[];
      }

      // Fallback: Vérifier l'adresse dans l'ancien champ address_id
      const client = await this.prisma.clients.findUnique({
        where: { id: clientId },
      });

      if (!client || !client.address_id) return [];

      const address = await this.prisma.addresses.findUnique({
        where: { id: client.address_id },
      });

      return address ? [address as Address] : [];
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des adresses pour le client ${clientId}:`,
        error,
      );
      return [];
    }
  }

  async getAddressById(id: number): Promise<Address | null> {
    const dbAddress = await this.prisma.addresses.findUnique({
      where: { id },
    });
    return dbAddress as Address | null;
  }

  async createAddress(
    clientId: number,
    addressDto: CreateAddressDto,
  ): Promise<Address | null> {
    const client = await this.prisma.clients.findUnique({
      where: { id: clientId },
    });

    if (!client) return null;

    try {
      return this.prisma.$transaction(async (tx) => {
        // Créer une nouvelle adresse
        const newAddress = await tx.addresses.create({
          data: {
            ...addressDto,
          },
        });

        // Mettre à jour le client avec la nouvelle adresse
        await tx.clients.update({
          where: { id: clientId },
          data: {
            address_id: newAddress.id,
          },
        });

        return newAddress as Address;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création d'adresse pour client ${clientId}:`,
        error,
      );
      return null;
    }
  }

  async updateAddress(
    id: number,
    addressDto: UpdateAddressDto,
  ): Promise<Address | null> {
    try {
      const dbAddress = await this.prisma.addresses.update({
        where: { id },
        data: {
          ...addressDto,
        },
      });
      return dbAddress as Address;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de l'adresse ${id}:`,
        error,
      );
      return null;
    }
  }

  async deleteAddress(id: number): Promise<boolean> {
    try {
      // Trouver tous les clients qui utilisent cette adresse
      const clients = await this.prisma.clients.findMany({
        where: { address_id: id },
      });

      // Transaction pour supprimer l'adresse et mettre à jour les clients
      await this.prisma.$transaction(async (tx) => {
        // Mettre à jour les clients pour retirer la référence à l'adresse
        for (const client of clients) {
          await tx.clients.update({
            where: { id: client.id },
            data: {
              address_id: null,
            },
          });
        }

        // Supprimer l'adresse
        await tx.addresses.delete({
          where: { id },
        });
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de l'adresse ${id}:`,
        error,
      );
      return false;
    }
  }

  // Client-Addresses API (nouvelles méthodes)
  async getClientAddresses(clientId: number): Promise<ClientAddress[]> {
    try {
      const clientAddresses = await this.prisma.client_addresses.findMany({
        where: { client_id: clientId },
        include: { addresses: true },
      });
      return clientAddresses as ClientAddress[];
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des associations client-adresse pour le client ${clientId}:`,
        error,
      );
      return [];
    }
  }

  async getClientAddressById(id: number): Promise<ClientAddress | null> {
    try {
      const clientAddress = await this.prisma.client_addresses.findUnique({
        where: { id },
        include: { addresses: true },
      });
      return clientAddress as ClientAddress | null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération de l'association client-adresse ${id}:`,
        error,
      );
      return null;
    }
  }

  async createClientAddress(data: CreateClientAddressDto): Promise<ClientAddress | null> {
    try {
      return this.prisma.$transaction(async (tx) => {
        let addressId = data.address_id;

        // Si une nouvelle adresse est fournie, la créer d'abord
        if (!addressId && data.address) {
          const newAddress = await tx.addresses.create({
            data: data.address,
          });
          addressId = newAddress.id;
        }

        if (!addressId) {
          throw new Error('Aucune adresse spécifiée');
        }

        // Vérifier si l'adresse est définie comme par défaut
        if (data.is_default) {
          // Mettre à jour toutes les autres adresses du client pour qu'elles ne soient plus par défaut
          await tx.client_addresses.updateMany({
            where: {
              client_id: data.client_id,
              is_default: true,
            },
            data: {
              is_default: false,
            },
          });
        }

        // Créer l'association
        const clientAddress = await tx.client_addresses.create({
          data: {
            client_id: data.client_id,
            address_id: addressId,
            address_type: convertAddressType(data.address_type),
            is_default: data.is_default || false,
            notes: data.notes,
          },
          include: {
            addresses: true,
          },
        });

        return clientAddress as ClientAddress;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de l'association client-adresse:`,
        error,
      );
      return null;
    }
  }

  async updateClientAddress(id: number, data: UpdateClientAddressDto): Promise<ClientAddress | null> {
    try {
      return this.prisma.$transaction(async (tx) => {
        // Récupérer d'abord l'association
        const currentAssociation = await tx.client_addresses.findUnique({
          where: { id },
        });

        if (!currentAssociation) {
          throw new Error(`Association client-adresse ${id} non trouvée`);
        }

        // Vérifier si l'adresse est définie comme par défaut
        if (data.is_default) {
          // Mettre à jour toutes les autres adresses du client pour qu'elles ne soient plus par défaut
          await tx.client_addresses.updateMany({
            where: {
              client_id: currentAssociation.client_id,
              is_default: true,
              id: { not: id },
            },
            data: {
              is_default: false,
            },
          });
        }

        // Mettre à jour l'association
        const updatedAssociation = await tx.client_addresses.update({
          where: { id },
          data: {
            address_type: data.address_type ? convertAddressType(data.address_type) : undefined,
            is_default: data.is_default,
            notes: data.notes,
          },
          include: {
            addresses: true,
          },
        });

        return updatedAssociation as ClientAddress;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de l'association client-adresse ${id}:`,
        error,
      );
      return null;
    }
  }

  async deleteClientAddress(id: number): Promise<boolean> {
    try {
      await this.prisma.client_addresses.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de l'association client-adresse ${id}:`,
        error,
      );
      return false;
    }
  }

  async setDefaultClientAddress(clientId: number, addressAssociationId: number): Promise<boolean> {
    try {
      return this.prisma.$transaction(async (tx) => {
        // Vérifier si l'association existe
        const association = await tx.client_addresses.findFirst({
          where: {
            id: addressAssociationId,
            client_id: clientId,
          },
        });

        if (!association) {
          throw new Error(`Association client-adresse ${addressAssociationId} non trouvée pour le client ${clientId}`);
        }

        // Mettre à jour toutes les adresses du client pour qu'elles ne soient plus par défaut
        await tx.client_addresses.updateMany({
          where: {
            client_id: clientId,
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });

        // Définir l'adresse comme par défaut
        await tx.client_addresses.update({
          where: { id: addressAssociationId },
          data: {
            is_default: true,
          },
        });

        // Mettre également à jour le champ address_id du client pour la rétrocompatibilité
        const addressId = association.address_id;
        await tx.clients.update({
          where: { id: clientId },
          data: {
            address_id: addressId,
          },
        });

        return true;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la définition de l'adresse par défaut pour le client ${clientId}:`,
        error,
      );
      return false;
    }
  }

  // Project-Addresses API
  async getProjectAddresses(projectId: number): Promise<ProjectAddress[]> {
    try {
      const projectAddresses = await this.prisma.project_addresses.findMany({
        where: { project_id: projectId },
        include: { addresses: true },
      });
      return projectAddresses as ProjectAddress[];
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des associations projet-adresse pour le projet ${projectId}:`,
        error,
      );
      return [];
    }
  }

  async getProjectAddressById(id: number): Promise<ProjectAddress | null> {
    try {
      const projectAddress = await this.prisma.project_addresses.findUnique({
        where: { id },
        include: { addresses: true },
      });
      return projectAddress as ProjectAddress | null;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération de l'association projet-adresse ${id}:`,
        error,
      );
      return null;
    }
  }

  async createProjectAddress(data: CreateProjectAddressDto): Promise<ProjectAddress | null> {
    try {
      return this.prisma.$transaction(async (tx) => {
        let addressId = data.address_id;

        // Si une nouvelle adresse est fournie, la créer d'abord
        if (!addressId && data.address) {
          const newAddress = await tx.addresses.create({
            data: data.address,
          });
          addressId = newAddress.id;
        }

        if (!addressId) {
          throw new Error('Aucune adresse spécifiée');
        }

        // Vérifier si l'adresse est définie comme par défaut
        if (data.is_default) {
          // Mettre à jour toutes les autres adresses du projet pour qu'elles ne soient plus par défaut
          await tx.project_addresses.updateMany({
            where: {
              project_id: data.project_id,
              is_default: true,
            },
            data: {
              is_default: false,
            },
          });
        }

        // Créer l'association
        const projectAddress = await tx.project_addresses.create({
          data: {
            project_id: data.project_id,
            address_id: addressId,
            address_type: convertAddressType(data.address_type),
            is_default: data.is_default || false,
            notes: data.notes,
          },
          include: {
            addresses: true,
          },
        });

        return projectAddress as ProjectAddress;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création de l'association projet-adresse:`,
        error,
      );
      return null;
    }
  }

  async updateProjectAddress(id: number, data: UpdateProjectAddressDto): Promise<ProjectAddress | null> {
    try {
      return this.prisma.$transaction(async (tx) => {
        // Récupérer d'abord l'association
        const currentAssociation = await tx.project_addresses.findUnique({
          where: { id },
        });

        if (!currentAssociation) {
          throw new Error(`Association projet-adresse ${id} non trouvée`);
        }

        // Vérifier si l'adresse est définie comme par défaut
        if (data.is_default) {
          // Mettre à jour toutes les autres adresses du projet pour qu'elles ne soient plus par défaut
          await tx.project_addresses.updateMany({
            where: {
              project_id: currentAssociation.project_id,
              is_default: true,
              id: { not: id },
            },
            data: {
              is_default: false,
            },
          });
        }

        // Mettre à jour l'association
        const updatedAssociation = await tx.project_addresses.update({
          where: { id },
          data: {
            address_type: data.address_type ? convertAddressType(data.address_type) : undefined,
            is_default: data.is_default,
            notes: data.notes,
          },
          include: {
            addresses: true,
          },
        });

        return updatedAssociation as ProjectAddress;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la mise à jour de l'association projet-adresse ${id}:`,
        error,
      );
      return null;
    }
  }

  async deleteProjectAddress(id: number): Promise<boolean> {
    try {
      await this.prisma.project_addresses.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression de l'association projet-adresse ${id}:`,
        error,
      );
      return false;
    }
  }

  async setDefaultProjectAddress(projectId: number, addressAssociationId: number): Promise<boolean> {
    try {
      return this.prisma.$transaction(async (tx) => {
        // Vérifier si l'association existe
        const association = await tx.project_addresses.findFirst({
          where: {
            id: addressAssociationId,
            project_id: projectId,
          },
        });

        if (!association) {
          throw new Error(`Association projet-adresse ${addressAssociationId} non trouvée pour le projet ${projectId}`);
        }

        // Mettre à jour toutes les adresses du projet pour qu'elles ne soient plus par défaut
        await tx.project_addresses.updateMany({
          where: {
            project_id: projectId,
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });

        // Définir l'adresse comme par défaut
        await tx.project_addresses.update({
          where: { id: addressAssociationId },
          data: {
            is_default: true,
          },
        });

        // Mettre également à jour le champ address_id du projet pour la rétrocompatibilité
        const addressId = association.address_id;
        await tx.projects.update({
          where: { id: projectId },
          data: {
            address_id: addressId,
          },
        });

        return true;
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la définition de l'adresse par défaut pour le projet ${projectId}:`,
        error,
      );
      return false;
    }
  }

  // Geocoding API
  async geocodeAddress(address: string): Promise<GeocodingResponse> {
    try {
      this.logger.log(`Géocodage de l'adresse: ${address}`);
      const encodedAddress = encodeURIComponent(address);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'ClientsServiceApp/1.0',
            'Accept-Language': 'fr',
          },
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Erreur HTTP lors du géocodage: ${response.statusText}`,
        );
        return {
          latitude: 0,
          longitude: 0,
          address,
          success: false,
          error: `Erreur HTTP: ${response.statusText}`,
        };
      }

      const geocodeResponse = (await response.json()) as NominatimResponse[];

      if (
        geocodeResponse.length > 0 &&
        geocodeResponse[0].lat &&
        geocodeResponse[0].lon
      ) {
        const latitude = parseFloat(geocodeResponse[0].lat);
        const longitude = parseFloat(geocodeResponse[0].lon);

        if (!isNaN(latitude) && !isNaN(longitude)) {
          this.logger.log(
            `Coordonnées trouvées: Lat=${latitude}, Lon=${longitude}`,
          );
          return {
            latitude,
            longitude,
            address,
            success: true,
          };
        }
      }

      this.logger.warn(`Aucune coordonnée trouvée pour l'adresse: ${address}`);
      return {
        latitude: 0,
        longitude: 0,
        address,
        success: false,
        error: 'Aucune coordonnée trouvée pour cette adresse',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Erreur lors du géocodage de l'adresse: ${address}`,
        error,
      );
      return {
        latitude: 0,
        longitude: 0,
        address,
        success: false,
        error: `Erreur: ${errorMessage}`,
      };
    }
  }

  async updateAddressCoordinates(
    addressId: number,
  ): Promise<GeocodingResponse> {
    try {
      // Récupérer l'adresse
      const address = await this.prisma.addresses.findUnique({
        where: { id: addressId },
      });

      if (!address) {
        this.logger.warn(`Adresse avec ID ${addressId} non trouvée`);
        return {
          latitude: 0,
          longitude: 0,
          address: '',
          success: false,
          error: `Adresse avec ID ${addressId} non trouvée`,
        };
      }

      // Construire l'adresse complète
      const addressParts = [
        address.street_number,
        address.street_name,
        address.additional_address,
        address.zip_code,
        address.city,
        address.country,
      ].filter(Boolean);

      const fullAddress = addressParts.join(', ');

      // Appeler le géocodage
      const geocodeResult = await this.geocodeAddress(fullAddress);

      if (geocodeResult.success) {
        // Mettre à jour les coordonnées dans la base de données
        await this.prisma.addresses.update({
          where: { id: addressId },
          data: {
            latitude: geocodeResult.latitude,
            longitude: geocodeResult.longitude,
          },
        });

        this.logger.log(
          `Coordonnées mises à jour pour l'adresse ${addressId}: Lat=${geocodeResult.latitude}, Lon=${geocodeResult.longitude}`,
        );
      }

      return {
        ...geocodeResult,
        address: fullAddress,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        `Erreur lors de la mise à jour des coordonnées pour l'adresse ${addressId}`,
        error,
      );
      return {
        latitude: 0,
        longitude: 0,
        address: '',
        success: false,
        error: `Erreur: ${errorMessage}`,
      };
    }
  }

  async updateAllAddressesCoordinates(): Promise<{
    totalAddresses: number;
    updatedAddresses: number;
    failedAddresses: number;
    failedAddressDetails: Array<{
      id: number;
      address: string;
      error?: string;
    }>;
  }> {
    const failedAddressDetails: Array<{
      id: number;
      address: string;
      error?: string;
    }> = [];
    let updatedAddresses = 0;

    try {
      const addresses = await this.prisma.addresses.findMany();
      const totalAddresses = addresses.length;

      this.logger.log(
        `Début de la mise à jour des coordonnées pour ${totalAddresses} adresses`,
      );

      for (const address of addresses) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const result = await this.updateAddressCoordinates(address.id);

          if (result.success) {
            updatedAddresses++;
          } else {
            failedAddressDetails.push({
              id: address.id,
              address: result.address,
              error: result.error,
            });
          }
        } catch (addressError: unknown) {
          const errorMessage =
            addressError instanceof Error
              ? addressError.message
              : String(addressError);

          failedAddressDetails.push({
            id: address.id,
            address: [
              address.street_number,
              address.street_name,
              address.additional_address,
              address.zip_code,
              address.city,
              address.country,
            ]
              .filter(Boolean)
              .join(', '),
            error: errorMessage,
          });
        }
      }

      this.logger.log(
        `Mise à jour terminée: ${updatedAddresses}/${totalAddresses} adresses mises à jour avec succès`,
      );

      return {
        totalAddresses,
        updatedAddresses,
        failedAddresses: failedAddressDetails.length,
        failedAddressDetails,
      };
    } catch (error: unknown) {
      this.logger.error(
        'Erreur lors de la mise à jour de toutes les adresses',
        error,
      );
      throw error;
    }
  }

  async createClientWithAddress(
    clientWithAddressDto: CreateClientWithAddressDto,
  ): Promise<Client> {
    const { address, ...clientData } = clientWithAddressDto;

    try {
      this.logger.log(
        `Tentative de création d'un client avec adresse: ${JSON.stringify(clientWithAddressDto)}`,
      );

      // Log détaillé pour débogage
      this.logger.log(`Données d'adresse reçues: ${JSON.stringify(address)}`);

      // Vérifier si l'adresse contient un ID explicite
      if ('id' in address) {
        this.logger.warn(
          `L'adresse contient un ID explicite: ${(address as { id: number | string }).id}`,
        );
      }

      return await this.prisma.$transaction(async (tx) => {
        try {
          // Créer l'adresse en spécifiant uniquement les champs autorisés
          const addressData = {
            street_number: address.street_number,
            street_name: address.street_name,
            additional_address: address.additional_address,
            zip_code: address.zip_code,
            city: address.city,
            country: address.country || 'France',
          };

          this.logger.log(
            `Création de l'adresse: ${JSON.stringify(addressData)}`,
          );

          // Tentative de création de l'adresse
          let newAddress: { id: number };
          try {
            newAddress = (await tx.addresses.create({
              data: addressData,
            })) as { id: number };
            this.logger.log(`Adresse créée avec l'ID: ${newAddress.id}`);
          } catch (addressError) {
            this.logger.error(
              `Erreur lors de la création de l'adresse: ${JSON.stringify(addressError)}`,
            );
            throw addressError;
          }

          // Créer le client avec l'ID de l'adresse
          const clientDataWithAddress = {
            ...clientData,
            firstname: clientData.firstname || '',
            lastname: clientData.lastname || '',
            address_id: newAddress.id,
          };
          this.logger.log(
            `Création du client avec les données: ${JSON.stringify(clientDataWithAddress)}`,
          );

          const newClient = await tx.clients.create({
            data: clientDataWithAddress,
            include: {
              addresses: true,
            },
          });
          this.logger.log(
            `Client créé avec succès: ${JSON.stringify(newClient)}`,
          );

          return newClient as Client;
        } catch (txError) {
          this.logger.error(
            `Erreur de transaction: ${JSON.stringify(txError)}`,
          );
          throw txError;
        }
      });
    } catch (error) {
      this.logger.error(
        `Erreur lors de la création du client avec adresse:`,
        error,
      );
      throw error;
    }
  }
}
