import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Deal } from './deal.entity';

@Entity('DealItem')
export class DealItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  DealId: string;

  @Column('text', { nullable: true })
  ItemId: string;

  @Column('numeric', { nullable: true })
  Quantity: number;

  @Column('numeric', { nullable: true })
  UnitPrice: number;

  @Column('numeric', { nullable: true })
  TotalPrice: number;

  @Column('text', { nullable: true })
  Description: string;

  @Column('text', { nullable: true })
  Category: string; // Matériaux, Main d'œuvre, etc.

  @Column('timestamp', { nullable: true })
  DeliveryDate: Date;

  @Column('text', { nullable: true })
  Status: string; // Commandé, Livré, Installé

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  // Relations
  @ManyToOne(() => Deal, deal => deal.items)
  @JoinColumn({ name: 'DealId' })
  deal: Deal;

  // Propriétés calculées
  get isDelivered(): boolean {
    return this.Status === 'Livré' || this.Status === 'Installé';
  }

  get isInstalled(): boolean {
    return this.Status === 'Installé';
  }
} 