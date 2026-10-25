export type UserRole = 'admin' | 'distributor' | 'sales_rep' | 'retailer' | 'delivery';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  businessId: string;
  businessName: string;
  retailShopName?: string;
  retailerId?: string;
  assignedSalesRepId?: string;
  assignedDeliveryPersonId?: string;
  address?: string;
  city?: string;
  pincode?: string;
  gstin?: string;
  creditLimit?: number;
  creditDays?: number;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Retailer {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  area: string; // e.g., Cruz Fernandez Puram, Bryant Nagar, Millerpuram, Palayamkottai Road, Thoothukudi
  city: string;
  pincode: string;
  gstin?: string;
  creditLimit: number;
  creditDays: number;
  openingBalance?: number;
  currentOutstanding: number;
  assignedSalesRepId?: string;
  assignedSalesRepName?: string;
  priceTier: 'retail' | 'wholesale' | 'super_stockist';
  isActive: boolean;
  createdAt: string;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  distributorName: string;
  ownerName?: string;
  subTitle: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  panNumber: string;
  fssaiNumber: string;
  gstRegistered?: boolean;
  isConfigured?: boolean;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    ifscCode: string;
    upiId: string;
  };
  invoicePrefix: string;
  orderPrefix: string;
  financialYear: string;
  financialYearStartDate?: string;
  financialYearEndDate?: string;
  requireOrderApprovalThreshold: number;
  enableFEFO: boolean;
  logoUrl?: string;
}
