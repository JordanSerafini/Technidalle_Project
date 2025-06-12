import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CustomerFamily } from './customer-family.entity';
import { Contact } from './contact.entity';
import { Address } from './address.entity';

@Entity('Customer')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 14, nullable: true })
  siret: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ name: 'customer_family_id', nullable: true })
  customerFamilyId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditLimit: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CustomerFamily, customerFamily => customerFamily.customers)
  @JoinColumn({ name: 'customer_family_id' })
  customerFamily: CustomerFamily;

  @OneToMany(() => Contact, contact => contact.customer)
  contacts: Contact[];

  @OneToMany(() => Address, address => address.customer)
  addresses: Address[];
} 