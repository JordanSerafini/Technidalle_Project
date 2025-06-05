export interface DocumentLine {
  id?: number;
  document_id: number;
  material_id?: number | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percent?: number | null;
  discount_amount?: number | null;
  tax_rate?: number | null;
  sort_order?: number | null;
  created_at?: Date;
  updated_at?: Date;
}
