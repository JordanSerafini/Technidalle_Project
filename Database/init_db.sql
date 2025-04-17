BEGIN;

-- Types ENUM améliorés
DO $$ 
BEGIN
    -- Statut des projets
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'prospect',
            'devis_en_cours',
            'devis_accepte',
            'en_preparation',
            'en_cours',
            'en_pause',
            'termine',
            'annule'
        );
    END IF;

    -- Types de documents
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM (
            'devis',
            'facture',
            'bon_de_commande',
            'bon_de_livraison',
            'fiche_technique',
            'photo_chantier',
            'plan',
            'avoir',
            'acompte',
            'situation',
            'autre'
        );
    END IF;

    -- Statut des documents
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM (
            'brouillon',
            'en_attente',
            'valide',
            'refuse',
            'annule'
        );
    END IF;

    -- Types d'événements
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM (
            'appel_telephonique',
            'reunion_chantier',
            'visite_technique',
            'rendez_vous_client',
            'reunion_interne',
            'formation',
            'livraison_materiaux',
            'intervention_urgente',
            'maintenance',
            'autre'
        );
    END IF;

    -- Types de véhicules
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_type') THEN
        CREATE TYPE vehicle_type AS ENUM (
            'voiture',
            'utilitaire',
            'camion',
            'engin_chantier',
            'remorque',
            'autre'
        );
    END IF;

    -- Statut des véhicules
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM (
            'disponible',
            'en_mission',
            'en_entretien',
            'hors_service',
            'reserve'
        );
    END IF;
END $$;

-- Table des adresses améliorée
CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    street_number VARCHAR(10),
    street_name VARCHAR(255) NOT NULL,
    additional_address VARCHAR(255),
    zip_code VARCHAR(10) NOT NULL CHECK (zip_code ~ '^[0-9]{5}$'),
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'France',
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des clients améliorée
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255),
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone VARCHAR(20) CHECK (phone ~ '^[0-9+\s]{10,15}$'),
    mobile VARCHAR(20) CHECK (mobile ~ '^[0-9+\s]{10,15}$'),
    address_id INTEGER,
    siret VARCHAR(14) CHECK (siret ~ '^[0-9]{14}$'),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

-- Table des projets (principale)
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id INTEGER NOT NULL,
    address_id INTEGER,
    status project_status DEFAULT 'prospect',
    start_date DATE,
    end_date DATE,
    estimated_duration INT, -- en jours
    budget DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    margin DECIMAL(12,2),
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL,
    CONSTRAINT check_project_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Table des rôles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table du personnel
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    role_id INTEGER NOT NULL,
    phone VARCHAR(20) CHECK (phone ~ '^[0-9+\s]{10,15}$'),
    mobile VARCHAR(20) CHECK (mobile ~ '^[0-9+\s]{10,15}$'),
    address_id INTEGER,
    hire_date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_staff_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

-- Table des documents (devis, factures, etc.) - Maintenant après staff
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    client_id INTEGER,
    type document_type NOT NULL,
    reference VARCHAR(50) UNIQUE NOT NULL,
    status document_status DEFAULT 'brouillon',
    amount DECIMAL(12,2) CHECK (amount >= 0),
    tva_rate DECIMAL(5,2) DEFAULT 20.00 CHECK (tva_rate >= 0),
    issue_date DATE NOT NULL,
    due_date DATE,
    payment_date DATE,
    payment_method VARCHAR(50),
    -- Nouvelles colonnes pour documents de vente
    payment_terms VARCHAR(100),
    discount_rate DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'non_payé',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2),
    legal_mentions TEXT,
    validity_period INTEGER,
    signed_by_client BOOLEAN DEFAULT false,
    signed_date DATE,
    approved_by_staff_id INTEGER,
    electronic_signature_path VARCHAR(255),
    version INTEGER DEFAULT 1,
    parent_document_id INTEGER,
    revision_reason TEXT,
    quotation_id INTEGER,
    purchase_order_reference VARCHAR(100),
    delivery_address_id INTEGER,
    delivery_date DATE,
    shipping_costs DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_staff FOREIGN KEY (approved_by_staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_quotation FOREIGN KEY (quotation_id) REFERENCES documents(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_parent FOREIGN KEY (parent_document_id) REFERENCES documents(id) ON DELETE SET NULL,
    CONSTRAINT fk_document_delivery_address FOREIGN KEY (delivery_address_id) REFERENCES addresses(id) ON DELETE SET NULL
);

-- Table des matériaux
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    reference VARCHAR(50) UNIQUE,
    unit VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) CHECK (price >= 0),
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    minimum_stock INT DEFAULT 0 CHECK (minimum_stock >= 0),
    supplier VARCHAR(255),
    supplier_reference VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des lignes de documents (devis, factures, etc.)
CREATE TABLE IF NOT EXISTS document_lines (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL,
    material_id INTEGER,
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_percent DECIMAL(5,2) DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    tax_rate DECIMAL(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0),
    total_ht DECIMAL(12,2) GENERATED ALWAYS AS (
        quantity * unit_price * (1 - discount_percent/100) - discount_amount
    ) STORED,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_line_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_line_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT
);

-- Table des étapes du projet
CREATE TABLE IF NOT EXISTS project_stages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'non_commencee',
    order_index INTEGER NOT NULL,
    estimated_duration INT, -- en jours
    actual_duration INT, -- en jours
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stage_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT check_stage_dates CHECK (end_date IS NULL OR end_date >= start_date),
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100)
);



-- Table de liaison projet-matériaux
CREATE TABLE IF NOT EXISTS project_materials (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    stage_id INTEGER,
    quantity_planned INT NOT NULL CHECK (quantity_planned > 0),
    quantity_used INT DEFAULT 0 CHECK (quantity_used >= 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_material_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_material_material FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_material_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE SET NULL
);

-- Table de liaison projet-personnel
CREATE TABLE IF NOT EXISTS project_staff (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    stage_id INTEGER,
    role_description VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    hours_planned INT,
    hours_worked INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_staff_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_staff_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_staff_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE SET NULL,
    CONSTRAINT check_project_staff_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Table des événements
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type event_type NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT false,
    location VARCHAR(255),
    project_id INTEGER,
    staff_id INTEGER,
    client_id INTEGER,
    status VARCHAR(50) DEFAULT 'planifié',
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT check_event_dates CHECK (end_date >= start_date)
);

-- Table des médias de projet (photos, vidéos, notes audio)
CREATE TABLE IF NOT EXISTS project_media (
    id SERIAL PRIMARY KEY,
    project_id INTEGER,
    stage_id INTEGER,
    staff_id INTEGER,
    media_type VARCHAR(50) CHECK (media_type IN ('photo', 'video', 'audio', 'autre')),
    file_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE SET NULL,
    CONSTRAINT fk_pm_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100)
);

-- Table des pointages / time tracking mobile
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    stage_id INTEGER,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP,
    comment TEXT,
    gps_lat DECIMAL(9,6),
    gps_long DECIMAL(9,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tl_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tl_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tl_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE SET NULL,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100)
);

-- Table des checklists par étape
CREATE TABLE IF NOT EXISTS stage_checklists (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    is_done BOOLEAN DEFAULT false,
    staff_id INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sc_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE CASCADE,
    CONSTRAINT fk_sc_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100)
);

-- Table des rapports de chantier (incidents, remarques, etc.)
CREATE TABLE IF NOT EXISTS site_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    staff_id INTEGER,
    stage_id INTEGER,
    report_type VARCHAR(50) CHECK (report_type IN ('incident', 'remarque', 'photo', 'alerte')),
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'ouvert',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sr_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_sr_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_sr_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE SET NULL,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100)
);

-- Table des tâches unitaires
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    stage_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    assigned_to INTEGER,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'à_faire',
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100),
    CONSTRAINT fk_task_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_staff FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL
);

-- Table des tags
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    label VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison projets-tags
CREATE TABLE IF NOT EXISTS project_tags (
    project_id INTEGER,
    tag_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100),
    PRIMARY KEY (project_id, tag_id),
    CONSTRAINT fk_pt_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Table de liaison étapes-tags
CREATE TABLE IF NOT EXISTS stage_tags (
    stage_id INTEGER,
    tag_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100),
    PRIMARY KEY (stage_id, tag_id),
    CONSTRAINT fk_st_stage FOREIGN KEY (stage_id) REFERENCES project_stages(id) ON DELETE CASCADE,
    CONSTRAINT fk_st_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Table de liaison documents-tags
CREATE TABLE IF NOT EXISTS document_tags (
    document_id INTEGER,
    tag_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    synced_by_device_id VARCHAR(100),
    PRIMARY KEY (document_id, tag_id),
    CONSTRAINT fk_dt_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_dt_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Table des véhicules
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type vehicle_type NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    year_of_manufacture INTEGER CHECK (year_of_manufacture > 1900),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    status vehicle_status DEFAULT 'disponible',
    mileage INTEGER DEFAULT 0 CHECK (mileage >= 0),
    fuel_type VARCHAR(20),
    fuel_capacity DECIMAL(6,2), -- en litres
    average_consumption DECIMAL(4,2), -- en L/100km
    next_technical_control DATE,
    insurance_number VARCHAR(100),
    insurance_expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des entretiens de véhicules
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    maintenance_date DATE NOT NULL,
    mileage_at_maintenance INTEGER NOT NULL CHECK (mileage_at_maintenance >= 0),
    description TEXT,
    cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
    performed_by VARCHAR(100),
    next_maintenance_date DATE,
    next_maintenance_mileage INTEGER CHECK (next_maintenance_mileage >= 0),
    invoice_reference VARCHAR(50),
    document_path VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- Table des pleins d'essence/carburant
CREATE TABLE IF NOT EXISTS vehicle_refueling (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    refuel_date DATE NOT NULL,
    mileage INTEGER NOT NULL CHECK (mileage >= 0),
    quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0), -- en litres
    price_per_liter DECIMAL(6,3) NOT NULL CHECK (price_per_liter > 0),
    total_cost DECIMAL(10,2) NOT NULL CHECK (total_cost > 0),
    staff_id INTEGER,
    fuel_type VARCHAR(20),
    station VARCHAR(100),
    full_tank BOOLEAN DEFAULT true,
    project_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_refueling_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_vehicle_refueling_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT fk_vehicle_refueling_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- Table des réservations de véhicules
CREATE TABLE IF NOT EXISTS vehicle_reservations (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    staff_id INTEGER NOT NULL,
    project_id INTEGER,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    starting_mileage INTEGER,
    ending_mileage INTEGER,
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'planifiée',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_reservation_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_vehicle_reservation_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE RESTRICT,
    CONSTRAINT fk_vehicle_reservation_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT check_vehicle_reservation_dates CHECK (end_date > start_date)
);

-- Table des incidents véhicules
CREATE TABLE IF NOT EXISTS vehicle_incidents (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    staff_id INTEGER,
    incident_date TIMESTAMP NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    description TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('mineur', 'modéré', 'sévère', 'critique')),
    mileage INTEGER CHECK (mileage >= 0),
    cost_of_repairs DECIMAL(10,2),
    reported_to_insurance BOOLEAN DEFAULT false,
    insurance_claim_number VARCHAR(50),
    resolution_status VARCHAR(50) DEFAULT 'en_cours',
    resolution_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_incident_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT fk_vehicle_incident_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL
);

-- Fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création des triggers pour updated_at
CREATE TRIGGER update_addresses_timestamp BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_clients_timestamp BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_documents_timestamp BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_document_lines_timestamp BEFORE UPDATE ON document_lines
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_stages_timestamp BEFORE UPDATE ON project_stages
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_materials_timestamp BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_materials_timestamp BEFORE UPDATE ON project_materials
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_roles_timestamp BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_staff_timestamp BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_staff_timestamp BEFORE UPDATE ON project_staff
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_events_timestamp BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_project_media_timestamp BEFORE UPDATE ON project_media
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_time_logs_timestamp BEFORE UPDATE ON time_logs
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_stage_checklists_timestamp BEFORE UPDATE ON stage_checklists
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_site_reports_timestamp BEFORE UPDATE ON site_reports
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tags_timestamp BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicles_timestamp BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicle_maintenance_timestamp BEFORE UPDATE ON vehicle_maintenance
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicle_refueling_timestamp BEFORE UPDATE ON vehicle_refueling
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicle_reservations_timestamp BEFORE UPDATE ON vehicle_reservations
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vehicle_incidents_timestamp BEFORE UPDATE ON vehicle_incidents
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Création des index
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_document_lines_document ON document_lines(document_id);
CREATE INDEX idx_document_lines_material ON document_lines(material_id);
CREATE INDEX idx_project_stages_project ON project_stages(project_id);
CREATE INDEX idx_project_materials_project ON project_materials(project_id);
CREATE INDEX idx_project_materials_material ON project_materials(material_id);
CREATE INDEX idx_project_staff_project ON project_staff(project_id);
CREATE INDEX idx_project_staff_staff ON project_staff(staff_id);
CREATE INDEX idx_events_project ON events(project_id);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_project_media_project ON project_media(project_id);
CREATE INDEX idx_project_media_stage ON project_media(stage_id);
CREATE INDEX idx_project_media_staff ON project_media(staff_id);
CREATE INDEX idx_time_logs_staff ON time_logs(staff_id);
CREATE INDEX idx_time_logs_project ON time_logs(project_id);
CREATE INDEX idx_time_logs_dates ON time_logs(check_in, check_out);
CREATE INDEX idx_stage_checklists_stage ON stage_checklists(stage_id);
CREATE INDEX idx_stage_checklists_staff ON stage_checklists(staff_id);
CREATE INDEX idx_site_reports_project ON site_reports(project_id);
CREATE INDEX idx_site_reports_staff ON site_reports(staff_id);
CREATE INDEX idx_site_reports_status ON site_reports(status);
CREATE INDEX idx_tasks_stage ON tasks(stage_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_synced ON tasks(synced_at);
CREATE INDEX idx_project_tags_project ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag ON project_tags(tag_id);
CREATE INDEX idx_project_tags_synced ON project_tags(synced_at);
CREATE INDEX idx_stage_tags_stage ON stage_tags(stage_id);
CREATE INDEX idx_stage_tags_tag ON stage_tags(tag_id);
CREATE INDEX idx_stage_tags_synced ON stage_tags(synced_at);
CREATE INDEX idx_document_tags_document ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag ON document_tags(tag_id);
CREATE INDEX idx_document_tags_synced ON document_tags(synced_at);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_vehicle_maintenance_date ON vehicle_maintenance(maintenance_date);
CREATE INDEX idx_vehicle_refueling_vehicle ON vehicle_refueling(vehicle_id);
CREATE INDEX idx_vehicle_refueling_date ON vehicle_refueling(refuel_date);
CREATE INDEX idx_vehicle_reservations_vehicle ON vehicle_reservations(vehicle_id);
CREATE INDEX idx_vehicle_reservations_staff ON vehicle_reservations(staff_id);
CREATE INDEX idx_vehicle_reservations_project ON vehicle_reservations(project_id);
CREATE INDEX idx_vehicle_reservations_dates ON vehicle_reservations(start_date, end_date);
CREATE INDEX idx_vehicle_incidents_vehicle ON vehicle_incidents(vehicle_id);
CREATE INDEX idx_vehicle_incidents_staff ON vehicle_incidents(staff_id);
CREATE INDEX idx_vehicle_incidents_date ON vehicle_incidents(incident_date);
CREATE INDEX idx_vehicle_incidents_status ON vehicle_incidents(resolution_status);

-- Insertion des rôles par défaut
INSERT INTO roles (name, description) VALUES 
    ('ADMIN', 'Administrateur avec tous les droits'),
    ('MANAGER', 'Responsable de chantier'),
    ('TECHNICIEN', 'Technicien de chantier'),
    ('COMMERCIAL', 'Commercial'),
    ('COMPTABLE', 'Comptabilité')
ON CONFLICT (name) DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE projects IS 'Table principale des projets/chantiers';
COMMENT ON TABLE documents IS 'Documents associés aux projets (devis, factures, etc.)';
COMMENT ON TABLE document_lines IS 'Lignes détaillées des documents (devis, factures, etc.)';
COMMENT ON TABLE project_stages IS 'Étapes de réalisation des projets';
COMMENT ON TABLE materials IS 'Catalogue des matériaux';
COMMENT ON TABLE project_materials IS 'Utilisation des matériaux dans les projets';
COMMENT ON TABLE staff IS 'Personnel de l''entreprise';
COMMENT ON TABLE project_staff IS 'Assignation du personnel aux projets';
COMMENT ON TABLE events IS 'Événements et rendez-vous';
COMMENT ON TABLE project_media IS 'Médias associés aux projets (photos, vidéos, notes audio)';
COMMENT ON TABLE time_logs IS 'Pointages et suivi du temps sur chantier';
COMMENT ON TABLE stage_checklists IS 'Checklists pour les étapes de projet';
COMMENT ON TABLE site_reports IS 'Rapports d''incidents et remarques sur chantier';
COMMENT ON TABLE tasks IS 'Tâches unitaires à réaliser dans une étape de projet';
COMMENT ON TABLE tags IS 'Étiquettes pour catégoriser les projets, étapes et documents';
COMMENT ON TABLE project_tags IS 'Association entre projets et étiquettes';
COMMENT ON TABLE stage_tags IS 'Association entre étapes et étiquettes';
COMMENT ON TABLE document_tags IS 'Association entre documents et étiquettes';
COMMENT ON TABLE vehicles IS 'Gestion de la flotte de véhicules';
COMMENT ON TABLE vehicle_maintenance IS 'Suivi des entretiens et réparations des véhicules';
COMMENT ON TABLE vehicle_refueling IS 'Suivi des pleins de carburant';
COMMENT ON TABLE vehicle_reservations IS 'Réservations et utilisation des véhicules';
COMMENT ON TABLE vehicle_incidents IS 'Incidents et accidents impliquant les véhicules';

COMMIT; 