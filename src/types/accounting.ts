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
