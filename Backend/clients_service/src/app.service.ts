import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
} from './interfaces/client.interface';
import {
  Address,
  CreateAddressDto,
  UpdateAddressDto,
} from './interfaces/address.interface';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private prisma: PrismaService) {}

  // Clients API
  async getAllClients(
    limit?: number,
    offset?: number,
    searchQuery?: string,
  ): Promise<Client[]> {
    const dbClients = await this.prisma.clients.findMany({
      where: searchQuery
        ? {
            OR: [
              { firstname: { contains: searchQuery } },
              { lastname: { contains: searchQuery } },
              { email: { contains: searchQuery } },
              { phone: { contains: searchQuery } },
              { company_name: { contains: searchQuery } },
            ],
          }
        : undefined,
      include: {
        addresses: true,
      },
      skip: offset || 0,
      take: limit || undefined,
    });
    return dbClients as unknown as Client[];
  }

  async getClientById(id: number): Promise<Client | null> {
    const dbClient = await this.prisma.clients.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });
    return dbClient as unknown as Client | null;
  }

  async createClient(clientDto: CreateClientDto): Promise<Client> {
    const dbClient = await this.prisma.clients.create({
      data: {
        ...clientDto,
      },
    });
    return dbClient as unknown as Client;
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
      return dbClient as unknown as Client;
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
    const client = await this.prisma.clients.findUnique({
      where: { id: clientId },
      include: {
        addresses: true,
      },
    });

    if (!client || !client.address_id) return [];

    const address = await this.prisma.addresses.findUnique({
      where: { id: client.address_id },
    });

    return address ? [address as unknown as Address] : [];
  }

  async getAddressById(id: number): Promise<Address | null> {
    const dbAddress = await this.prisma.addresses.findUnique({
      where: { id },
    });
    return dbAddress as unknown as Address | null;
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

        return newAddress as unknown as Address;
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
      return dbAddress as unknown as Address;
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
}
