import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // CRUD Utilisateurs
  @MessagePattern('users.create')
  async create(@Payload() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @MessagePattern('users.findAll')
  async findAll(@Payload() query: any) {
    return this.usersService.findAll(query);
  }

  @MessagePattern('users.findOne')
  async findOne(@Payload() id: string) {
    return this.usersService.findOne(id);
  }

  @MessagePattern('users.findByEmail')
  async findByEmail(@Payload() email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern('users.update')
  async update(@Payload() payload: { id: string } & UpdateUserDto) {
    const { id, ...updateData } = payload;
    return this.usersService.update(id, updateData);
  }

  @MessagePattern('users.delete')
  async remove(@Payload() id: string) {
    return this.usersService.remove(id);
  }

  // Gestion des mots de passe
  @MessagePattern('users.changePassword')
  async changePassword(@Payload() payload: { id: string; newPassword: string; updatedBy?: string }) {
    const { id, newPassword, updatedBy } = payload;
    return this.usersService.changePassword(id, newPassword, updatedBy);
  }

  @MessagePattern('users.resetPassword')
  async resetPassword(@Payload() payload: { id: string; updatedBy?: string }) {
    const { id, updatedBy } = payload;
    return this.usersService.resetPassword(id, updatedBy);
  }

  // Gestion des sessions
  @MessagePattern('users.createSession')
  async createSession(@Payload() payload: { userId: string; sessionData: any }) {
    const { userId, sessionData } = payload;
    return this.usersService.createSession(userId, sessionData);
  }

  @MessagePattern('users.getSessions')
  async getUserSessions(@Payload() userId: string) {
    return this.usersService.findUserSessions(userId);
  }

  @MessagePattern('users.invalidateSession')
  async invalidateSession(@Payload() sessionId: string) {
    return this.usersService.invalidateSession(sessionId);
  }

  @MessagePattern('users.invalidateAllSessions')
  async invalidateUserSessions(@Payload() userId: string) {
    return this.usersService.invalidateUserSessions(userId);
  }

  // Recherche et filtres
  @MessagePattern('users.search')
  async search(@Payload() searchTerm: string) {
    return this.usersService.search(searchTerm);
  }

  @MessagePattern('users.findByRole')
  async findByRole(@Payload() roleName: string) {
    return this.usersService.findByRole(roleName);
  }

  @MessagePattern('users.findByDepartment')
  async findByDepartment(@Payload() department: string) {
    return this.usersService.findByDepartment(department);
  }

  @MessagePattern('users.findManagers')
  async findManagers() {
    return this.usersService.findManagers();
  }

  // Statistiques
  @MessagePattern('users.statistics')
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  // Méthodes spécifiques pour mobile
  @MessagePattern('users.active')
  async getActiveUsers(@Payload() limit?: number) {
    return this.usersService.getActiveUsers(limit);
  }

  @MessagePattern('users.byClient')
  async getUsersByClient(@Payload() clientId: string) {
    return this.usersService.getUsersByClient(clientId);
  }

  @MessagePattern('users.bySupplier')
  async getUsersBySupplier(@Payload() supplierId: string) {
    return this.usersService.getUsersBySupplier(supplierId);
  }

  @MessagePattern('users.updateLastLogin')
  async updateLastLogin(@Payload() id: string) {
    return this.usersService.updateLastLogin(id);
  }

  @MessagePattern('users.inactive')
  async getInactiveUsers(@Payload() days?: number) {
    return this.usersService.getInactiveUsers(days);
  }

  // Filtres avancés
  @MessagePattern('users.byType')
  async getUsersByType(@Payload() payload: { userType: string; limit?: number }) {
    const { userType, limit = 50 } = payload;
    return this.usersService.findAll({ userType, limit });
  }

  @MessagePattern('users.byStatus')
  async getUsersByStatus(@Payload() payload: { status: string; limit?: number }) {
    const { status, limit = 50 } = payload;
    return this.usersService.findAll({ status, limit });
  }

  @MessagePattern('users.byManager')
  async getUsersByManager(@Payload() managerId: string) {
    return this.usersService.findAll({ managerId });
  }

  @MessagePattern('users.needPasswordChange')
  async getUsersNeedingPasswordChange() {
    const users = await this.usersService.findAll();
    return users.filter(user => user.needsPasswordChange);
  }
} 