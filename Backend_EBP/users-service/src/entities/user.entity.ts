import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, OneToMany, JoinTable, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';
import { UserSession } from './user-session.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum UserType {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  CONTRACTOR = 'contractor',
  CLIENT = 'client',
  SUPPLIER = 'supplier'
}

@Entity('User')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.EMPLOYEE
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  status: UserStatus;

  @Column({ length: 100, nullable: true })
  jobTitle: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ name: 'manager_id', nullable: true })
  managerId: string;

  @Column({ name: 'client_id', nullable: true })
  clientId: string;

  @Column({ name: 'supplier_id', nullable: true })
  supplierId: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'date', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Column({ type: 'boolean', default: false })
  mustChangePassword: boolean;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @Column({ length: 255, nullable: true })
  twoFactorSecret: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
  })
  roles: Role[];

  @OneToMany(() => UserSession, session => session.user)
  sessions: UserSession[];

  // Hooks pour hasher le mot de passe
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Méthodes utilitaires
  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  // Méthodes calculées pour mobile
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName(): string {
    return this.fullName;
  }

  get initials(): string {
    return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
  }

  get isAdmin(): boolean {
    return this.userType === UserType.ADMIN;
  }

  get isManager(): boolean {
    return this.userType === UserType.MANAGER || this.userType === UserType.ADMIN;
  }

  get canLogin(): boolean {
    return this.status === UserStatus.ACTIVE && this.isActive;
  }

  get avatarUrl(): string {
    return this.avatar || `/api/users/${this.id}/avatar`;
  }

  get roleNames(): string[] {
    return this.roles ? this.roles.map(role => role.name) : [];
  }

  hasRole(roleName: string): boolean {
    return this.roleNames.includes(roleName);
  }

  hasAnyRole(roleNames: string[]): boolean {
    return roleNames.some(role => this.hasRole(role));
  }

  get daysSinceLastLogin(): number {
    if (!this.lastLoginAt) return -1;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.lastLoginAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get needsPasswordChange(): boolean {
    return this.mustChangePassword || (this.passwordChangedAt && 
      Date.now() - this.passwordChangedAt.getTime() > 90 * 24 * 60 * 60 * 1000); // 90 jours
  }
} 