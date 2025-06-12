import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity('SupplierItem')
export class SupplierItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  SupplierId: string;

  @Column('text', { nullable: true })
  ItemId: string;

  @Column('text', { nullable: true })
  SupplierReference: string;

  @Column('numeric', { nullable: true })
  PurchasePrice: number;

  @Column('numeric', { nullable: true })
  MinimalQuantity: number;

  @Column('numeric', { nullable: true })
  PackagingQuantity: number;

  @Column('smallint', { nullable: true })
  DeliveryDelay: number;

  @Column('boolean', { nullable: true })
  IsMainSupplier: boolean;

  @Column('timestamp', { nullable: true })
  LastPurchaseDate: Date;

  @Column('numeric', { nullable: true })
  LastPurchasePrice: number;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('text', { nullable: true })
  sysCreatedUser: string;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  @Column('text', { nullable: true })
  sysModifiedUser: string;

  // Relations
  @ManyToOne(() => Supplier, supplier => supplier.items)
  @JoinColumn({ name: 'SupplierId' })
  supplier: Supplier;

  // Propriétés calculées pour le frontend mobile
  get formattedPrice(): string {
    return this.PurchasePrice ? `${this.PurchasePrice.toFixed(2)} €` : 'Prix non défini';
  }

  get deliveryInfo(): string {
    if (this.DeliveryDelay) {
      return `${this.DeliveryDelay} jour(s)`;
    }
    return 'Délai non défini';
  }

  get isPreferred(): boolean {
    return this.IsMainSupplier === true;
  }
} 