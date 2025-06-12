import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Contact } from '../entities/contact.entity';
import { Address } from '../entities/address.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findAll(query: any = {}): Promise<{ data: Customer[]; total: number }> {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.customerFamily', 'customerFamily');

    if (search) {
      queryBuilder.where(
        'customer.name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('customer.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('customer.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['customerFamily', 'contacts', 'addresses'],
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID ${id} non trouvé`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const customer = await this.findOne(id);
    await this.customerRepository.remove(customer);
    return { deleted: true, id };
  }

  async findContacts(customerId: string): Promise<Contact[]> {
    return await this.contactRepository.find({
      where: { customerId },
      order: { isMain: 'DESC', name: 'ASC' },
    });
  }

  async findAddresses(customerId: string): Promise<Address[]> {
    return await this.addressRepository.find({
      where: { customerId },
      order: { isMain: 'DESC', type: 'ASC' },
    });
  }

  async search(searchTerm: string): Promise<Customer[]> {
    return await this.customerRepository.find({
      where: [
        { name: Like(`%${searchTerm}%`) },
        { email: Like(`%${searchTerm}%`) },
        { phone: Like(`%${searchTerm}%`) },
        { siret: Like(`%${searchTerm}%`) },
      ],
      relations: ['customerFamily'],
      take: 20,
      order: { name: 'ASC' },
    });
  }
} 