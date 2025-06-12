import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SupplierFamily } from './supplier-family.entity';
import { SupplierItem } from './supplier-item.entity';

@Entity('Supplier')
export class Supplier {
  @PrimaryColumn('text')
  Id: string;

  @Column('text', { nullable: true })
  Name: string;

  @Column('text', { nullable: true })
  Siren: string;

  @Column('text', { nullable: true })
  IntracommunityVATNumber: string;

  @Column('text', { nullable: true })
  NAF: string;

  @Column('text', { nullable: true })
  FamilyId: string;

  @Column('text', { nullable: true })
  SubFamilyId: string;

  @Column('text', { nullable: true })
  ColleagueId: string;

  @Column('smallint', { nullable: true })
  ActiveState: number;

  @Column('smallint', { nullable: true })
  VatMode: number;

  @Column('numeric', { nullable: true })
  DiscountRate: number;

  @Column('numeric', { nullable: true })
  SecondDiscountRate: number;

  @Column('numeric', { nullable: true })
  AllowedAmount: number;

  @Column('numeric', { nullable: true })
  CurrentAmount: number;

  @Column('numeric', { nullable: true })
  ExceedAmount: number;

  @Column('text', { nullable: true })
  CurrencyId: string;

  @Column('text', { nullable: true })
  SettlementModeId: string;

  @Column('smallint', { nullable: true })
  PaymentDate: number;

  // Adresse principale de facturation
  @Column('text', { nullable: true })
  MainInvoicingAddress_Address1: string;

  @Column('text', { nullable: true })
  MainInvoicingAddress_Address2: string;

  @Column('text', { nullable: true })
  MainInvoicingAddress_ZipCode: string;

  @Column('text', { nullable: true })
  MainInvoicingAddress_City: string;

  @Column('text', { nullable: true })
  MainInvoicingAddress_CountryIsoCode: string;

  @Column('numeric', { nullable: true })
  MainInvoicingAddress_Longitude: number;

  @Column('numeric', { nullable: true })
  MainInvoicingAddress_Latitude: number;

  // Contact principal de facturation
  @Column('text', { nullable: true })
  MainInvoicingContact_Name: string;

  @Column('text', { nullable: true })
  MainInvoicingContact_FirstName: string;

  @Column('text', { nullable: true })
  MainInvoicingContact_Phone: string;

  @Column('text', { nullable: true })
  MainInvoicingContact_CellPhone: string;

  @Column('text', { nullable: true })
  MainInvoicingContact_Email: string;

  @Column('text', { nullable: true })
  MainInvoicingContact_Function: string;

  // Adresse de livraison
  @Column('text', { nullable: true })
  MainDeliveryAddress_Address1: string;

  @Column('text', { nullable: true })
  MainDeliveryAddress_Address2: string;

  @Column('text', { nullable: true })
  MainDeliveryAddress_ZipCode: string;

  @Column('text', { nullable: true })
  MainDeliveryAddress_City: string;

  @Column('text', { nullable: true })
  MainDeliveryAddress_CountryIsoCode: string;

  // Contact de livraison
  @Column('text', { nullable: true })
  MainDeliveryContact_Name: string;

  @Column('text', { nullable: true })
  MainDeliveryContact_Phone: string;

  @Column('text', { nullable: true })
  MainDeliveryContact_Email: string;

  @Column('boolean', { nullable: true })
  UseInvoicingAddressAsDeliveryAddress: boolean;

  @Column('boolean', { nullable: true })
  UseInvoicingContactAsDeliveryContact: boolean;

  @Column('text', { nullable: true })
  Notes: string;

  @Column('text', { nullable: true })
  NotesClear: string;

  @Column('integer', { nullable: true })
  sysEditCounter: number;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('text', { nullable: true })
  sysCreatedUser: string;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  @Column('text', { nullable: true })
  sysModifiedUser: string;

  // Relations
  @ManyToOne(() => SupplierFamily, family => family.suppliers, { nullable: true })
  @JoinColumn({ name: 'FamilyId' })
  family: SupplierFamily;

  @OneToMany(() => SupplierItem, item => item.supplier)
  items: SupplierItem[];

  // Propriétés calculées pour le frontend mobile
  get isActive(): boolean {
    return this.ActiveState === 1;
  }

  get fullAddress(): string {
    const parts = [
      this.MainInvoicingAddress_Address1,
      this.MainInvoicingAddress_Address2,
      this.MainInvoicingAddress_ZipCode,
      this.MainInvoicingAddress_City
    ].filter(Boolean);
    return parts.join(', ');
  }

  get mainContact(): string {
    const name = [this.MainInvoicingContact_FirstName, this.MainInvoicingContact_Name].filter(Boolean).join(' ');
    return name || 'Contact non défini';
  }

  get displayName(): string {
    return this.Name || this.Id;
  }
} 