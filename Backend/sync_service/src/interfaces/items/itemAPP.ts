import { Item } from './itemEBP';

export class ItemAPP {
  id?: number;
  name?: string;
  description?: string;
  reference?: string;
  unit?: string;
  price?: number;
  stock_quantity?: number;
  minimum_stock?: number;
  supplier?: string;
  supplier_reference?: string;
  created_at?: Date;
  updated_at?: Date;

  // Champs de mapping pour la synchronisation
  ebp_id?: string;
  ebp_unique_id?: string;
  synced_at?: Date;
  synced_by_device_id?: string;

  // Méthode pour mapper un Item EBP vers un Item APP
  static fromEBP(itemEBP: Item): ItemAPP {
    const itemAPP = new ItemAPP();

    itemAPP.ebp_id = itemEBP.Id;
    itemAPP.ebp_unique_id = itemEBP.UniqueId;
    itemAPP.name = itemEBP.Caption;
    itemAPP.description = itemEBP.DesCom;
    itemAPP.reference = itemEBP.Id;
    itemAPP.unit = 'unité';
    itemAPP.price = itemEBP.SalePriceVatExcluded;
    itemAPP.stock_quantity = itemEBP.RealStock || 0;
    itemAPP.minimum_stock = 0;
    itemAPP.supplier = itemEBP.SupplierId;
    itemAPP.supplier_reference = '';

    return itemAPP;
  }

  // Méthode pour convertir l'objet en format d'insertion BDD
  toDBObject(): any {
    return {
      name: this.name || 'Article sans nom',
      description: this.description,
      reference: this.reference,
      unit: this.unit || 'unité',
      price: this.price || 0,
      stock_quantity: this.stock_quantity || 0,
      minimum_stock: this.minimum_stock || 0,
      supplier: this.supplier,
      supplier_reference: this.supplier_reference,
      // Les champs created_at et updated_at sont gérés automatiquement par la BDD
    };
  }
}
