import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from '../entities/customer.entity';
import { CustomerFamily } from '../entities/customer-family.entity';
import { Contact } from '../entities/contact.entity';
import { Address } from '../entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CustomerFamily, Contact, Address]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {} 