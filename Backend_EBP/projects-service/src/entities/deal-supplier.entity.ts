import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Deal } from './deal.entity';

@Entity('DealSupplier')
export class DealSupplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  DealId: string;

  @Column('text', { nullable: true })
  SupplierId: string;

  @Column('text', { nullable: true })
  SupplierType: string; // Sous-traitant, Fournisseur, etc.

  @Column('numeric', { nullable: true })
  BudgetAmount: number;

  @Column('numeric', { nullable: true })
  ActualAmount: number;

  @Column('timestamp', { nullable: true })
  ContractDate: Date;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  // Relations
  @ManyToOne(() => Deal, deal => deal.suppliers)
  @JoinColumn({ name: 'DealId' })
  deal: Deal;
} 