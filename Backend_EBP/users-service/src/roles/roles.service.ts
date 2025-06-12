import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    // Vérifier si le rôle existe déjà
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name }
    });

    if (existingRole) {
      throw new ConflictException('Un rôle avec ce nom existe déjà');
    }

    // Créer le rôle
    const role = this.rolesRepository.create(createRoleDto);

    // Assigner les permissions si fournies
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      const permissions = await this.permissionsRepository.findBy({
        id: In(createRoleDto.permissionIds)
      });
      role.permissions = permissions;
    }

    const savedRole = await this.rolesRepository.save(role);
    return this.findOne(savedRole.id);
  }

  async findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: ['permissions', 'users'],
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions', 'users'],
    });

    if (!role) {
      throw new NotFoundException(`Rôle avec l'ID ${id} non trouvé`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.rolesRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async update(id: string, updateData: Partial<CreateRoleDto>): Promise<Role> {
    const role = await this.findOne(id);

    // Mettre à jour les champs de base
    Object.assign(role, updateData);

    // Mettre à jour les permissions si fournies
    if (updateData.permissionIds !== undefined) {
      if (updateData.permissionIds.length > 0) {
        const permissions = await this.permissionsRepository.findBy({
          id: In(updateData.permissionIds)
        });
        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    await this.rolesRepository.save(role);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    if (role.isSystem) {
      throw new ConflictException('Impossible de supprimer un rôle système');
    }

    await this.rolesRepository.remove(role);
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionsRepository.findBy({
      id: In(permissionIds)
    });

    role.permissions = permissions;
    await this.rolesRepository.save(role);
    
    return this.findOne(roleId);
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findOne(roleId);
    
    role.permissions = role.permissions.filter(
      permission => !permissionIds.includes(permission.id)
    );
    
    await this.rolesRepository.save(role);
    return this.findOne(roleId);
  }

  async getActiveRoles(): Promise<Role[]> {
    return this.rolesRepository.find({
      where: { isActive: true },
      relations: ['permissions'],
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async getRolesByCategory(category: string): Promise<Role[]> {
    return this.rolesRepository.find({
      where: { category, isActive: true },
      relations: ['permissions'],
      order: { level: 'ASC', name: 'ASC' },
    });
  }
} 