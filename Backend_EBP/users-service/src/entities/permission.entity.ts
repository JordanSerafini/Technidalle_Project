import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from 'typeorm';
import { Role } from './role.entity';

export enum PermissionModule {
  USERS = 'users',
  CLIENTS = 'clients',
  SUPPLIERS = 'suppliers',
  PROJECTS = 'projects',
  DOCUMENTS = 'documents',
  INVENTORY = 'inventory',
  EQUIPMENT = 'equipment',
  MAINTENANCE = 'maintenance',
  FINANCE = 'finance',
  COMMERCIAL = 'commercial',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  SYSTEM = 'system'
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  APPROVE = 'approve',
  EXPORT = 'export',
  IMPORT = 'import'
}

@Entity('Permission')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PermissionModule
  })
  module: PermissionModule;

  @Column({
    type: 'enum',
    enum: PermissionAction
  })
  action: PermissionAction;

  @Column({ length: 100, nullable: true })
  resource: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isSystem: boolean;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  // Méthodes calculées pour mobile
  get fullName(): string {
    return `${this.module}:${this.action}${this.resource ? ':' + this.resource : ''}`;
  }

  get displayName(): string {
    const moduleDisplay = this.module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const actionDisplay = this.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${actionDisplay} ${moduleDisplay}${this.resource ? ' - ' + this.resource : ''}`;
  }

  get roleCount(): number {
    return this.roles ? this.roles.length : 0;
  }
} 