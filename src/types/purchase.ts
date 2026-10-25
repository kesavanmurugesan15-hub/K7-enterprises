export interface Supplier {
  id: string;
  name: string; // e.g. "Aachi Spices & Foods Pvt Ltd - Chennai Hub / Madurai Depot"
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  gstin: string;
  panNumber?: string;
  paymentTermsDays: number;
  currentOutstandingBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  packSize: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitRate: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  batchNumber?: string;
  expDate?: string;
}

export type POStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. "PO-2026-0042"
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  subTotal: number;
  totalGstAmount: number;
  roundOff: number;
  grandTotal: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  goodsReceipts?: string[]; // GRN IDs
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string; // e.g. "GRN-2026-0038"
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  supplierInvoiceDate: string;
  receivedDate: string;
  receivedBy: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    packSize: string;
    receivedQuantity: number;
    acceptedQuantity: number;
    rejectedQuantity: number;
    unitRate: number;
    batchNumber: string;
    mfgDate: string;
    expDate: string;
    gstPercent: number;
    taxableAmount: number;
    gstAmount: number;
    totalAmount: number;
  }[];
  totalTaxable: number;
  totalGst: number;
  freightCharges: number;
  grandTotal: number;
  isPostedToStock: boolean;
  isPostedToAccounts: boolean;
  notes?: string;
  createdAt: string;
}
