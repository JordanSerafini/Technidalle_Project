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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
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

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(
    @Inject('CLIENTS_SERVICE') private readonly clientsService: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des clients' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'searchQuery', required: false, type: String })
  @ApiQuery({ name: 'typeFilter', required: false, type: String })
  @ApiQuery({ name: 'cityFilter', required: false, type: String })
  @ApiQuery({ name: 'statusFilter', required: false, type: String })
  @ApiQuery({ name: 'lastOrderFilter', required: false, type: String })
  @ApiOkResponse({ description: 'Liste de clients' })
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
  @ApiOperation({ summary: 'R\u00e9cup\u00e9rer un client par son identifiant' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Client trouv\u00e9' })
  async getClientById(@Param('id') id: number): Promise<Client> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'get_client_by_id' }, { id: Number(id) }),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Cr\u00e9er un client' })
  @ApiBody({ type: CreateClientDto })
  @ApiCreatedResponse({ description: 'Client cr\u00e9\u00e9' })
  async createClient(
    @Body() createClientDto: CreateClientDto,
  ): Promise<Client> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'create_client' }, createClientDto),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre \u00e0 jour un client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateClientDto })
  @ApiOkResponse({ description: 'Client mis \u00e0 jour' })
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
  @ApiOperation({ summary: 'Supprimer un client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Client supprim\u00e9' })
  async deleteClient(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'delete_client' }, { id: Number(id) }),
    );
  }

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Adresses d\'un client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Liste des adresses' })
  async getAddressesByClientId(@Param('id') id: number): Promise<Address[]> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_addresses_by_client_id' },
        { clientId: Number(id) },
      ),
    );
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Ajouter une adresse \u00e0 un client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateAddressDto })
  @ApiCreatedResponse({ description: 'Adresse cr\u00e9\u00e9e' })
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
  @ApiOperation({ summary: 'Mettre \u00e0 jour une adresse' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateAddressDto })
  @ApiOkResponse({ description: 'Adresse mise \u00e0 jour' })
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
  @ApiOperation({ summary: 'Supprimer une adresse' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Adresse supprim\u00e9e' })
  async deleteAddress(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'delete_address' }, { id: Number(id) }),
    );
  }

  @Get(':id/client-addresses')
  @ApiOperation({ summary: 'Associations adresse/client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Liste des associations' })
  async getClientAddresses(@Param('id') id: number): Promise<ClientAddress[]> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_client_addresses' },
        { clientId: Number(id) },
      ),
    );
  }

  @Get('client-addresses/:id')
  @ApiOperation({ summary: 'D\u00e9tail d\'une association adresse/client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'D\u00e9tails de l\'association' })
  async getClientAddressById(@Param('id') id: number): Promise<ClientAddress> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'get_client_address_by_id' },
        { id: Number(id) },
      ),
    );
  }

  @Post(':id/client-addresses')
  @ApiOperation({ summary: 'Cr\u00e9er une association adresse/client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateClientAddressDto })
  @ApiCreatedResponse({ description: 'Association cr\u00e9\u00e9e' })
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
  @ApiOperation({ summary: 'Mettre \u00e0 jour une association' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateClientAddressDto })
  @ApiOkResponse({ description: 'Association mise \u00e0 jour' })
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
  @ApiOperation({ summary: 'Supprimer une association adresse/client' })
  @ApiParam({ name: 'id', type: Number })
  @ApiNoContentResponse({ description: 'Association supprim\u00e9e' })
  async deleteClientAddress(@Param('id') id: number): Promise<boolean> {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'delete_client_address' },
        { id: Number(id) },
      ),
    );
  }

  @Put(':clientId/client-addresses/:addressId/set-default')
  @ApiOperation({ summary: 'D\u00e9finir l\'adresse par d\u00e9faut' })
  @ApiParam({ name: 'clientId', type: Number })
  @ApiParam({ name: 'addressId', type: Number })
  @ApiOkResponse({ description: 'Association mise \u00e0 jour' })
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
  @ApiOperation({ summary: 'G\u00e9ocoder une adresse' })
  @ApiQuery({ name: 'address', type: String })
  @ApiOkResponse({ description: 'Coordonn\u00e9es g\u00e9ographiques' })
  async geocodeAddress(@Query('address') address: string) {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'geocode_address' }, { address }),
    );
  }

  @Put('addresses/:id/geocode')
  @ApiOperation({ summary: 'Mettre \u00e0 jour la g\u00e9olocalisation' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'G\u00e9olocalisation mise \u00e0 jour' })
  async updateAddressCoordinates(@Param('id') id: number) {
    return await firstValueFrom(
      this.clientsService.send(
        { cmd: 'update_address_coordinates' },
        { addressId: Number(id) },
      ),
    );
  }

  @Post('addresses/geocode-all')
  @ApiOperation({ summary: 'G\u00e9ocoder toutes les adresses' })
  @ApiOkResponse({ description: 'Op\u00e9ration lanc\u00e9e' })
  async updateAllAddressesCoordinates() {
    return await firstValueFrom(
      this.clientsService.send({ cmd: 'update_all_addresses_coordinates' }, {}),
    );
  }

  @Post('with-address')
  @ApiOperation({ summary: 'Cr\u00e9er un client avec adresse' })
  @ApiBody({ type: CreateClientWithAddressDto })
  @ApiCreatedResponse({ description: 'Client cr\u00e9\u00e9 avec adresse' })
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
