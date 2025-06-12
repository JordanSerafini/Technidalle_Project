import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @MessagePattern('clients.create')
  async create(@Payload() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @MessagePattern('clients.findAll')
  async findAll(@Payload() query: any) {
    return this.customersService.findAll(query);
  }

  @MessagePattern('clients.findOne')
  async findOne(@Payload() id: string) {
    return this.customersService.findOne(id);
  }

  @MessagePattern('clients.update')
  async update(@Payload() payload: { id: string } & UpdateCustomerDto) {
    const { id, ...updateData } = payload;
    return this.customersService.update(id, updateData);
  }

  @MessagePattern('clients.delete')
  async remove(@Payload() id: string) {
    return this.customersService.remove(id);
  }

  @MessagePattern('clients.contacts')
  async findContacts(@Payload() customerId: string) {
    return this.customersService.findContacts(customerId);
  }

  @MessagePattern('clients.addresses')
  async findAddresses(@Payload() customerId: string) {
    return this.customersService.findAddresses(customerId);
  }

  @MessagePattern('clients.search')
  async search(@Payload() searchTerm: string) {
    return this.customersService.search(searchTerm);
  }
} 