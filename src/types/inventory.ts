export type MovementType = 
  | 'PURCHASE_RECEIPT'
  | 'SALES_DISPATCH'
  | 'STOCK_RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'SALES_RETURN'
  | 'PURCHASE_RETURN'
  | 'DAMAGE_ADJUSTMENT'
  | 'EXPIRED_WRITE_OFF'
  | 'PHYSICAL_AUDIT_ADJUSTMENT';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  batchNumber?: string;
  movementType: MovementType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  referenceType: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'SALES_ORDER' | 'SALES_INVOICE' | 'RETURN' | 'MANUAL_ADJUSTMENT';
  referenceId: string;
  referenceNumber: string;
  performedByUserId: string;
  performedByUserName: string;
  notes?: string;
  timestamp: string;
}

export interface StockValuationSummary {
  totalItems: number;
  totalQuantity: number;
  totalInventoryValue: number; // calculated at weighted avg or purchase rate
  lowStockItemsCount: number;
  nearExpiryItemsCount: number;
}
