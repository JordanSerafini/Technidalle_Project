import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Deal } from './deal.entity';

@Entity('DealColleague')
export class DealColleague {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  DealId: string;

  @Column('text', { nullable: true })
  ColleagueId: string;

  @Column('text', { nullable: true })
  Role: string; // Chef de projet, Technicien, etc.

  @Column('numeric', { nullable: true })
  AllocationPercentage: number;

  @Column('timestamp', { nullable: true })
  StartDate: Date;

  @Column('timestamp', { nullable: true })
  EndDate: Date;

  @Column('boolean', { nullable: true })
  IsManager: boolean;

  @Column('timestamp', { nullable: true })
  sysCreatedDate: Date;

  @Column('timestamp', { nullable: true })
  sysModifiedDate: Date;

  // Relations
  @ManyToOne(() => Deal, deal => deal.colleagues)
  @JoinColumn({ name: 'DealId' })
  deal: Deal;
} 