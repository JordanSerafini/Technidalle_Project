import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Deal } from './deal.entity';

@Entity('ConstructionSite')
export class ConstructionSite {
  @PrimaryColumn('text')
  Id: string;

  @Column('text', { nullable: true })
  Caption: string;

  @Column('text', { nullable: true })
  DealId: string;

  @Column('text', { nullable: true })
  CustomerId: string;

  @Column('text', { nullable: true })
  AddressId: string;

  @Column('text', { nullable: true })
  ContactId: string;

  @Column('timestamp', { nullable: true })
  StartDate: Date;

  @Column('timestamp', { nullable: true })
  EndDate: Date;

  @Column('text', { nullable: true })
  Status: string;

  @Column('text', { nullable: true })
  Description: string;

  @Column('numeric', { nullable: true })
  SurfaceM2: number;

  @Column('text', { nullable: true })
  WorkType: string; // Type de travaux

  @Column('text', { nullable: true })
  Notes: string;

  @Column('text', { nullable: true })
  NotesClear: string;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('text', { nullable: true })
  sysCreatedUser: string;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  @Column('text', { nullable: true })
  sysModifiedUser: string;

  // Relations
  @ManyToOne(() => Deal, deal => deal.constructionSites)
  @JoinColumn({ name: 'DealId' })
  deal: Deal;

  // Propriétés calculées pour le frontend mobile
  get displayName(): string {
    return this.Caption || this.Id;
  }

  get isActive(): boolean {
    return this.Status === 'En cours';
  }

  get isCompleted(): boolean {
    return this.Status === 'Terminé';
  }

  get duration(): number {
    if (!this.StartDate || !this.EndDate) return 0;
    const start = new Date(this.StartDate);
    const end = new Date(this.EndDate);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get remainingDays(): number {
    if (!this.EndDate) return 0;
    const today = new Date();
    const end = new Date(this.EndDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get isDelayed(): boolean {
    return this.remainingDays < 0 && !this.isCompleted;
  }
} 