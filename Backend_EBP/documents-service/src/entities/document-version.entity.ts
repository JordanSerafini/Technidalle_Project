import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from './document.entity';

@Entity('DocumentVersion')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id' })
  documentId: string;

  @Column({ type: 'integer' })
  versionNumber: number;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ length: 500, nullable: true })
  changeLog: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Document, document => document.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: Document;

  // Méthodes calculées pour mobile
  get fileUrl(): string {
    return `/api/documents/${this.documentId}/versions/${this.id}/download`;
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
} 