import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity('SupplierFamily')
export class SupplierFamily {
  @PrimaryColumn('text')
  Id: string;

  @Column('text', { nullable: true })
  Caption: string;

  @Column('text', { nullable: true })
  Notes: string;

  @Column('text', { nullable: true })
  NotesClear: string;

  @Column('smallint', { nullable: true })
  ActiveState: number;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('text', { nullable: true })
  sysCreatedUser: string;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  @Column('text', { nullable: true })
  sysModifiedUser: string;

  // Relations
  @OneToMany(() => Supplier, supplier => supplier.family)
  suppliers: Supplier[];

  // Propriétés calculées pour le frontend mobile
  get isActive(): boolean {
    return this.ActiveState === 1;
  }

  get displayName(): string {
    return this.Caption || this.Id;
  }
} 