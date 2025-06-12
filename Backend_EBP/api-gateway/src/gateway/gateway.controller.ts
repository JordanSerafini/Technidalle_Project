import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@Controller()
@ApiTags('API Gateway')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GatewayController {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  // Health Check
  @Get('health')
  @ApiOperation({ summary: 'Health check pour tous les services' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: [
        'api-gateway', 'auth-service', 'clients-service', 'suppliers-service',
        'projects-service', 'planning-service', 'documents-service', 'inventory-service',
        'users-service', 'equipment-service', 'maintenance-service', 'incidents-service',
        'analytics-service', 'finance-service', 'commercial-service', 'controlling-service',
        'pos-service', 'loyalty-service', 'catalog-service', 'ecommerce-service', 'workflow-service'
      ]
    };
  }

  // ========================= CLIENTS SERVICE (Port 3002) =========================
  @Get('clients')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Liste des clients' })
  async getClients(@Query() query: any) {
    return this.natsClient.send('clients.findAll', query);
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Détails d\'un client' })
  async getClient(@Param('id') id: string) {
    return this.natsClient.send('clients.findOne', id);
  }

  @Post('clients')
  @ApiOperation({ summary: 'Créer un client' })
  async createClient(@Body() clientData: any) {
    return this.natsClient.send('clients.create', clientData);
  }

  @Put('clients/:id')
  @ApiOperation({ summary: 'Modifier un client' })
  async updateClient(@Param('id') id: string, @Body() clientData: any) {
    return this.natsClient.send('clients.update', { id, ...clientData });
  }

  @Delete('clients/:id')
  @ApiOperation({ summary: 'Supprimer un client' })
  async deleteClient(@Param('id') id: string) {
    return this.natsClient.send('clients.delete', id);
  }

  @Get('clients/:id/contacts')
  @ApiOperation({ summary: 'Contacts d\'un client' })
  async getClientContacts(@Param('id') id: string) {
    return this.natsClient.send('clients.contacts', id);
  }

  // ========================= SUPPLIERS SERVICE (Port 3003) =========================
  @Get('suppliers')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Liste des fournisseurs' })
  async getSuppliers(@Query() query: any) {
    return this.natsClient.send('suppliers.findAll', query);
  }

  @Get('suppliers/:id')
  @ApiOperation({ summary: 'Détails d\'un fournisseur' })
  async getSupplier(@Param('id') id: string) {
    return this.natsClient.send('suppliers.findOne', id);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Créer un fournisseur' })
  async createSupplier(@Body() supplierData: any) {
    return this.natsClient.send('suppliers.create', supplierData);
  }

  // ========================= PROJECTS SERVICE (Port 3004) =========================
  @Get('projects')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Liste des projets' })
  async getProjects(@Query() query: any) {
    return this.natsClient.send('projects.findAll', query);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Détails d\'un projet' })
  async getProject(@Param('id') id: string) {
    return this.natsClient.send('projects.findOne', id);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Créer un projet' })
  async createProject(@Body() projectData: any) {
    return this.natsClient.send('projects.create', projectData);
  }

  @Get('projects/:id/sites')
  @ApiOperation({ summary: 'Chantiers d\'un projet' })
  async getProjectSites(@Param('id') id: string) {
    return this.natsClient.send('projects.sites', id);
  }

  // ========================= PLANNING SERVICE (Port 3005) =========================
  @Get('planning/events')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Liste des événements planning' })
  async getPlanningEvents(@Query() query: any) {
    return this.natsClient.send('planning.events.findAll', query);
  }

  @Get('planning/events/:id')
  @ApiOperation({ summary: 'Détails d\'un événement' })
  async getPlanningEvent(@Param('id') id: string) {
    return this.natsClient.send('planning.events.findOne', id);
  }

  @Post('planning/events')
  @ApiOperation({ summary: 'Créer un événement' })
  async createPlanningEvent(@Body() eventData: any) {
    return this.natsClient.send('planning.events.create', eventData);
  }

  @Get('planning/calendar/:date')
  @ApiOperation({ summary: 'Planning par date' })
  async getPlanningByDate(@Param('date') date: string) {
    return this.natsClient.send('planning.calendar', date);
  }

  // ========================= DOCUMENTS SERVICE (Port 3006) =========================
  @Get('documents')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Liste des documents' })
  async getDocuments(@Query() query: any) {
    return this.natsClient.send('documents.findAll', query);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Détails d\'un document' })
  async getDocument(@Param('id') id: string) {
    return this.natsClient.send('documents.findOne', id);
  }

  @Post('documents')
  @ApiOperation({ summary: 'Créer un document' })
  async createDocument(@Body() documentData: any) {
    return this.natsClient.send('documents.create', documentData);
  }

  // ========================= INVENTORY SERVICE (Port 3007) =========================
  @Get('inventory/items')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Liste des articles' })
  async getInventoryItems(@Query() query: any) {
    return this.natsClient.send('inventory.items.findAll', query);
  }

  @Get('inventory/stock/:item')
  @ApiOperation({ summary: 'Stock d\'un article' })
  async getItemStock(@Param('item') item: string) {
    return this.natsClient.send('inventory.stock', item);
  }

  @Get('inventory/low-stock')
  @ApiOperation({ summary: 'Articles en rupture' })
  async getLowStockItems() {
    return this.natsClient.send('inventory.lowStock', {});
  }

  // ========================= POS SERVICE (Port 3016) =========================
  @Get('pos/terminals')
  @ApiOperation({ summary: 'Liste des terminaux POS' })
  async getPosTerminals() {
    return this.natsClient.send('pos.terminals.findAll', {});
  }

  @Post('pos/terminals/:id/open')
  @ApiOperation({ summary: 'Ouvrir une caisse' })
  async openPosTerminal(@Param('id') id: string, @Body() data: any) {
    return this.natsClient.send('pos.terminals.open', { id, ...data });
  }

  @Post('pos/sales')
  @ApiOperation({ summary: 'Nouvelle vente POS' })
  async createPosSale(@Body() saleData: any) {
    return this.natsClient.send('pos.sales.create', saleData);
  }

  // ========================= LOYALTY SERVICE (Port 3017) =========================
  @Get('loyalty/cards/:customer')
  @ApiOperation({ summary: 'Carte fidélité client' })
  async getLoyaltyCard(@Param('customer') customer: string) {
    return this.natsClient.send('loyalty.cards.findOne', customer);
  }

  @Get('loyalty/points/:customer')
  @ApiOperation({ summary: 'Points disponibles' })
  async getLoyaltyPoints(@Param('customer') customer: string) {
    return this.natsClient.send('loyalty.points.findOne', customer);
  }

  @Post('loyalty/points/add')
  @ApiOperation({ summary: 'Ajouter des points' })
  async addLoyaltyPoints(@Body() pointsData: any) {
    return this.natsClient.send('loyalty.points.add', pointsData);
  }

  // ========================= FINANCE SERVICE (Port 3013) =========================
  @Get('finance/banks')
  @ApiOperation({ summary: 'Liste des banques' })
  async getBanks() {
    return this.natsClient.send('finance.banks.findAll', {});
  }

  @Get('finance/cash-movements')
  @ApiOperation({ summary: 'Mouvements de trésorerie' })
  async getCashMovements(@Query() query: any) {
    return this.natsClient.send('finance.cashMovements.findAll', query);
  }

  @Post('finance/travel-expenses')
  @ApiOperation({ summary: 'Saisir frais de déplacement' })
  async createTravelExpense(@Body() expenseData: any) {
    return this.natsClient.send('finance.travelExpenses.create', expenseData);
  }

  // ========================= ANALYTICS SERVICE (Port 3012) =========================
  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Tableau de bord analytics' })
  async getAnalyticsDashboard() {
    return this.natsClient.send('analytics.dashboard', {});
  }

  @Get('analytics/projects/stats')
  @ApiOperation({ summary: 'Statistiques projets' })
  async getProjectsStats() {
    return this.natsClient.send('analytics.projects.stats', {});
  }

  // ========================= WORKFLOW SERVICE (Port 3020) =========================
  @Get('workflow/processes')
  @ApiOperation({ summary: 'Processus actifs' })
  async getWorkflowProcesses() {
    return this.natsClient.send('workflow.processes.findAll', {});
  }

  @Post('workflow/processes')
  @ApiOperation({ summary: 'Démarrer un processus' })
  async startWorkflowProcess(@Body() processData: any) {
    return this.natsClient.send('workflow.processes.start', processData);
  }
} 