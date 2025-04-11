export interface Material {
  id: number;
  name: string;
  description?: string;
  reference?: string;
  unit: string;
  price?: number;
  stock_quantity?: number;
  minimum_stock?: number;
  supplier?: string;
  supplier_reference?: string;
  created_at?: Date;
  updated_at?: Date;
}


export class UpdateMaterialDto {
  name?: string;
  description?: string;
  unit?: string;
  unitPrice?: number;
  supplier?: string;
  supplier_reference?: string;
}

export interface ProjectMaterial {
  id: number;
  project_id: number;
  material_id: number;
  stage_id?: number;
  quantity_planned: number;
  quantity_used?: number;
  unit_price: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  materials?: Material;
}


export class UpdateProjectMaterialDto {
  quantity?: number;
}
