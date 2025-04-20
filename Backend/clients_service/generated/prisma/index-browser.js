
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AddressesScalarFieldEnum = {
  id: 'id',
  street_number: 'street_number',
  street_name: 'street_name',
  additional_address: 'additional_address',
  zip_code: 'zip_code',
  city: 'city',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.ClientsScalarFieldEnum = {
  id: 'id',
  company_name: 'company_name',
  firstname: 'firstname',
  lastname: 'lastname',
  email: 'email',
  phone: 'phone',
  mobile: 'mobile',
  address_id: 'address_id',
  siret: 'siret',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Document_tagsScalarFieldEnum = {
  document_id: 'document_id',
  tag_id: 'tag_id',
  created_at: 'created_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.DocumentsScalarFieldEnum = {
  id: 'id',
  project_id: 'project_id',
  client_id: 'client_id',
  type: 'type',
  reference: 'reference',
  status: 'status',
  amount: 'amount',
  tva_rate: 'tva_rate',
  issue_date: 'issue_date',
  due_date: 'due_date',
  payment_date: 'payment_date',
  payment_method: 'payment_method',
  payment_terms: 'payment_terms',
  discount_rate: 'discount_rate',
  discount_amount: 'discount_amount',
  payment_status: 'payment_status',
  amount_paid: 'amount_paid',
  balance_due: 'balance_due',
  legal_mentions: 'legal_mentions',
  validity_period: 'validity_period',
  signed_by_client: 'signed_by_client',
  signed_date: 'signed_date',
  approved_by_staff_id: 'approved_by_staff_id',
  electronic_signature_path: 'electronic_signature_path',
  version: 'version',
  parent_document_id: 'parent_document_id',
  revision_reason: 'revision_reason',
  quotation_id: 'quotation_id',
  purchase_order_reference: 'purchase_order_reference',
  delivery_address_id: 'delivery_address_id',
  delivery_date: 'delivery_date',
  shipping_costs: 'shipping_costs',
  notes: 'notes',
  file_path: 'file_path',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.EventsScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  event_type: 'event_type',
  start_date: 'start_date',
  end_date: 'end_date',
  all_day: 'all_day',
  location: 'location',
  project_id: 'project_id',
  staff_id: 'staff_id',
  client_id: 'client_id',
  status: 'status',
  color: 'color',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.MaterialsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  reference: 'reference',
  unit: 'unit',
  price: 'price',
  stock_quantity: 'stock_quantity',
  minimum_stock: 'minimum_stock',
  supplier: 'supplier',
  supplier_reference: 'supplier_reference',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Project_materialsScalarFieldEnum = {
  id: 'id',
  project_id: 'project_id',
  material_id: 'material_id',
  stage_id: 'stage_id',
  quantity_planned: 'quantity_planned',
  quantity_used: 'quantity_used',
  unit_price: 'unit_price',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Project_mediaScalarFieldEnum = {
  id: 'id',
  project_id: 'project_id',
  stage_id: 'stage_id',
  staff_id: 'staff_id',
  media_type: 'media_type',
  file_path: 'file_path',
  description: 'description',
  created_at: 'created_at',
  updated_at: 'updated_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.Project_staffScalarFieldEnum = {
  id: 'id',
  project_id: 'project_id',
  staff_id: 'staff_id',
  stage_id: 'stage_id',
  role_description: 'role_description',
  start_date: 'start_date',
  end_date: 'end_date',
  hours_planned: 'hours_planned',
  hours_worked: 'hours_worked',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Project_stagesScalarFieldEnum = {
  id: 'id',
  project_id: 'project_id',
  name: 'name',
  description: 'description',
  start_date: 'start_date',
  end_date: 'end_date',
  status: 'status',
  order_index: 'order_index',
  estimated_duration: 'estimated_duration',
  actual_duration: 'actual_duration',
  completion_percentage: 'completion_percentage',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.Project_tagsScalarFieldEnum = {
  project_id: 'project_id',
  tag_id: 'tag_id',
  created_at: 'created_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.ProjectsScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  name: 'name',
  description: 'description',
  client_id: 'client_id',
  address_id: 'address_id',
  status: 'status',
  start_date: 'start_date',
  end_date: 'end_date',
  estimated_duration: 'estimated_duration',
  budget: 'budget',
  actual_cost: 'actual_cost',
  margin: 'margin',
  priority: 'priority',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.RolesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Site_reportsScalarFieldEnum = {
  id: 'id',
  project_id: 'project_id',
  staff_id: 'staff_id',
  stage_id: 'stage_id',
  report_type: 'report_type',
  description: 'description',
  status: 'status',
  created_at: 'created_at',
  updated_at: 'updated_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.StaffScalarFieldEnum = {
  id: 'id',
  firstname: 'firstname',
  lastname: 'lastname',
  email: 'email',
  role_id: 'role_id',
  phone: 'phone',
  mobile: 'mobile',
  address_id: 'address_id',
  hire_date: 'hire_date',
  is_available: 'is_available',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Stage_checklistsScalarFieldEnum = {
  id: 'id',
  stage_id: 'stage_id',
  label: 'label',
  is_done: 'is_done',
  staff_id: 'staff_id',
  comment: 'comment',
  created_at: 'created_at',
  updated_at: 'updated_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.Stage_tagsScalarFieldEnum = {
  stage_id: 'stage_id',
  tag_id: 'tag_id',
  created_at: 'created_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.TagsScalarFieldEnum = {
  id: 'id',
  label: 'label',
  color: 'color',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.TasksScalarFieldEnum = {
  id: 'id',
  stage_id: 'stage_id',
  label: 'label',
  description: 'description',
  assigned_to: 'assigned_to',
  due_date: 'due_date',
  status: 'status',
  priority: 'priority',
  created_at: 'created_at',
  updated_at: 'updated_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.Time_logsScalarFieldEnum = {
  id: 'id',
  staff_id: 'staff_id',
  project_id: 'project_id',
  stage_id: 'stage_id',
  check_in: 'check_in',
  check_out: 'check_out',
  comment: 'comment',
  gps_lat: 'gps_lat',
  gps_long: 'gps_long',
  created_at: 'created_at',
  updated_at: 'updated_at',
  synced_at: 'synced_at',
  synced_by_device_id: 'synced_by_device_id'
};

exports.Prisma.Document_linesScalarFieldEnum = {
  id: 'id',
  document_id: 'document_id',
  material_id: 'material_id',
  description: 'description',
  quantity: 'quantity',
  unit: 'unit',
  unit_price: 'unit_price',
  discount_percent: 'discount_percent',
  discount_amount: 'discount_amount',
  tax_rate: 'tax_rate',
  total_ht: 'total_ht',
  sort_order: 'sort_order',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Vehicle_incidentsScalarFieldEnum = {
  id: 'id',
  vehicle_id: 'vehicle_id',
  staff_id: 'staff_id',
  incident_date: 'incident_date',
  incident_type: 'incident_type',
  location: 'location',
  description: 'description',
  severity: 'severity',
  mileage: 'mileage',
  cost_of_repairs: 'cost_of_repairs',
  reported_to_insurance: 'reported_to_insurance',
  insurance_claim_number: 'insurance_claim_number',
  resolution_status: 'resolution_status',
  resolution_date: 'resolution_date',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Vehicle_maintenanceScalarFieldEnum = {
  id: 'id',
  vehicle_id: 'vehicle_id',
  maintenance_type: 'maintenance_type',
  maintenance_date: 'maintenance_date',
  mileage_at_maintenance: 'mileage_at_maintenance',
  description: 'description',
  cost: 'cost',
  performed_by: 'performed_by',
  next_maintenance_date: 'next_maintenance_date',
  next_maintenance_mileage: 'next_maintenance_mileage',
  invoice_reference: 'invoice_reference',
  document_path: 'document_path',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Vehicle_refuelingScalarFieldEnum = {
  id: 'id',
  vehicle_id: 'vehicle_id',
  refuel_date: 'refuel_date',
  mileage: 'mileage',
  quantity: 'quantity',
  price_per_liter: 'price_per_liter',
  total_cost: 'total_cost',
  staff_id: 'staff_id',
  fuel_type: 'fuel_type',
  station: 'station',
  full_tank: 'full_tank',
  project_id: 'project_id',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.Vehicle_reservationsScalarFieldEnum = {
  id: 'id',
  vehicle_id: 'vehicle_id',
  staff_id: 'staff_id',
  project_id: 'project_id',
  start_date: 'start_date',
  end_date: 'end_date',
  starting_mileage: 'starting_mileage',
  ending_mileage: 'ending_mileage',
  purpose: 'purpose',
  status: 'status',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.VehiclesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  brand: 'brand',
  model: 'model',
  registration_number: 'registration_number',
  year_of_manufacture: 'year_of_manufacture',
  purchase_date: 'purchase_date',
  purchase_price: 'purchase_price',
  status: 'status',
  mileage: 'mileage',
  fuel_type: 'fuel_type',
  fuel_capacity: 'fuel_capacity',
  average_consumption: 'average_consumption',
  next_technical_control: 'next_technical_control',
  insurance_number: 'insurance_number',
  insurance_expiry_date: 'insurance_expiry_date',
  notes: 'notes',
  created_at: 'created_at',
  updated_at: 'updated_at'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.document_type = exports.$Enums.document_type = {
  devis: 'devis',
  facture: 'facture',
  bon_de_commande: 'bon_de_commande',
  bon_de_livraison: 'bon_de_livraison',
  fiche_technique: 'fiche_technique',
  photo_chantier: 'photo_chantier',
  plan: 'plan',
  avoir: 'avoir',
  acompte: 'acompte',
  situation: 'situation',
  autre: 'autre'
};

exports.document_status = exports.$Enums.document_status = {
  brouillon: 'brouillon',
  en_attente: 'en_attente',
  valide: 'valide',
  refuse: 'refuse',
  annule: 'annule'
};

exports.event_type = exports.$Enums.event_type = {
  appel_telephonique: 'appel_telephonique',
  reunion_chantier: 'reunion_chantier',
  visite_technique: 'visite_technique',
  rendez_vous_client: 'rendez_vous_client',
  reunion_interne: 'reunion_interne',
  formation: 'formation',
  livraison_materiaux: 'livraison_materiaux',
  intervention_urgente: 'intervention_urgente',
  maintenance: 'maintenance',
  autre: 'autre'
};

exports.project_status = exports.$Enums.project_status = {
  prospect: 'prospect',
  devis_en_cours: 'devis_en_cours',
  devis_accepte: 'devis_accepte',
  en_preparation: 'en_preparation',
  en_cours: 'en_cours',
  en_pause: 'en_pause',
  termine: 'termine',
  annule: 'annule'
};

exports.vehicle_type = exports.$Enums.vehicle_type = {
  voiture: 'voiture',
  utilitaire: 'utilitaire',
  camion: 'camion',
  engin_chantier: 'engin_chantier',
  remorque: 'remorque',
  autre: 'autre'
};

exports.vehicle_status = exports.$Enums.vehicle_status = {
  disponible: 'disponible',
  en_mission: 'en_mission',
  en_entretien: 'en_entretien',
  hors_service: 'hors_service',
  reserve: 'reserve'
};

exports.Prisma.ModelName = {
  addresses: 'addresses',
  clients: 'clients',
  document_tags: 'document_tags',
  documents: 'documents',
  events: 'events',
  materials: 'materials',
  project_materials: 'project_materials',
  project_media: 'project_media',
  project_staff: 'project_staff',
  project_stages: 'project_stages',
  project_tags: 'project_tags',
  projects: 'projects',
  roles: 'roles',
  site_reports: 'site_reports',
  staff: 'staff',
  stage_checklists: 'stage_checklists',
  stage_tags: 'stage_tags',
  tags: 'tags',
  tasks: 'tasks',
  time_logs: 'time_logs',
  document_lines: 'document_lines',
  vehicle_incidents: 'vehicle_incidents',
  vehicle_maintenance: 'vehicle_maintenance',
  vehicle_refueling: 'vehicle_refueling',
  vehicle_reservations: 'vehicle_reservations',
  vehicles: 'vehicles'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
