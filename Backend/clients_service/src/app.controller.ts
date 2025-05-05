import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
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
} from './interfaces/address.interface';
import { GeocodingResponse } from './interfaces/geocoding.interface';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Clients Endpoints
  @MessagePattern({ cmd: 'get_all_clients' })
  async getAllClients(data?: {
    limit?: number;
    offset?: number;
    searchQuery?: string;
    typeFilter?: string;
    cityFilter?: string;
    statusFilter?: string;
    lastOrderFilter?: string;
  }): Promise<Client[]> {
    return await this.appService.getAllClients(data);
  }

  @MessagePattern({ cmd: 'get_client_by_id' })
  async getClientById(data: { id: number }): Promise<Client | null> {
    return await this.appService.getClientById(data.id);
  }

  @MessagePattern({ cmd: 'create_client' })
  async createClient(data: CreateClientDto): Promise<Client> {
    return await this.appService.createClient(data);
  }

  @MessagePattern({ cmd: 'update_client' })
  async updateClient(data: {
    id: number;
    clientDto: UpdateClientDto;
  }): Promise<Client | null> {
    return await this.appService.updateClient(data.id, data.clientDto);
  }

  @MessagePattern({ cmd: 'delete_client' })
  async deleteClient(data: { id: number }): Promise<boolean> {
    return await this.appService.deleteClient(data.id);
  }

  @MessagePattern({ cmd: 'create_client_with_address' })
  async createClientWithAddress(
    data: CreateClientWithAddressDto,
  ): Promise<Client> {
    return await this.appService.createClientWithAddress(data);
  }

  // Addresses Endpoints
  @MessagePattern({ cmd: 'get_addresses_by_client_id' })
  async getAddressesByClientId(data: { clientId: number }): Promise<Address[]> {
    return await this.appService.getAddressesByClientId(data.clientId);
  }

  @MessagePattern({ cmd: 'get_address_by_id' })
  async getAddressById(data: { id: number }): Promise<Address | null> {
    return await this.appService.getAddressById(data.id);
  }

  @MessagePattern({ cmd: 'create_address' })
  async createAddress(data: {
    clientId: number;
    addressDto: CreateAddressDto;
  }): Promise<Address | null> {
    return await this.appService.createAddress(data.clientId, data.addressDto);
  }

  @MessagePattern({ cmd: 'update_address' })
  async updateAddress(data: {
    id: number;
    addressDto: UpdateAddressDto;
  }): Promise<Address | null> {
    return await this.appService.updateAddress(data.id, data.addressDto);
  }

  @MessagePattern({ cmd: 'delete_address' })
  async deleteAddress(data: { id: number }): Promise<boolean> {
    return await this.appService.deleteAddress(data.id);
  }

  // Client Addresses (association) Endpoints
  @MessagePattern({ cmd: 'get_client_addresses' })
  async getClientAddresses(data: {
    clientId: number;
  }): Promise<ClientAddress[]> {
    return await this.appService.getClientAddresses(data.clientId);
  }

  @MessagePattern({ cmd: 'get_client_address_by_id' })
  async getClientAddressById(data: {
    id: number;
  }): Promise<ClientAddress | null> {
    return await this.appService.getClientAddressById(data.id);
  }

  @MessagePattern({ cmd: 'create_client_address' })
  async createClientAddress(
    data: CreateClientAddressDto,
  ): Promise<ClientAddress | null> {
    return await this.appService.createClientAddress(data);
  }

  @MessagePattern({ cmd: 'update_client_address' })
  async updateClientAddress(data: {
    id: number;
    clientAddressDto: UpdateClientAddressDto;
  }): Promise<ClientAddress | null> {
    return await this.appService.updateClientAddress(
      data.id,
      data.clientAddressDto,
    );
  }

  @MessagePattern({ cmd: 'delete_client_address' })
  async deleteClientAddress(data: { id: number }): Promise<boolean> {
    return await this.appService.deleteClientAddress(data.id);
  }

  @MessagePattern({ cmd: 'set_default_client_address' })
  async setDefaultClientAddress(data: {
    clientId: number;
    addressId: number;
  }): Promise<boolean> {
    return await this.appService.setDefaultClientAddress(
      data.clientId,
      data.addressId,
    );
  }

  // Project Addresses (association) Endpoints
  @MessagePattern({ cmd: 'get_project_addresses' })
  async getProjectAddresses(data: {
    projectId: number;
  }): Promise<ProjectAddress[]> {
    return await this.appService.getProjectAddresses(data.projectId);
  }

  @MessagePattern({ cmd: 'get_project_address_by_id' })
  async getProjectAddressById(data: {
    id: number;
  }): Promise<ProjectAddress | null> {
    return await this.appService.getProjectAddressById(data.id);
  }

  @MessagePattern({ cmd: 'create_project_address' })
  async createProjectAddress(
    data: CreateProjectAddressDto,
  ): Promise<ProjectAddress | null> {
    return await this.appService.createProjectAddress(data);
  }

  @MessagePattern({ cmd: 'update_project_address' })
  async updateProjectAddress(data: {
    id: number;
    projectAddressDto: UpdateProjectAddressDto;
  }): Promise<ProjectAddress | null> {
    return await this.appService.updateProjectAddress(
      data.id,
      data.projectAddressDto,
    );
  }

  @MessagePattern({ cmd: 'delete_project_address' })
  async deleteProjectAddress(data: { id: number }): Promise<boolean> {
    return await this.appService.deleteProjectAddress(data.id);
  }

  @MessagePattern({ cmd: 'set_default_project_address' })
  async setDefaultProjectAddress(data: {
    projectId: number;
    addressId: number;
  }): Promise<boolean> {
    return await this.appService.setDefaultProjectAddress(
      data.projectId,
      data.addressId,
    );
  }

  // Geocoding Endpoint
  @MessagePattern({ cmd: 'geocode_address' })
  async geocodeAddress(data: { address: string }): Promise<GeocodingResponse> {
    return await this.appService.geocodeAddress(data.address);
  }

  @MessagePattern({ cmd: 'update_address_coordinates' })
  async updateAddressCoordinates(data: {
    addressId: number;
  }): Promise<GeocodingResponse> {
    return await this.appService.updateAddressCoordinates(data.addressId);
  }

  @MessagePattern({ cmd: 'update_all_addresses_coordinates' })
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
    return await this.appService.updateAllAddressesCoordinates();
  }
}
