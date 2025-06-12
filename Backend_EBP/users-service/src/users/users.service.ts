import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Not } from 'typeorm';
import { User, UserStatus, UserType } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserSession } from '../entities/user-session.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectRepository(UserSession)
    private sessionsRepository: Repository<UserSession>,
  ) {}

  // CRUD Utilisateurs
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Créer l'utilisateur
    const user = this.usersRepository.create(createUserDto);

    // Assigner les rôles si fournis
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      const roles = await this.rolesRepository.findBy({
        id: In(createUserDto.roleIds)
      });
      user.roles = roles;
    }

    const savedUser = await this.usersRepository.save(user);

    // Retourner l'utilisateur avec ses relations
    return this.findOne(savedUser.id);
  }

  async findAll(query?: any): Promise<User[]> {
    const {
      userType,
      status,
      department,
      clientId,
      supplierId,
      managerId,
      isActive,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = query || {};

    const queryBuilder = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions');

    if (userType) {
      queryBuilder.andWhere('user.userType = :userType', { userType });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (department) {
      queryBuilder.andWhere('user.department = :department', { department });
    }

    if (clientId) {
      queryBuilder.andWhere('user.clientId = :clientId', { clientId });
    }

    if (supplierId) {
      queryBuilder.andWhere('user.supplierId = :supplierId', { supplierId });
    }

    if (managerId) {
      queryBuilder.andWhere('user.managerId = :managerId', { managerId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy(`user.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .limit(limit)
      .offset(offset);

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.permissions', 'sessions'],
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email, id: Not(id) }
      });

      if (existingUser) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà');
      }
    }

    // Mettre à jour les champs de base
    Object.assign(user, updateUserDto);

    // Mettre à jour les rôles si fournis
    if (updateUserDto.roleIds !== undefined) {
      if (updateUserDto.roleIds.length > 0) {
        const roles = await this.rolesRepository.findBy({
          id: In(updateUserDto.roleIds)
        });
        user.roles = roles;
      } else {
        user.roles = [];
      }
    }

    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  // Gestion des mots de passe
  async changePassword(id: string, newPassword: string, updatedBy?: string): Promise<void> {
    const user = await this.findOne(id);
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
    user.updatedBy = updatedBy;

    await this.usersRepository.save(user);

    // Invalider toutes les sessions actives
    await this.invalidateUserSessions(id);
  }

  async resetPassword(id: string, updatedBy?: string): Promise<string> {
    const user = await this.findOne(id);
    
    // Générer un mot de passe temporaire
    const tempPassword = this.generateTempPassword();
    
    user.password = tempPassword;
    user.passwordChangedAt = new Date();
    user.mustChangePassword = true;
    user.updatedBy = updatedBy;

    await this.usersRepository.save(user);
    await this.invalidateUserSessions(id);

    return tempPassword;
  }

  // Gestion des sessions
  async createSession(userId: string, sessionData: Partial<UserSession>): Promise<UserSession> {
    const session = this.sessionsRepository.create({
      userId,
      ...sessionData,
      isActive: true,
    });

    return this.sessionsRepository.save(session);
  }

  async findUserSessions(userId: string): Promise<UserSession[]> {
    return this.sessionsRepository.find({
      where: { userId, isActive: true },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.sessionsRepository.update(sessionId, { isActive: false });
  }

  async invalidateUserSessions(userId: string): Promise<void> {
    await this.sessionsRepository.update(
      { userId, isActive: true },
      { isActive: false }
    );
  }

  // Recherche et filtres
  async search(searchTerm: string): Promise<User[]> {
    return this.usersRepository.find({
      where: [
        { firstName: Like(`%${searchTerm}%`) },
        { lastName: Like(`%${searchTerm}%`) },
        { email: Like(`%${searchTerm}%`) },
        { jobTitle: Like(`%${searchTerm}%`) },
        { department: Like(`%${searchTerm}%`) },
      ],
      relations: ['roles'],
      take: 20,
    });
  }

  async findByRole(roleName: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .where('roles.name = :roleName', { roleName })
      .andWhere('user.isActive = true')
      .getMany();
  }

  async findByDepartment(department: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { department, isActive: true },
      relations: ['roles'],
      order: { lastName: 'ASC' },
    });
  }

  async findManagers(): Promise<User[]> {
    return this.usersRepository.find({
      where: [
        { userType: UserType.ADMIN },
        { userType: UserType.MANAGER }
      ],
      relations: ['roles'],
      order: { lastName: 'ASC' },
    });
  }

  // Statistiques
  async getStatistics() {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({
      where: { status: UserStatus.ACTIVE, isActive: true }
    });

    const usersByType = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.userType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('user.isActive = true')
      .groupBy('user.userType')
      .getRawMany();

    const usersByStatus = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status')
      .getRawMany();

    const recentLogins = await this.usersRepository.count({
      where: {
        lastLoginAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
        isActive: true
      }
    });

    return {
      totalUsers,
      activeUsers,
      usersByType,
      usersByStatus,
      recentLogins,
    };
  }

  // Méthodes utilitaires
  private generateTempPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  // Méthodes spécifiques pour mobile
  async getActiveUsers(limit = 20): Promise<User[]> {
    return this.usersRepository.find({
      where: { status: UserStatus.ACTIVE, isActive: true },
      relations: ['roles'],
      order: { lastLoginAt: 'DESC' },
      take: limit,
    });
  }

  async getUsersByClient(clientId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { clientId, isActive: true },
      relations: ['roles'],
      order: { lastName: 'ASC' },
    });
  }

  async getUsersBySupplier(supplierId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { supplierId, isActive: true },
      relations: ['roles'],
      order: { lastName: 'ASC' },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  async getInactiveUsers(days = 30): Promise<User[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.lastLoginAt < :cutoffDate OR user.lastLoginAt IS NULL', { cutoffDate })
      .andWhere('user.isActive = true')
      .getMany();
  }
} 