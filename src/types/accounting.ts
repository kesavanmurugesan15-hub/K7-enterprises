export type AccountType = 
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'INCOME'
  | 'EXPENSE';

export type AccountSubGroup =
  | 'CASH_IN_HAND'
  | 'BANK_ACCOUNTS'
  | 'SUNDRY_DEBTORS'       // Accounts Receivable
  | 'INVENTORY_STOCK'      // Stock-in-hand
  | 'SUNDRY_CREDITORS'     // Accounts Payable
  | 'DUTIES_AND_TAXES'     // GST Output / Input
  | 'SALES_ACCOUNTS'       // Revenue
  | 'PURCHASE_ACCOUNTS'    // Cost of Goods Sold / Purchases
  | 'DIRECT_EXPENSES'      // Freight, packaging
  | 'INDIRECT_EXPENSES'    // Rent, electricity, staff salary, fuel, petty expenses
  | 'CAPITAL_ACCOUNT'
  | 'RETAINED_EARNINGS';

export interface Account {
  id: string;
  code: string; // e.g. "1010", "1020", "2010"
  name: string;
  type: AccountType;
  subGroup: AccountSubGroup;
  openingBalance: number;
  openingBalanceType: 'DR' | 'CR';
  currentBalance: number;
  currentBalanceType: 'DR' | 'CR';
  isSystem: boolean; // Cannot delete base accounts
  isActive: boolean;
  notes?: string;
}

export type VoucherType =
  | 'SALES_VOUCHER'
  | 'PURCHASE_VOUCHER'
  | 'RECEIPT_VOUCHER'
  | 'PAYMENT_VOUCHER'
  | 'JOURNAL_VOUCHER'
  | 'CONTRA_VOUCHER'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE';

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  debit: number;
  credit: number;
  narration?: string;
  subEntityId?: string; // Retailer ID or Supplier ID for sub-ledgers
  subEntityName?: string;
}

export interface JournalEntry {
  id: string;
  voucherNumber: string; // e.g. "VR-2026-0041"
  voucherType: VoucherType;
  date: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  narration: string;
  referenceType?: 'SALES_INVOICE' | 'PURCHASE_INVOICE' | 'PAYMENT' | 'BANK_RECON' | 'EXPENSE' | 'ADJUSTMENT';
  referenceId?: string;
  referenceNumber?: string;
  isPosted: boolean;
  isReversed: boolean;
  reversalReason?: string;
  reversedByEntryId?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string;
}

export interface DayBookRow {
  id: string;
  date: string;
  voucherNumber: string;
  voucherType: VoucherType;
  particulars: string;
  accountName: string;
  debit: number;
  credit: number;
  narration: string;
  subEntityId?: string;
  subEntityName?: string;
}

export interface TrialBalanceItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  type: AccountType;
  subGroup: AccountSubGroup;
  debitTotal: number;
  creditTotal: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceReport {
  items: TrialBalanceItem[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  generatedAt: string;
}

export interface ProfitLossReport {
  fromDate: string;
  toDate: string;
  income: {
    salesRevenue: number;
    otherIncome: number;
    totalIncome: number;
  };
  expenses: {
    costOfGoodsSold: number;
    freightAndDelivery: number;
    operatingExpenses: number;
    salaryExpenses: number;
    utilitiesAndRent: number;
    totalExpenses: number;
  };
  grossProfit: number;
  netProfit: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: {
    currentAssets: {
      cashInHand: number;
      bankBalances: number;
      accountsReceivable: number;
      inventoryValuation: number;
      totalCurrentAssets: number;
    };
    fixedAssets: number;
    totalAssets: number;
  };
  liabilitiesAndEquity: {
    currentLiabilities: {
      accountsPayable: number;
      taxLiabilities: number;
      totalCurrentLiabilities: number;
    };
    capitalAndReserves: {
      ownerCapital: number;
      retainedEarnings: number;
      currentPeriodProfit: number;
      totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
  };
  isBalanced: boolean;
}

export interface PurchaseLedgerEntry {
  id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNumber: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  totalInvoiceAmount: number;
  status: 'POSTED' | 'VERIFIED' | 'CANCELLED';
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
  grnId?: string;
  grnNumber?: string;
  narration?: string;
}

export interface SupplierCreditorSummary {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  gstin: string;
  openingBalance: number;
  creditPurchases: number;
  paymentsMade: number;
  adjustments: number;
  closingBalance: number;
}

export interface SupplierLedgerTransaction {
  id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  supplierInvoiceNumber: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
  referenceNumber?: string;
}

export interface CustomerDebtorSummary {
  retailerId: string;
  retailerShopName: string;
  ownerName: string;
  phone: string;
  gstin: string;
  openingBalance: number;
  totalInvoiced: number;
  totalCollected: number;
  closingBalance: number;
  creditLimit: number;
}

export interface CustomerLedgerTransaction {
  id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  invoiceNumber: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
  referenceNumber?: string;
}

export interface BankCashBookTransaction {
  id: string;
  date: string;
  voucherNumber: string;
  voucherType: string;
  particulars: string;
  counterparty: string;
  amount: number;
  type: 'RECEIPT' | 'PAYMENT' | 'CONTRA';
  paymentMethod: string;
  bankReference?: string;
  runningBalance: number;
  status: 'POSTED' | 'RECONCILED' | 'PENDING';
}

export interface BankCashBookSummary {
  accountId: string;
  accountName: string;
  accountCode: string;
  accountType: 'CASH' | 'BANK';
  fromDate: string;
  toDate: string;
  openingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  netTransfers: number;
  closingBookBalance: number;
  bankStatementBalance?: number;
  reconciledBalance?: number;
  unclearedAmount?: number;
  transactions: BankCashBookTransaction[];
}

export interface GlobalSearchResult {
  category: 'PRODUCT' | 'RETAILER' | 'SUPPLIER' | 'ORDER' | 'INVOICE' | 'PURCHASE';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  targetTab: string;
  targetId?: string;
}

