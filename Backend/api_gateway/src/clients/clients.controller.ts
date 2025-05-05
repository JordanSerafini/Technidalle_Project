import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  Client,
  CreateClientDto,
  CreateClientWithAddressDto,
  UpdateClientDto,
} from '../interfaces/client.interface';
import {
  CreateAddressDto,
  UpdateAddressDto,
  Address,
  ClientAddress,
  CreateClientAddressDto,
  UpdateClientAddressDto,
} from '../interfaces/address.interface';
import { firstValueFrom } from 'rxjs';

@Controller('clients')
export class ClientsController {
  constructor(
    @Inject('CLIENTS_SERVICE') private readonly clientsService: ClientProxy,
  ) {}

  @Get()
  async getAllClients(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('searchQuery') searchQuery?: string,
    @Query('typeFilter') typeFilter?: string,
    @Query('cityFilter') cityFilter?: string,
    @Query('statusFilter') statusFilter?: string,
    @Query('lastOrderFilter') lastOrderFilter?: string,
  ): Promise<Client[]> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_all_clients' },
        {
          limit: limit ? Number(limit) : undefined,
          offset: offset ? Number(offset) : undefined,
          searchQuery,
          typeFilter,
          cityFilter,
          statusFilter,
          lastOrderFilter,
        },
      ),
    );
  }

  @Get(':id')
  async getClientById(@Param('id') id: number): Promise<Client> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'get_client_by_id' }, { id: Number(id) }),
    );
  }

  @Post()
  async createClient(
    @Body() createClientDto: CreateClientDto,
  ): Promise<Client> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'create_client' }, createClientDto),
    );
  }

  @Put(':id')
  async updateClient(
    @Param('id') id: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'update_client' },
        { id: Number(id), clientDto: updateClientDto },
      ),
    );
  }

  @Delete(':id')
  async deleteClient(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'delete_client' }, { id: Number(id) }),
    );
  }

  @Get(':id/addresses')
  async getAddressesByClientId(@Param('id') id: number): Promise<Address[]> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_addresses_by_client_id' },
        { clientId: Number(id) },
      ),
    );
  }

  @Post(':id/addresses')
  async createAddress(
    @Param('id') id: number,
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'create_address' },
        { clientId: Number(id), addressDto: createAddressDto },
      ),
    );
  }

  @Put('addresses/:id')
  async updateAddress(
    @Param('id') id: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'update_address' },
        { id: Number(id), addressDto: updateAddressDto },
      ),
    );
  }

  @Delete('addresses/:id')
  async deleteAddress(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'delete_address' }, { id: Number(id) }),
    );
  }

  @Get(':id/client-addresses')
  async getClientAddresses(@Param('id') id: number): Promise<ClientAddress[]> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_client_addresses' },
        { clientId: Number(id) },
      ),
    );
  }

  @Get('client-addresses/:id')
  async getClientAddressById(@Param('id') id: number): Promise<ClientAddress> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_client_address_by_id' },
        { id: Number(id) },
      ),
    );
  }

  @Post(':id/client-addresses')
  async createClientAddress(
    @Param('id') id: number,
    @Body() createClientAddressDto: CreateClientAddressDto,
  ): Promise<ClientAddress> {
    const completeDto = {
      ...createClientAddressDto,
      client_id: Number(id),
    };

    return await firstValueFrom(
      this.clientsService.send({ cmd: 'create_client_address' }, completeDto),
    );
  }

  @Put('client-addresses/:id')
  async updateClientAddress(
    @Param('id') id: number,
    @Body() updateClientAddressDto: UpdateClientAddressDto,
  ): Promise<ClientAddress> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'update_client_address' },
        { id: Number(id), clientAddressDto: updateClientAddressDto },
      ),
    );
  }

  @Delete('client-addresses/:id')
  async deleteClientAddress(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'delete_client_address' },
        { id: Number(id) },
      ),
    );
  }

  @Put(':clientId/client-addresses/:addressId/set-default')
  async setDefaultClientAddress(
    @Param('clientId') clientId: number,
    @Param('addressId') addressId: number,
  ): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'set_default_client_address' },
        { clientId: Number(clientId), addressId: Number(addressId) },
      ),
    );
  }

  @Get('geocode')
  async geocodeAddress(@Query('address') address: string) {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'geocode_address' }, { address }),
    );
  }

  @Put('addresses/:id/geocode')
  async updateAddressCoordinates(@Param('id') id: number) {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'update_address_coordinates' },
        { addressId: Number(id) },
      ),
    );
  }

  @Post('addresses/geocode-all')
  async updateAllAddressesCoordinates() {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'update_all_addresses_coordinates' }, {}),
    );
  }

  @Post('with-address')
  async createClientWithAddress(
    @Body() createClientWithAddressDto: CreateClientWithAddressDto,
  ): Promise<Client> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'create_client_with_address' },
        createClientWithAddressDto,
      ),
    );
  }
}
