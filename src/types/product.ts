export interface ProductBatch {
  id: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  quantity: number;
  reservedQuantity: number;
  purchaseRate: number;
  mrp: number;
}

export type ProductCategory = 
  | 'Pure Spices'
  | 'Blended Masalas'
  | 'Paste & Ready Mixes'
  | 'Pickles & Condiments'
  | 'Snacks & Flours'
  | 'Beverages & Syrups';

export interface Product {
  id: string;
  name: string;
  tamilName?: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  brand: string; // "Aachi Masala"
  packSize: string; // "50g", "100g", "200g", "500g", "1kg", "50ml", "100ml"
  unitOfMeasure: 'PCS' | 'BOX' | 'PKT' | 'KG' | 'L';
  caseSize: number; // e.g. 50 packets per outer carton
  purchaseRate: number; // Excl. GST
  mrp: number;
  sellingPriceWholesale: number; // Distributor selling to retailer
  sellingPriceRetail: number;
  gstPercent: 0 | 5 | 12 | 18; // FMCG masala GST is typically 5% or 12%
  hsnCode: string; // e.g. "0910" (Spices), "2103" (Mixed condiments/seasonings)
  reorderLevel: number;
  stockOnHand: number;
  stockReserved: number;
  availableStock: number;
  imageUrl?: string;
  isActive: boolean;
  batches: ProductBatch[];
  createdAt: string;
  updatedAt: string;
}
