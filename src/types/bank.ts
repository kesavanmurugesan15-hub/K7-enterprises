export interface BankAccount {
  id: string;
  bankName: string; // e.g. "Tamilnad Mercantile Bank (TMB)"
  branch: string; // "Beach Road Branch, Thoothukudi"
  accountNumber: string;
  accountType: 'CURRENT' | 'SAVINGS' | 'OD_CC';
  ifscCode: string;
  openingBalance: number;
  currentBookBalance: number;
  glAccountId: string; // Linked GL Account
  isActive: boolean;
}

export type BankTxType = 'DEPOSIT' | 'WITHDRAWAL' | 'UPI_COLLECTION' | 'CHEQUE_CLEAR' | 'CHARGES' | 'TRANSFER';
export type MatchStatus = 'MATCHED' | 'UNMATCHED' | 'MANUAL_MATCH' | 'DISPUTED';

export interface BankStatementTransaction {
  id: string;
  statementId: string;
  transactionDate: string;
  valueDate: string;
  description: string;
  referenceNumber: string; // UTR or Cheque no
  type: 'CR' | 'DR';
  amount: number;
  runningBalance?: number;
  matchStatus: MatchStatus;
  matchedJournalEntryId?: string;
  matchedJournalLineId?: string;
  matchedAt?: string;
  matchedBy?: string;
}

export interface BankStatement {
  id: string;
  bankAccountId: string;
  bankName: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  status: 'PENDING' | 'RECONCILED' | 'PARTIALLY_RECONCILED';
}
