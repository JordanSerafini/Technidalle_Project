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

-- Table des documents (devis, factures, etc.)
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
    notes TEXT,
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
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

-- Création des index
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_status ON documents(status);
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

COMMIT; 