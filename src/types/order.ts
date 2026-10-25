export type DeliveryStage = 
  | 'ORDER_PLACED'
  | 'PENDING_APPROVAL'
  | 'ACCEPTED'
  | 'STOCK_ALLOCATED'
  | 'PACKING_IN_PROGRESS'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'CANCELLED';

export interface DeliveryStageHistory {
  stage: DeliveryStage;
  timestamp: string;
  updatedByUserId: string;
  updatedByUserName: string;
  notes?: string;
  location?: string;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'VERIFICATION_REQUIRED' | 'FAILED';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  packSize: string;
  quantity: number;
  unitPrice: number; // Wholesale or retail tier
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount: number;
  totalAmount: number;
  allocatedBatchNumber?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // e.g. "SO-2026-0129"
  retailerId: string;
  retailerShopName: string;
  retailerOwnerName: string;
  retailerPhone: string;
  deliveryAddress: string;
  area: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  salesRepId?: string;
  salesRepName?: string;
  assignedDeliveryPersonId?: string;
  assignedDeliveryPersonName?: string;
  items: OrderItem[];
  subTotal: number;
  totalDiscount: number;
  taxableSubtotal: number;
  totalGst: number;
  deliveryFee: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  dueAmount: number;
  currentStage: DeliveryStage;
  stageHistory: DeliveryStageHistory[];
  invoiceId?: string;
  invoiceNumber?: string;
  cancellationReason?: string;
  deliveryConfirmationNotes?: string;
  recipientSignatureName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0098"
  orderId: string;
  orderNumber: string;
  invoiceDate: string;
  dueDate: string;
  retailerId: string;
  retailerShopName: string;
  retailerGstin?: string;
  billingAddress: string;
  items: OrderItem[];
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  roundOff: number;
  totalInvoiceAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  isPostedToLedger: boolean;
  createdAt: string;
}
