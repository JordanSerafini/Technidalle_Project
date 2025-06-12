import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('Address')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ length: 255 })
  street: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 10 })
  zipCode: string;

  @Column({ length: 100, default: 'France' })
  country: string;

  @Column({ length: 50, nullable: true })
  type: string; // billing, shipping, etc.

  @Column({ type: 'boolean', default: false })
  isMain: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Customer, customer => customer.addresses)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
} 