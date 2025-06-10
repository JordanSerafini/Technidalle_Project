import { BaseMapper } from './base.mapper';
import { SaleDocumentLine } from '../../interfaces/documents/saleDocumentLine.interface';
import { DocumentLine } from '../../interfaces/documents/documentLine.interface';

export class SaleDocumentLineToDocumentLineMapper extends BaseMapper<
  SaleDocumentLine,
  Partial<DocumentLine>
> {
  map(
    line: SaleDocumentLine,
    documentId: number,
    materialId?: number | null,
    existing?: Partial<DocumentLine>,
  ): Partial<DocumentLine> {
    const mapped: Partial<DocumentLine> = {
      ...existing,
      document_id: documentId,
      material_id: materialId ?? existing?.material_id,
      description: line.DescriptionClear || existing?.description || '',
      quantity:
        line.Quantity !== undefined && line.Quantity !== null
          ? Number(line.Quantity)
          : existing?.quantity,
      unit: line.UnitId || existing?.unit || 'U',
      unit_price:
        line.PurchasePrice !== undefined && line.PurchasePrice !== null
          ? Number(line.PurchasePrice)
          : existing?.unit_price,
      discount_percent:
        line.DiscountRate !== undefined && line.DiscountRate !== null
          ? Number(line.DiscountRate)
          : existing?.discount_percent,
    };

    return this.cleanUndefinedProperties(mapped);
  }

  // Static helpers
  static toDocumentLineEntity(
    line: SaleDocumentLine,
    documentId: number,
    materialId?: number | null,
    existing?: Partial<DocumentLine>,
  ): Partial<DocumentLine> {
    return SaleDocumentLineToDocumentLineMapper.getInstance().map(
      line,
      documentId,
      materialId,
      existing,
    );
  }

  private static instance: SaleDocumentLineToDocumentLineMapper;
  static getInstance(): SaleDocumentLineToDocumentLineMapper {
    if (!SaleDocumentLineToDocumentLineMapper.instance) {
      SaleDocumentLineToDocumentLineMapper.instance = new SaleDocumentLineToDocumentLineMapper();
    }
    return SaleDocumentLineToDocumentLineMapper.instance;
  }
}
