export interface SaleDocumentLine {
  Id: string;
  DocumentId: string;
  ItemId?: string | null;
  DescriptionClear?: string | null;
  Quantity?: number | null;
  UnitId?: string | null;
  PurchasePrice?: number | null;
  DiscountRate?: number | null;
}
