import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
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
  }): Promise<Client[]> {
    return await this.appService.getAllClients(
      data?.limit,
      data?.offset,
      data?.searchQuery,
    );
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
}
