import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Document } from './document.entity';

@Entity('DocumentCategory')
export class DocumentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ length: 7, default: '#007bff' })
  color: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Document, document => document.category)
  documents: Document[];

  // Méthodes calculées pour mobile
  get documentsCount(): number {
    return this.documents ? this.documents.length : 0;
  }
} 