import type { BusinessSettings, Retailer, UserProfile } from '../types/auth';
import type { Product } from '../types/product';
import type { Supplier } from '../types/purchase';
import type { Account } from '../types/accounting';
import type { BankAccount } from '../types/bank';
import type { SalesOrder } from '../types/order';

/**
 * K7 ENTERPRISE — CLEAN PRODUCTION-READY SETUP MASTER DATA
 * Zero hardcoded business data, zero sample transactions, zero fake balances.
 * The system boots up clean, allowing the owner to configure their own business.
 */

export const CLEAN_BUSINESS_SETTINGS: BusinessSettings = {
  id: 'biz_default',
  businessName: '',
  distributorName: '',
  ownerName: '',
  subTitle: '',
  address: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  gstin: '',
  panNumber: '',
  fssaiNumber: '',
  gstRegistered: false,
  isConfigured: false,
  bankDetails: {
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    ifscCode: '',
    upiId: ''
  },
  invoicePrefix: 'INV/2026-27/',
  orderPrefix: 'SO-',
  financialYear: '2026-27',
  financialYearStartDate: '2026-04-01',
  financialYearEndDate: '2027-03-31',
  requireOrderApprovalThreshold: 25000,
  enableFEFO: true,
  logoUrl: ''
};

export const CLEAN_USERS: UserProfile[] = [
  {
    id: 'usr_admin',
    name: 'System Administrator',
    email: 'admin@k7enterprise.in',
    phone: '',
    role: 'admin',
    businessId: 'biz_default',
    businessName: '',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const CLEAN_RETAILERS: Retailer[] = [];
export const CLEAN_SUPPLIERS: Supplier[] = [];
export const CLEAN_PRODUCTS: Product[] = [];
export const CLEAN_ORDERS: SalesOrder[] = [];
export const CLEAN_BANK_ACCOUNTS: BankAccount[] = [];

/**
 * Standard Double-Entry Accounting Chart of Accounts
 * All initial balances start strictly at 0.00 until entered by the owner.
 */
export const CLEAN_ACCOUNTS: Account[] = [
  // ASSETS
  {
    id: 'acc_cash_01',
    code: '1010',
    name: 'Cash in Hand (Main Counter)',
    type: 'ASSET',
    subGroup: 'CASH_IN_HAND',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_cash_petty',
    code: '1015',
    name: 'Petty Cash Account',
    type: 'ASSET',
    subGroup: 'CASH_IN_HAND',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_bank_tmb',
    code: '1020',
    name: 'Primary Bank Account',
    type: 'ASSET',
    subGroup: 'BANK_ACCOUNTS',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_sundry_debtors',
    code: '1030',
    name: 'Sundry Debtors (Customer Receivables)',
    type: 'ASSET',
    subGroup: 'SUNDRY_DEBTORS',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_stock_asset',
    code: '1040',
    name: 'Stock-in-Hand (Inventory Asset)',
    type: 'ASSET',
    subGroup: 'INVENTORY_STOCK',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_input_gst',
    code: '1050',
    name: 'Input Tax Credit (ITC - CGST & SGST)',
    type: 'ASSET',
    subGroup: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  // LIABILITIES
  {
    id: 'acc_sundry_creditors',
    code: '2010',
    name: 'Sundry Creditors (Supplier Payables)',
    type: 'LIABILITY',
    subGroup: 'SUNDRY_CREDITORS',
    openingBalance: 0,
    openingBalanceType: 'CR',
    currentBalance: 0,
    currentBalanceType: 'CR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_output_gst',
    code: '2020',
    name: 'Output GST Payable',
    type: 'LIABILITY',
    subGroup: 'DUTIES_AND_TAXES',
    openingBalance: 0,
    openingBalanceType: 'CR',
    currentBalance: 0,
    currentBalanceType: 'CR',
    isSystem: true,
    isActive: true
  },
  // EQUITY
  {
    id: 'acc_proprietor_capital',
    code: '3010',
    name: "Proprietor's Capital Account",
    type: 'EQUITY',
    subGroup: 'CAPITAL_ACCOUNT',
    openingBalance: 0,
    openingBalanceType: 'CR',
    currentBalance: 0,
    currentBalanceType: 'CR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_retained_earnings',
    code: '3020',
    name: 'Retained Earnings',
    type: 'EQUITY',
    subGroup: 'RETAINED_EARNINGS',
    openingBalance: 0,
    openingBalanceType: 'CR',
    currentBalance: 0,
    currentBalanceType: 'CR',
    isSystem: true,
    isActive: true
  },
  // REVENUE
  {
    id: 'acc_sales_revenue',
    code: '4010',
    name: 'Sales Revenue',
    type: 'INCOME',
    subGroup: 'SALES_ACCOUNTS',
    openingBalance: 0,
    openingBalanceType: 'CR',
    currentBalance: 0,
    currentBalanceType: 'CR',
    isSystem: true,
    isActive: true
  },
  // EXPENSES
  {
    id: 'acc_purchases',
    code: '5010',
    name: 'Purchases & Cost of Goods Sold',
    type: 'EXPENSE',
    subGroup: 'PURCHASE_ACCOUNTS',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_freight',
    code: '5020',
    name: 'Freight & Inward Cartage',
    type: 'EXPENSE',
    subGroup: 'DIRECT_EXPENSES',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_vehicle_fuel',
    code: '5030',
    name: 'Vehicle Fuel & Delivery Expenses',
    type: 'EXPENSE',
    subGroup: 'INDIRECT_EXPENSES',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_staff_salary',
    code: '5040',
    name: 'Staff Salaries & Incentives',
    type: 'EXPENSE',
    subGroup: 'INDIRECT_EXPENSES',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  },
  {
    id: 'acc_rent_utilities',
    code: '5050',
    name: 'Rent, Utilities & Godown Expenses',
    type: 'EXPENSE',
    subGroup: 'INDIRECT_EXPENSES',
    openingBalance: 0,
    openingBalanceType: 'DR',
    currentBalance: 0,
    currentBalanceType: 'DR',
    isSystem: true,
    isActive: true
  }
];

// Aliases for seamless backward compatibility
export const INITIAL_BUSINESS_SETTINGS = CLEAN_BUSINESS_SETTINGS;
export const INITIAL_USERS = CLEAN_USERS;
export const INITIAL_PRODUCTS = CLEAN_PRODUCTS;
export const INITIAL_RETAILERS = CLEAN_RETAILERS;
export const INITIAL_SUPPLIERS = CLEAN_SUPPLIERS;
export const INITIAL_ORDERS = CLEAN_ORDERS;
export const INITIAL_ACCOUNTS = CLEAN_ACCOUNTS;
export const INITIAL_BANK_ACCOUNTS = CLEAN_BANK_ACCOUNTS;
