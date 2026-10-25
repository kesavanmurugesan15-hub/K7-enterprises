export interface CustomerCreditProfile {
  retailerId: string;
  retailerShopName: string;
  creditLimit: number;
  creditDays: number;
  totalInvoiced: number;
  totalCollected: number;
  currentOutstanding: number;
  availableCredit: number;
  isCreditExceeded: boolean;
  ageing: {
    current_0_30: number;
    days_31_60: number;
    days_61_90: number;
    days_90_plus: number;
  };
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export interface CollectionReceipt {
  id: string;
  receiptNumber: string; // "REC-2026-0082"
  date: string;
  retailerId: string;
  retailerShopName: string;
  amount: number;
  paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
  referenceNumber: string; // UTR or Cheque no
  depositToAccountId: string; // Cash in hand or Bank GL account
  settledInvoices: {
    invoiceId: string;
    invoiceNumber: string;
    allocatedAmount: number;
  }[];
  collectedByUserId: string;
  collectedByUserName: string;
  notes?: string;
  isVerified: boolean;
  isPostedToLedger: boolean;
  createdAt: string;
}

export interface PettyExpense {
  id: string;
  expenseNumber: string; // "EXP-2026-0019"
  date: string;
  category: 'DELIVERY_FUEL' | 'VEHICLE_MAINTENANCE' | 'OFFICE_TEA_SNACKS' | 'PACKAGING_MATERIAL' | 'STATIONERY' | 'ELECTRICITY' | 'MISCELLANEOUS';
  amount: number;
  paidFromAccountId: string; // Cash in Hand GL or Bank Account
  paidTo: string;
  description: string;
  receiptAttachmentUrl?: string;
  approvedBy: string;
  createdAt: string;
}
