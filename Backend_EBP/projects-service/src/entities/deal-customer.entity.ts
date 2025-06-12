import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Deal } from './deal.entity';

@Entity('DealCustomer')
export class DealCustomer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  DealId: string;

  @Column('text', { nullable: true })
  CustomerId: string;

  @Column('boolean', { nullable: true })
  IsMainCustomer: boolean;

  @Column('numeric', { nullable: true })
  InvoicePercentage: number;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  // Relations
  @ManyToOne(() => Deal, deal => deal.customers)
  @JoinColumn({ name: 'DealId' })
  deal: Deal;
} 