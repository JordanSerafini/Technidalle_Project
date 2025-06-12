import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { DocumentCategory } from './document-category.entity';
import { DocumentVersion } from './document-version.entity';

export enum DocumentType {
  DEVIS = 'devis',
  FACTURE = 'facture',
  PLAN = 'plan',
  PHOTO = 'photo',
  CONTRAT = 'contrat',
  RAPPORT = 'rapport',
  CERTIFICAT = 'certificat',
  AUTRE = 'autre'
}

export enum DocumentStatus {
  BROUILLON = 'brouillon',
  EN_COURS = 'en_cours',
  VALIDE = 'valide',
  ARCHIVE = 'archive',
  REFUSE = 'refuse'
}

@Entity('Document')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.AUTRE
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.BROUILLON
  })
  status: DocumentStatus;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  tags: string;

  @Column({ type: 'boolean', default: false })
  isConfidential: boolean;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'integer', default: 1 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => DocumentCategory, category => category.documents)
  @JoinColumn({ name: 'category_id' })
  category: DocumentCategory;

  @OneToMany(() => DocumentVersion, version => version.document)
  versions: DocumentVersion[];

  // Méthodes calculées pour mobile
  get fileUrl(): string {
    return `/api/documents/${this.id}/download`;
  }

  get thumbnailUrl(): string | null {
    if (this.mimeType.startsWith('image/')) {
      return `/api/documents/${this.id}/thumbnail`;
    }
    return null;
  }

  get formattedFileSize(): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let i = 0;
    
    while (size >= 1024 && i < sizes.length - 1) {
      size /= 1024;
      i++;
    }
    
    return `${Math.round(size * 100) / 100} ${sizes[i]}`;
  }

  get tagsArray(): string[] {
    return this.tags ? this.tags.split(',').map(tag => tag.trim()) : [];
  }

  get isExpired(): boolean {
    return this.expiryDate ? new Date() > new Date(this.expiryDate) : false;
  }
} 