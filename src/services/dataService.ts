import {
  INITIAL_BUSINESS_SETTINGS,
  INITIAL_USERS,
  INITIAL_RETAILERS,
  INITIAL_SUPPLIERS,
  INITIAL_PRODUCTS,
  INITIAL_ACCOUNTS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_ORDERS
} from './seedData';
import type { Product, ProductBatch } from '../types/product';
import type { SalesOrder, DeliveryStage, PaymentMethod, PaymentStatus, OrderItem, SalesInvoice } from '../types/order';
import type { InventoryMovement, StockValuationSummary } from '../types/inventory';
import type { PurchaseOrder, GoodsReceiptNote, Supplier } from '../types/purchase';
import type {
  Account,
  JournalEntry,
  VoucherType,
  DayBookRow,
  TrialBalanceReport,
  ProfitLossReport,
  BalanceSheetReport,
  PurchaseLedgerEntry,
  SupplierCreditorSummary,
  SupplierLedgerTransaction,
  CustomerDebtorSummary,
  CustomerLedgerTransaction,
  BankCashBookSummary,
  BankCashBookTransaction,
  GlobalSearchResult
} from '../types/accounting';
import type { BankAccount, BankStatement, BankStatementTransaction } from '../types/bank';
import type { CollectionReceipt, PettyExpense, CustomerCreditProfile, SupplierCreditorProfile } from '../types/credit';
import type { AppNotification, AuditLog } from '../types/notification';
import type { BusinessSettings, Retailer, UserProfile, UserRole } from '../types/auth';

type Listener = () => void;

class EnterpriseDataService {
  private listeners: Map<string, Set<Listener>> = new Map();

  // Storage keys
  private readonly K_STORAGE_VERSION = 'k7_storage_version';
  private readonly CURRENT_STORAGE_VERSION = '3.0_clean_setup';

  private readonly K_SETTINGS = 'k7_settings';
  private readonly K_USERS = 'k7_users';
  private readonly K_RETAILERS = 'k7_retailers';
  private readonly K_SUPPLIERS = 'k7_suppliers';
  private readonly K_PRODUCTS = 'k7_products';
  private readonly K_ORDERS = 'k7_orders';
  private readonly K_INVOICES = 'k7_invoices';
  private readonly K_MOVEMENTS = 'k7_movements';
  private readonly K_PURCHASE_ORDERS = 'k7_purchase_orders';
  private readonly K_GRNS = 'k7_grns';
  private readonly K_ACCOUNTS = 'k7_accounts';
  private readonly K_JOURNALS = 'k7_journals';
  private readonly K_BANK_ACCOUNTS = 'k7_bank_accounts';
  private readonly K_BANK_STATEMENTS = 'k7_bank_statements';
  private readonly K_COLLECTIONS = 'k7_collections';
  private readonly K_EXPENSES = 'k7_expenses';
  private readonly K_NOTIFICATIONS = 'k7_notifications';
  private readonly K_AUDIT_LOGS = 'k7_audit_logs';

  constructor() {
    this.initializeDefaults();
  }

  private getItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultVal;
      return JSON.parse(data) as T;
    } catch (e) {
      console.warn(`Error reading ${key} from storage:`, e);
      return defaultVal;
    }
  }

  private setItem<T>(key: string, value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notify(key);
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  }

  public subscribe(key: string, listener: Listener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);
    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notify(key: string) {
    const set = this.listeners.get(key);
    if (set) {
      set.forEach(cb => cb());
    }
    // Also notify global listeners
    const all = this.listeners.get('*');
    if (all) {
      all.forEach(cb => cb());
    }
  }

  /**
   * Reset the entire application storage to a clean, production-ready zero state.
   * Clears all demo transactions, products, orders, and balances.
   */
  public resetToCleanState(actor?: UserProfile) {
    this.setItem(this.K_SETTINGS, INITIAL_BUSINESS_SETTINGS);
    this.setItem(this.K_USERS, INITIAL_USERS);
    this.setItem(this.K_RETAILERS, INITIAL_RETAILERS);
    this.setItem(this.K_SUPPLIERS, INITIAL_SUPPLIERS);
    this.setItem(this.K_PRODUCTS, INITIAL_PRODUCTS);
    this.setItem(this.K_ORDERS, INITIAL_ORDERS);
    this.setItem(this.K_INVOICES, []);
    this.setItem(this.K_MOVEMENTS, []);
    this.setItem(this.K_PURCHASE_ORDERS, []);
    this.setItem(this.K_GRNS, []);
    this.setItem(this.K_ACCOUNTS, INITIAL_ACCOUNTS);
    this.setItem(this.K_JOURNALS, []);
    this.setItem(this.K_BANK_ACCOUNTS, INITIAL_BANK_ACCOUNTS);
    this.setItem(this.K_BANK_STATEMENTS, []);
    this.setItem(this.K_COLLECTIONS, []);
    this.setItem(this.K_EXPENSES, []);
    this.setItem(this.K_NOTIFICATIONS, []);
    this.setItem(this.K_AUDIT_LOGS, []);
    localStorage.setItem(this.K_STORAGE_VERSION, this.CURRENT_STORAGE_VERSION);

    if (actor) {
      this.logAudit(actor, 'RESET_CLEAN_STATE', 'BUSINESS', 'biz_default', 'System Storage', 'Purged all demo records and restored clean state');
    }
    this.notify('*');
  }

  private initializeDefaults() {
    const currentVersion = localStorage.getItem(this.K_STORAGE_VERSION);
    if (currentVersion !== this.CURRENT_STORAGE_VERSION) {
      // Automatic migration to clean setup: purge legacy demo data
      this.resetToCleanState();
      return;
    }

    if (!localStorage.getItem(this.K_SETTINGS)) {
      this.setItem(this.K_SETTINGS, INITIAL_BUSINESS_SETTINGS);
    }
    if (!localStorage.getItem(this.K_USERS)) {
      this.setItem(this.K_USERS, INITIAL_USERS);
    }
    if (!localStorage.getItem(this.K_RETAILERS)) {
      this.setItem(this.K_RETAILERS, INITIAL_RETAILERS);
    }
    if (!localStorage.getItem(this.K_SUPPLIERS)) {
      this.setItem(this.K_SUPPLIERS, INITIAL_SUPPLIERS);
    }
    if (!localStorage.getItem(this.K_PRODUCTS)) {
      this.setItem(this.K_PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(this.K_ORDERS)) {
      this.setItem(this.K_ORDERS, INITIAL_ORDERS);
    }
    if (!localStorage.getItem(this.K_ACCOUNTS)) {
      this.setItem(this.K_ACCOUNTS, INITIAL_ACCOUNTS);
    }
    if (!localStorage.getItem(this.K_BANK_ACCOUNTS)) {
      this.setItem(this.K_BANK_ACCOUNTS, INITIAL_BANK_ACCOUNTS);
    }
  }

  // --- BUSINESS SETTINGS ---
  public getSettings(): BusinessSettings {
    return this.getItem(this.K_SETTINGS, INITIAL_BUSINESS_SETTINGS);
  }

  public updateSettings(settings: Partial<BusinessSettings>, actor: UserProfile) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.setItem(this.K_SETTINGS, updated);
    this.logAudit(actor, 'UPDATE_SETTINGS', 'BUSINESS', current.id || 'biz_default', 'Business Settings', 'Updated company profile and settings');
    return updated;
  }

  // --- USERS ---
  public getUsers(): UserProfile[] {
    return this.getItem(this.K_USERS, INITIAL_USERS);
  }

  public saveUser(user: UserProfile, actor: UserProfile) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user };
    } else {
      users.push(user);
    }
    this.setItem(this.K_USERS, users);
    this.logAudit(actor, idx >= 0 ? 'UPDATE_USER' : 'CREATE_USER', 'USERS', user.id, user.name, `Role: ${user.role}`);
  }

  // --- RETAILERS ---
  public getRetailers(): Retailer[] {
    return this.getItem(this.K_RETAILERS, INITIAL_RETAILERS);
  }

  public saveRetailer(retailer: Retailer, actor: UserProfile) {
    const list = this.getRetailers();
    const idx = list.findIndex(r => r.id === retailer.id);
    if (idx >= 0) {
      list[idx] = retailer;
    } else {
      list.push(retailer);
    }
    this.setItem(this.K_RETAILERS, list);
    this.logAudit(actor, idx >= 0 ? 'UPDATE_RETAILER' : 'CREATE_RETAILER', 'USERS', retailer.id, retailer.shopName, `Credit limit: ₹${retailer.creditLimit}`);
  }

  // --- SUPPLIERS ---
  public getSuppliers(): Supplier[] {
    return this.getItem(this.K_SUPPLIERS, INITIAL_SUPPLIERS);
  }

  public saveSupplier(supplier: Supplier, actor: UserProfile) {
    const list = this.getSuppliers();
    const idx = list.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      list[idx] = supplier;
    } else {
      list.push(supplier);
    }
    this.setItem(this.K_SUPPLIERS, list);
    this.logAudit(actor, idx >= 0 ? 'UPDATE_SUPPLIER' : 'CREATE_SUPPLIER', 'PURCHASE', supplier.id, supplier.name, `GSTIN: ${supplier.gstin}`);
  }

  // --- PRODUCTS & CATALOGUE ---
  public getProducts(): Product[] {
    return this.getItem(this.K_PRODUCTS, INITIAL_PRODUCTS);
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  public saveProduct(product: Product, actor: UserProfile): Product {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === product.id);
    const now = new Date().toISOString();
    let saved: Product;
    if (idx >= 0) {
      saved = { ...product, updatedAt: now };
      products[idx] = saved;
    } else {
      saved = { ...product, createdAt: now, updatedAt: now };
      products.push(saved);
    }
    this.setItem(this.K_PRODUCTS, products);
    this.logAudit(actor, idx >= 0 ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', 'CATALOGUE', saved.id, saved.name, `SKU: ${saved.sku}, MRP: ₹${saved.mrp}`);
    return saved;
  }

  // --- ORDERS & 11-STAGE DELIVERY ---
  public getOrders(): SalesOrder[] {
    return this.getItem(this.K_ORDERS, INITIAL_ORDERS);
  }

  public getOrderById(id: string): SalesOrder | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  /**
   * Safe server-side re-calculation and atomic creation of Sales Orders
   */
  public createSalesOrder(orderData: {
    retailer: Retailer;
    items: { productId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    notes?: string;
    salesRep?: UserProfile;
    actor: UserProfile;
  }): { success: boolean; order?: SalesOrder; message?: string } {
    const products = this.getProducts();
    const orderItems: OrderItem[] = [];
    let subTotal = 0;
    let totalDiscount = 0;
    let taxableSubtotal = 0;
    let totalGst = 0;

    // Validate stock and re-calculate prices securely on backend
    for (const reqItem of orderData.items) {
      const prod = products.find(p => p.id === reqItem.productId);
      if (!prod) {
        return { success: false, message: `Product ID ${reqItem.productId} not found.` };
      }
      if (prod.availableStock < reqItem.quantity) {
        return { success: false, message: `Insufficient stock for ${prod.name}. Available: ${prod.availableStock}, requested: ${reqItem.quantity}.` };
      }

      const unitPrice = orderData.retailer.priceTier === 'wholesale' ? prod.sellingPriceWholesale : prod.sellingPriceRetail;
      const lineTotalRaw = unitPrice * reqItem.quantity;
      const discountPercent = 0;
      const discountAmount = 0;
      const lineTaxable = lineTotalRaw - discountAmount;
      const gstAmount = (lineTaxable * prod.gstPercent) / 100;
      const totalAmount = lineTaxable + gstAmount;

      subTotal += lineTotalRaw;
      totalDiscount += discountAmount;
      taxableSubtotal += lineTaxable;
      totalGst += gstAmount;

      orderItems.push({
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        packSize: prod.packSize,
        quantity: reqItem.quantity,
        unitPrice,
        mrp: prod.mrp,
        discountPercent,
        discountAmount,
        taxableAmount: lineTaxable,
        gstPercent: prod.gstPercent,
        gstAmount,
        totalAmount
      });
    }

    const grandTotal = Math.round((taxableSubtotal + totalGst) * 100) / 100;
    const settings = this.getSettings();

    // Check credit limit if payment method is CREDIT
    if (orderData.paymentMethod === 'CREDIT') {
      const newOutstanding = orderData.retailer.currentOutstanding + grandTotal;
      if (newOutstanding > orderData.retailer.creditLimit) {
        // We will accept the order but flag it for PENDING_APPROVAL
      }
    }

    const orderCount = this.getOrders().length + 1;
    const orderNumber = `${settings.orderPrefix}2026-${String(orderCount).padStart(4, '0')}`;
    const invoiceNumber = `${settings.invoicePrefix}${String(orderCount).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const initialStage: DeliveryStage = 
      (orderData.paymentMethod === 'CREDIT' && (orderData.retailer.currentOutstanding + grandTotal > orderData.retailer.creditLimit))
        ? 'PENDING_APPROVAL'
        : 'ORDER_PLACED';

    const newOrder: SalesOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      retailerId: orderData.retailer.id,
      retailerShopName: orderData.retailer.shopName,
      retailerOwnerName: orderData.retailer.ownerName,
      retailerPhone: orderData.retailer.phone,
      deliveryAddress: orderData.retailer.address,
      area: orderData.retailer.area,
      orderDate: now,
      salesRepId: orderData.salesRep?.id || orderData.retailer.assignedSalesRepId,
      salesRepName: orderData.salesRep?.name || orderData.retailer.assignedSalesRepName,
      items: orderItems,
      subTotal,
      totalDiscount,
      taxableSubtotal,
      totalGst,
      deliveryFee: 0,
      roundOff: 0,
      grandTotal,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'PENDING',
      paidAmount: 0,
      dueAmount: grandTotal,
      currentStage: initialStage,
      stageHistory: [
        {
          stage: initialStage,
          timestamp: now,
          updatedByUserId: orderData.actor.id,
          updatedByUserName: orderData.actor.name,
          notes: initialStage === 'PENDING_APPROVAL' ? 'Order exceeds credit limit; awaiting Admin approval' : 'Order placed successfully'
        }
      ],
      invoiceNumber,
      notes: orderData.notes,
      createdAt: now,
      updatedAt: now
    };

    // Reserve stock immediately to prevent overselling
    for (const item of orderItems) {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx >= 0) {
        products[pIdx].stockReserved += item.quantity;
        products[pIdx].availableStock = products[pIdx].stockOnHand - products[pIdx].stockReserved;
      }
    }
    this.setItem(this.K_PRODUCTS, products);

    // Save order
    const orders = this.getOrders();
    orders.unshift(newOrder);
    this.setItem(this.K_ORDERS, orders);

    // Create corresponding Sales Invoice
    const invoice: SalesInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      orderId: newOrder.id,
      orderNumber,
      invoiceDate: now.split('T')[0],
      dueDate: new Date(Date.now() + (orderData.retailer.creditDays || 14) * 86400000).toISOString().split('T')[0],
      retailerId: orderData.retailer.id,
      retailerShopName: orderData.retailer.shopName,
      billingAddress: orderData.retailer.address,
      items: orderItems,
      taxableAmount: taxableSubtotal,
      cgstAmount: totalGst / 2,
      sgstAmount: totalGst / 2,
      totalGst,
      roundOff: 0,
      totalInvoiceAmount: grandTotal,
      amountPaid: 0,
      amountDue: grandTotal,
      paymentStatus: 'PENDING',
      isPostedToLedger: false,
      createdAt: now
    };
    const invoices = this.getInvoices();
    invoices.unshift(invoice);
    this.setItem(this.K_INVOICES, invoices);

    // Add in-app notification
    this.addNotification({
      type: initialStage === 'PENDING_APPROVAL' ? 'ORDER_APPROVAL_REQUIRED' : 'ORDER_NEW',
      title: initialStage === 'PENDING_APPROVAL' ? 'Approval Required for Order' : 'New Order Placed',
      message: `${orderNumber} placed by ${orderData.retailer.shopName} (₹${grandTotal.toLocaleString('en-IN')})`,
      linkToTab: 'orders',
      relatedEntityId: newOrder.id
    });

    this.logAudit(orderData.actor, 'CREATE_ORDER', 'ORDERS', newOrder.id, orderNumber, `Total: ₹${grandTotal}, Retailer: ${orderData.retailer.shopName}`);

    return { success: true, order: newOrder };
  }

  /**
   * Update 11-stage delivery workflow with strict state transition safety
   */
  public updateDeliveryStage(
    orderId: string,
    newStage: DeliveryStage,
    actor: UserProfile,
    notes?: string,
    extra?: { deliveryPersonId?: string; deliveryPersonName?: string; signatureName?: string }
  ): { success: boolean; message?: string } {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx < 0) return { success: false, message: 'Order not found' };

    const order = orders[idx];

    // Business rule: Once DELIVERED, it cannot silently regress to earlier states
    if (order.currentStage === 'DELIVERED' && newStage !== 'DELIVERED') {
      return { success: false, message: 'Delivered orders cannot be moved back to an earlier stage.' };
    }

    // Business rule: Cancelled orders cannot be moved
    if (order.currentStage === 'CANCELLED') {
      return { success: false, message: 'Cancelled orders cannot be altered.' };
    }

    const now = new Date().toISOString();
    order.currentStage = newStage;
    order.updatedAt = now;

    if (extra?.deliveryPersonId) {
      order.assignedDeliveryPersonId = extra.deliveryPersonId;
      order.assignedDeliveryPersonName = extra.deliveryPersonName;
    }
    if (extra?.signatureName) {
      order.recipientSignatureName = extra.signatureName;
    }

    order.stageHistory.push({
      stage: newStage,
      timestamp: now,
      updatedByUserId: actor.id,
      updatedByUserName: actor.name,
      notes: notes || `Moved to ${newStage}`
    });

    // Handle physical stock deduction when DISPATCHED or DELIVERED
    if (newStage === 'DISPATCHED' && !order.invoiceId) {
      order.invoiceId = `inv_${order.id}`;
      // Release reservation and deduct actual stock on hand
      const products = this.getProducts();
      for (const item of order.items) {
        const pIdx = products.findIndex(p => p.id === item.productId);
        if (pIdx >= 0) {
          const prev = products[pIdx].stockOnHand;
          products[pIdx].stockReserved = Math.max(0, products[pIdx].stockReserved - item.quantity);
          products[pIdx].stockOnHand = Math.max(0, products[pIdx].stockOnHand - item.quantity);
          products[pIdx].availableStock = products[pIdx].stockOnHand - products[pIdx].stockReserved;

          // Record auditable inventory movement
          this.recordMovement({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            movementType: 'SALES_DISPATCH',
            quantityChange: -item.quantity,
            previousStock: prev,
            newStock: products[pIdx].stockOnHand,
            unitCost: item.unitPrice,
            totalCost: item.totalAmount,
            referenceType: 'SALES_ORDER',
            referenceId: order.id,
            referenceNumber: order.orderNumber,
            performedByUserId: actor.id,
            performedByUserName: actor.name,
            notes: `Dispatched in ${order.orderNumber}`,
            timestamp: now
          });
        }
      }
      this.setItem(this.K_PRODUCTS, products);

      // Post double-entry Sales Voucher automatically if credit sale
      this.postSalesVoucherForOrder(order, actor);
    } else if (newStage === 'CANCELLED') {
      // Release any reserved stock
      const products = this.getProducts();
      for (const item of order.items) {
        const pIdx = products.findIndex(p => p.id === item.productId);
        if (pIdx >= 0) {
          products[pIdx].stockReserved = Math.max(0, products[pIdx].stockReserved - item.quantity);
          products[pIdx].availableStock = products[pIdx].stockOnHand - products[pIdx].stockReserved;
        }
      }
      this.setItem(this.K_PRODUCTS, products);
    }

    orders[idx] = order;
    this.setItem(this.K_ORDERS, orders);

    // Notify relevant users
    this.addNotification({
      type: 'ORDER_STATUS_CHANGED',
      title: `Order ${order.orderNumber} ${newStage}`,
      message: `Status updated to ${newStage.replace(/_/g, ' ')}`,
      linkToTab: 'orders',
      relatedEntityId: order.id
    });

    this.logAudit(actor, 'UPDATE_STAGE', 'ORDERS', order.id, order.orderNumber, `Stage: ${newStage}`);
    return { success: true };
  }

  // --- INVOICES ---
  public getInvoices(): SalesInvoice[] {
    return this.getItem(this.K_INVOICES, []);
  }

  // --- INVENTORY MOVEMENTS ---
  public getMovements(): InventoryMovement[] {
    return this.getItem(this.K_MOVEMENTS, []);
  }

  public recordMovement(movement: Omit<InventoryMovement, 'id'>) {
    const movements = this.getMovements();
    const newMovement: InventoryMovement = {
      ...movement,
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    movements.unshift(newMovement);
    this.setItem(this.K_MOVEMENTS, movements);
  }

  public getStockValuation(): StockValuationSummary {
    const products = this.getProducts();
    let totalQuantity = 0;
    let totalInventoryValue = 0;
    let lowStockItemsCount = 0;
    let nearExpiryItemsCount = 0;

    const today = new Date();
    const ninetyDaysAhead = new Date(today.getTime() + 90 * 86400000);

    for (const p of products) {
      totalQuantity += p.stockOnHand;
      totalInventoryValue += p.stockOnHand * p.purchaseRate;
      if (p.availableStock <= p.reorderLevel) {
        lowStockItemsCount++;
      }
      if (p.batches) {
        for (const b of p.batches) {
          const exp = new Date(b.expDate);
          if (exp <= ninetyDaysAhead) {
            nearExpiryItemsCount++;
            break;
          }
        }
      }
    }

    return {
      totalItems: products.length,
      totalQuantity,
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      lowStockItemsCount,
      nearExpiryItemsCount
    };
  }

  // --- PURCHASING & GOODS RECEIPT ---
  public getPurchaseOrders(): PurchaseOrder[] {
    return this.getItem(this.K_PURCHASE_ORDERS, []);
  }

  public getGoodsReceiptNotes(): GoodsReceiptNote[] {
    return this.getItem(this.K_GRNS, []);
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>, actor: UserProfile): PurchaseOrder {
    const pos = this.getPurchaseOrders();
    const count = pos.length + 1;
    const poNumber = `PO-2026-${String(count).padStart(4, '0')}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: `po_${Date.now()}`,
      poNumber,
      createdAt: new Date().toISOString()
    };
    pos.unshift(newPO);
    this.setItem(this.K_PURCHASE_ORDERS, pos);
    this.logAudit(actor, 'CREATE_PO', 'PURCHASE', newPO.id, poNumber, `Supplier: ${newPO.supplierName}, Grand Total: ₹${newPO.grandTotal}`);
    return newPO;
  }

  /**
   * Post Goods Receipt Note (GRN):
   * 1. Increases physical stock in warehouse
   * 2. Registers batch & expiry date (FEFO)
   * 3. Creates auditable stock movement
   * 4. Automatically posts Purchase Voucher to double-entry ledger:
   *    Dr. Purchases/Inventory, Dr. Input GST, Cr. Sundry Creditors
   */
  public postGoodsReceipt(grnData: Omit<GoodsReceiptNote, 'id' | 'grnNumber' | 'createdAt' | 'isPostedToStock' | 'isPostedToAccounts'>, actor: UserProfile): GoodsReceiptNote {
    const grns = this.getGoodsReceiptNotes();
    const grnCount = grns.length + 1;
    const grnNumber = `GRN-2026-${String(grnCount).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newGRN: GoodsReceiptNote = {
      ...grnData,
      id: `grn_${Date.now()}`,
      grnNumber,
      isPostedToStock: true,
      isPostedToAccounts: true,
      createdAt: now
    };

    // 1. Update product stock and batches
    const products = this.getProducts();
    for (const item of newGRN.items) {
      const pIdx = products.findIndex(p => p.id === item.productId);
      if (pIdx >= 0) {
        const prev = products[pIdx].stockOnHand;
        products[pIdx].stockOnHand += item.acceptedQuantity;
        products[pIdx].availableStock = products[pIdx].stockOnHand - products[pIdx].stockReserved;

        // Add or update batch
        const newBatch: ProductBatch = {
          id: `bat_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          batchNumber: item.batchNumber,
          mfgDate: item.mfgDate,
          expDate: item.expDate,
          quantity: item.acceptedQuantity,
          reservedQuantity: 0,
          purchaseRate: item.unitRate,
          mrp: products[pIdx].mrp
        };
        products[pIdx].batches = [newBatch, ...(products[pIdx].batches || [])];

        // Auditable movement
        this.recordMovement({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          batchNumber: item.batchNumber,
          movementType: 'PURCHASE_RECEIPT',
          quantityChange: item.acceptedQuantity,
          previousStock: prev,
          newStock: products[pIdx].stockOnHand,
          unitCost: item.unitRate,
          totalCost: item.totalAmount,
          referenceType: 'GOODS_RECEIPT',
          referenceId: newGRN.id,
          referenceNumber: grnNumber,
          performedByUserId: actor.id,
          performedByUserName: actor.name,
          notes: `GRN from ${newGRN.supplierName} (Supplier Inv: ${newGRN.supplierInvoiceNumber})`,
          timestamp: now
        });
      }
    }
    this.setItem(this.K_PRODUCTS, products);

    // 2. Update Supplier outstanding balance
    const suppliers = this.getSuppliers();
    const sIdx = suppliers.findIndex(s => s.id === newGRN.supplierId);
    if (sIdx >= 0) {
      suppliers[sIdx].currentOutstandingBalance += newGRN.grandTotal;
      this.setItem(this.K_SUPPLIERS, suppliers);
    }

    // 3. Post double-entry Purchase Voucher
    this.postPurchaseVoucher(newGRN, actor);

    // 4. Update PO status if attached
    if (newGRN.poId) {
      const pos = this.getPurchaseOrders();
      const poIdx = pos.findIndex(p => p.id === newGRN.poId);
      if (poIdx >= 0) {
        pos[poIdx].status = 'COMPLETED';
        pos[poIdx].goodsReceipts = [...(pos[poIdx].goodsReceipts || []), newGRN.id];
        this.setItem(this.K_PURCHASE_ORDERS, pos);
      }
    }

    grns.unshift(newGRN);
    this.setItem(this.K_GRNS, grns);

    this.logAudit(actor, 'POST_GRN', 'PURCHASE', newGRN.id, grnNumber, `Grand Total: ₹${newGRN.grandTotal}, Inv: ${newGRN.supplierInvoiceNumber}`);
    return newGRN;
  }

  // --- TALLY-STYLE DOUBLE ENTRY ACCOUNTING ---
  public getAccounts(): Account[] {
    return this.getItem(this.K_ACCOUNTS, INITIAL_ACCOUNTS);
  }

  public getJournalEntries(): JournalEntry[] {
    return this.getItem(this.K_JOURNALS, []);
  }

  /**
   * Post double-entry accounting voucher with strict debits = credits check
   */
  public postJournalEntry(entry: {
    voucherType: VoucherType;
    date: string;
    narration: string;
    lines: { accountId: string; debit: number; credit: number; narration?: string; subEntityId?: string; subEntityName?: string }[];
    actor: UserProfile;
    referenceType?: JournalEntry['referenceType'];
    referenceId?: string;
    referenceNumber?: string;
  }): { success: boolean; entry?: JournalEntry; message?: string } {
    let totalDebit = 0;
    let totalCredit = 0;
    const accounts = this.getAccounts();
    const retailers = this.getRetailers();
    const suppliers = this.getSuppliers();

    const verifiedLines = entry.lines.map((l, i) => {
      const acc = accounts.find(a => a.id === l.accountId);
      const dr = Math.round(Number(l.debit || 0) * 100) / 100;
      const cr = Math.round(Number(l.credit || 0) * 100) / 100;
      totalDebit += dr;
      totalCredit += cr;

      let subEntityName = l.subEntityName;
      if (l.subEntityId && !subEntityName) {
        const ret = retailers.find(r => r.id === l.subEntityId);
        const sup = suppliers.find(s => s.id === l.subEntityId);
        subEntityName = ret?.shopName || sup?.name;
      }

      const displayName = subEntityName
        ? `${acc?.name || 'Account'} — ${subEntityName}`
        : (acc?.name || 'Unknown Account');

      return {
        id: `line_${i + 1}`,
        accountId: l.accountId,
        accountName: displayName,
        accountCode: acc?.code || '0000',
        debit: dr,
        credit: cr,
        narration: l.narration,
        subEntityId: l.subEntityId,
        subEntityName
      };
    });

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    // Strict double-entry check
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        message: `Voucher is unbalanced. Total Debits (₹${totalDebit}) must equal Total Credits (₹${totalCredit}). Difference: ₹${Math.abs(totalDebit - totalCredit).toFixed(2)}`
      };
    }

    const count = this.getJournalEntries().length + 1;
    const prefix = 
      entry.voucherType === 'SALES_VOUCHER' ? 'VR-SAL-' :
      entry.voucherType === 'PURCHASE_VOUCHER' ? 'VR-PUR-' :
      entry.voucherType === 'RECEIPT_VOUCHER' ? 'VR-REC-' :
      entry.voucherType === 'PAYMENT_VOUCHER' ? 'VR-PAY-' :
      entry.voucherType === 'CONTRA_VOUCHER' ? 'VR-CON-' : 'VR-JRN-';

    const voucherNumber = `${prefix}2026-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const journalEntry: JournalEntry = {
      id: `jrnl_${Date.now()}`,
      voucherNumber,
      voucherType: entry.voucherType,
      date: entry.date,
      lines: verifiedLines,
      totalDebit,
      totalCredit,
      isBalanced: true,
      narration: entry.narration,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      referenceNumber: entry.referenceNumber,
      isPosted: true,
      isReversed: false,
      createdByUserId: entry.actor.id,
      createdByUserName: entry.actor.name,
      createdAt: now
    };

    // Update account balances
    for (const l of verifiedLines) {
      const aIdx = accounts.findIndex(a => a.id === l.accountId);
      if (aIdx >= 0) {
        const acc = accounts[aIdx];
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.currentBalance += (l.debit - l.credit);
        } else {
          acc.currentBalance += (l.credit - l.debit);
        }
      }
    }
    this.setItem(this.K_ACCOUNTS, accounts);

    const journals = this.getJournalEntries();
    journals.unshift(journalEntry);
    this.setItem(this.K_JOURNALS, journals);

    this.logAudit(entry.actor, 'POST_VOUCHER', 'ACCOUNTING', journalEntry.id, voucherNumber, `Type: ${entry.voucherType}, Amount: ₹${totalDebit}`);
    return { success: true, entry: journalEntry };
  }

  /**
   * Set and post opening balances for financial year.
   * Requires strict debits == credits reconciliation check.
   */
  public setOpeningBalances(
    balances: { accountId: string; debit: number; credit: number }[],
    asOfDate: string,
    financialYear: string,
    actor: UserProfile
  ): { success: boolean; message?: string } {
    let totalDebit = 0;
    let totalCredit = 0;
    const accounts = this.getAccounts();

    balances.forEach(b => {
      totalDebit += Math.round(Number(b.debit || 0) * 100) / 100;
      totalCredit += Math.round(Number(b.credit || 0) * 100) / 100;
    });

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        message: `Opening Balances are unbalanced. Total Debits (₹${totalDebit.toFixed(2)}) must equal Total Credits (₹${totalCredit.toFixed(2)}). Reconciliation difference: ₹${Math.abs(totalDebit - totalCredit).toFixed(2)}`
      };
    }

    // Update account opening and current balances
    for (const b of balances) {
      const idx = accounts.findIndex(a => a.id === b.accountId);
      if (idx >= 0) {
        const acc = accounts[idx];
        const isDr = (b.debit || 0) > 0;
        const bal = isDr ? Number(b.debit) : Number(b.credit || 0);
        acc.openingBalance = bal;
        acc.openingBalanceType = isDr ? 'DR' : 'CR';

        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.currentBalance = (b.debit || 0) - (b.credit || 0);
          acc.currentBalanceType = acc.currentBalance >= 0 ? 'DR' : 'CR';
        } else {
          acc.currentBalance = (b.credit || 0) - (b.debit || 0);
          acc.currentBalanceType = acc.currentBalance >= 0 ? 'CR' : 'DR';
        }
      }
    }

    // Replay post-opening journal entries
    const existingJournals = this.getJournalEntries().filter(j => j.voucherNumber !== 'VR-OPEN-001');
    for (const j of existingJournals) {
      for (const l of j.lines) {
        const aIdx = accounts.findIndex(a => a.id === l.accountId);
        if (aIdx >= 0) {
          const acc = accounts[aIdx];
          if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
            acc.currentBalance += (l.debit - l.credit);
          } else {
            acc.currentBalance += (l.credit - l.debit);
          }
        }
      }
    }

    this.setItem(this.K_ACCOUNTS, accounts);

    // Create or update VR-OPEN-001
    const openingLines = balances
      .filter(b => (b.debit || 0) > 0 || (b.credit || 0) > 0)
      .map((b, i) => {
        const acc = accounts.find(a => a.id === b.accountId);
        return {
          id: `line_open_${i + 1}`,
          accountId: b.accountId,
          accountName: acc?.name || 'Account',
          accountCode: acc?.code || '0000',
          debit: Math.round(Number(b.debit || 0) * 100) / 100,
          credit: Math.round(Number(b.credit || 0) * 100) / 100
        };
      });

    if (openingLines.length > 0) {
      const openJournal: JournalEntry = {
        id: 'jrnl_open_01',
        voucherNumber: 'VR-OPEN-001',
        voucherType: 'JOURNAL_VOUCHER',
        date: asOfDate,
        totalDebit,
        totalCredit,
        isBalanced: true,
        narration: `Opening Financial Balances for Financial Year ${financialYear}`,
        lines: openingLines,
        isPosted: true,
        isReversed: false,
        createdByUserId: actor.id,
        createdByUserName: actor.name,
        createdAt: new Date().toISOString()
      };
      this.setItem(this.K_JOURNALS, [openJournal, ...existingJournals]);
    } else {
      this.setItem(this.K_JOURNALS, existingJournals);
    }

    this.logAudit(actor, 'UPDATE_OPENING_BALANCES', 'ACCOUNTING', 'VR-OPEN-001', 'Opening Balances', `Posted opening balance voucher for FY ${financialYear}. Total: ₹${totalDebit}`);
    return { success: true };
  }

  private postSalesVoucherForOrder(order: SalesOrder, actor: UserProfile) {
    // Dr. Sundry Debtors (Total Invoice Amount)
    // Cr. Sales Revenue (Taxable Amount)
    // Cr. Output GST (GST Amount)
    this.postJournalEntry({
      voucherType: 'SALES_VOUCHER',
      date: order.orderDate.split('T')[0],
      narration: `Credit Sale to ${order.retailerShopName} (Order: ${order.orderNumber}, Inv: ${order.invoiceNumber})`,
      referenceType: 'SALES_INVOICE',
      referenceId: order.id,
      referenceNumber: order.invoiceNumber,
      lines: [
        {
          accountId: 'acc_sundry_debtors',
          debit: order.grandTotal,
          credit: 0,
          narration: `Due from ${order.retailerShopName}`,
          subEntityId: order.retailerId,
          subEntityName: order.retailerShopName
        },
        {
          accountId: 'acc_sales_revenue',
          debit: 0,
          credit: order.taxableSubtotal,
          narration: `Wholesale sales revenue`
        },
        {
          accountId: 'acc_output_gst',
          debit: 0,
          credit: order.totalGst,
          narration: `Output GST on sales`
        }
      ],
      actor
    });

    // Update retailer outstanding balance
    const retailers = this.getRetailers();
    const rIdx = retailers.findIndex(r => r.id === order.retailerId);
    if (rIdx >= 0) {
      retailers[rIdx].currentOutstanding += order.dueAmount;
      this.setItem(this.K_RETAILERS, retailers);
    }
  }

  private postPurchaseVoucher(grn: GoodsReceiptNote, actor: UserProfile) {
    // Dr. Purchases Aachi Stock (Taxable Amount)
    // Dr. Input Tax Credit (GST Amount)
    // Cr. Sundry Creditors (Supplier Total Amount)
    this.postJournalEntry({
      voucherType: 'PURCHASE_VOUCHER',
      date: grn.receivedDate,
      narration: `Purchase from ${grn.supplierName} (GRN: ${grn.grnNumber}, Supplier Inv: ${grn.supplierInvoiceNumber})`,
      referenceType: 'PURCHASE_INVOICE',
      referenceId: grn.id,
      referenceNumber: grn.supplierInvoiceNumber,
      lines: [
        {
          accountId: 'acc_purchases',
          debit: grn.totalTaxable,
          credit: 0,
          narration: `Stock inward`
        },
        {
          accountId: 'acc_input_gst',
          debit: grn.totalGst,
          credit: 0,
          narration: `Input GST claimed`
        },
        {
          accountId: 'acc_sundry_creditors',
          debit: 0,
          credit: grn.grandTotal,
          narration: `Payable to ${grn.supplierName}`,
          subEntityId: grn.supplierId,
          subEntityName: grn.supplierName
        }
      ],
      actor
    });
  }

  // --- DAY BOOK & FINANCIAL REPORTS ---
  public getDayBook(fromDate?: string, toDate?: string): DayBookRow[] {
    const journals = this.getJournalEntries();
    const rows: DayBookRow[] = [];

    for (const j of journals) {
      if (fromDate && j.date < fromDate) continue;
      if (toDate && j.date > toDate) continue;

      for (const line of j.lines) {
        rows.push({
          id: `${j.id}_${line.id}`,
          date: j.date,
          voucherNumber: j.voucherNumber,
          voucherType: j.voucherType,
          particulars: line.narration || j.narration,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          narration: j.narration,
          subEntityId: line.subEntityId,
          subEntityName: line.subEntityName
        });
      }
    }
    return rows;
  }

  public getTrialBalance(): TrialBalanceReport {
    const accounts = this.getAccounts();
    const journals = this.getJournalEntries();

    const items = accounts.map(acc => {
      let debitTotal = acc.openingBalanceType === 'DR' ? acc.openingBalance : 0;
      let creditTotal = acc.openingBalanceType === 'CR' ? acc.openingBalance : 0;

      for (const j of journals) {
        for (const l of j.lines) {
          if (l.accountId === acc.id) {
            debitTotal += l.debit;
            creditTotal += l.credit;
          }
        }
      }

      let closingDebit = 0;
      let closingCredit = 0;

      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        const net = debitTotal - creditTotal;
        if (net >= 0) closingDebit = net;
        else closingCredit = -net;
      } else {
        const net = creditTotal - debitTotal;
        if (net >= 0) closingCredit = net;
        else closingDebit = -net;
      }

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        type: acc.type,
        subGroup: acc.subGroup,
        debitTotal,
        creditTotal,
        closingDebit,
        closingCredit
      };
    });

    const totalDebit = items.reduce((sum, i) => sum + i.closingDebit, 0);
    const totalCredit = items.reduce((sum, i) => sum + i.closingCredit, 0);

    return {
      items,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.05,
      generatedAt: new Date().toISOString()
    };
  }

  public getProfitAndLoss(fromDate?: string, toDate?: string): ProfitLossReport {
    const journals = this.getJournalEntries();
    let salesRevenue = 0;
    let costOfGoodsSold = 0;
    let freightAndDelivery = 0;
    let operatingExpenses = 0;
    let salaryExpenses = 0;
    let utilitiesAndRent = 0;

    for (const j of journals) {
      if (fromDate && j.date < fromDate) continue;
      if (toDate && j.date > toDate) continue;

      for (const l of j.lines) {
        if (l.accountId === 'acc_sales_revenue') {
          salesRevenue += (l.credit - l.debit);
        } else if (l.accountId === 'acc_purchases') {
          costOfGoodsSold += (l.debit - l.credit);
        } else if (l.accountId === 'acc_freight') {
          freightAndDelivery += (l.debit - l.credit);
        } else if (l.accountId === 'acc_vehicle_fuel') {
          operatingExpenses += (l.debit - l.credit);
        } else if (l.accountId === 'acc_staff_salary') {
          salaryExpenses += (l.debit - l.credit);
        } else if (l.accountId === 'acc_rent_utilities') {
          utilitiesAndRent += (l.debit - l.credit);
        }
      }
    }

    const totalExpenses = costOfGoodsSold + freightAndDelivery + operatingExpenses + salaryExpenses + utilitiesAndRent;
    const grossProfit = salesRevenue - costOfGoodsSold;
    const netProfit = salesRevenue - totalExpenses;

    return {
      fromDate: fromDate || '2026-04-01',
      toDate: toDate || new Date().toISOString().split('T')[0],
      income: {
        salesRevenue,
        otherIncome: 0,
        totalIncome: salesRevenue
      },
      expenses: {
        costOfGoodsSold,
        freightAndDelivery,
        operatingExpenses,
        salaryExpenses,
        utilitiesAndRent,
        totalExpenses
      },
      grossProfit,
      netProfit
    };
  }

  public getBalanceSheet(asOfDate?: string): BalanceSheetReport {
    const accounts = this.getAccounts();
    const pnl = this.getProfitAndLoss('2026-04-01', asOfDate);

    const sumGroup = (subGroup: string) => {
      return accounts
        .filter(a => a.subGroup === subGroup)
        .reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    };

    const getBal = (id: string) => {
      const acc = accounts.find(a => a.id === id);
      return acc?.currentBalance || 0;
    };

    const cashInHand = sumGroup('CASH_IN_HAND');
    const bankBalances = sumGroup('BANK_ACCOUNTS');
    const accountsReceivable = sumGroup('SUNDRY_DEBTORS');
    const inventoryValuation = sumGroup('INVENTORY_STOCK');
    
    // Duties & Taxes net position:
    const itcAsset = Math.max(0, getBal('acc_input_gst'));
    const taxLiability = Math.max(0, getBal('acc_output_gst'));

    const totalCurrentAssets = Math.round((cashInHand + bankBalances + accountsReceivable + inventoryValuation + itcAsset) * 100) / 100;

    const accountsPayable = sumGroup('SUNDRY_CREDITORS');
    const totalCurrentLiabilities = Math.round((accountsPayable + taxLiability) * 100) / 100;

    const ownerCapital = sumGroup('CAPITAL_ACCOUNT');
    const retainedEarnings = sumGroup('RETAINED_EARNINGS');
    const currentPeriodProfit = pnl.netProfit;
    const totalEquity = Math.round((ownerCapital + retainedEarnings + currentPeriodProfit) * 100) / 100;

    const totalAssets = totalCurrentAssets;
    const totalLiabilitiesAndEquity = Math.round((totalCurrentLiabilities + totalEquity) * 100) / 100;

    return {
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      assets: {
        currentAssets: {
          cashInHand,
          bankBalances,
          accountsReceivable,
          inventoryValuation,
          totalCurrentAssets
        },
        fixedAssets: 0,
        totalAssets
      },
      liabilitiesAndEquity: {
        currentLiabilities: {
          accountsPayable,
          taxLiabilities: taxLiability,
          totalCurrentLiabilities
        },
        capitalAndReserves: {
          ownerCapital,
          retainedEarnings,
          currentPeriodProfit,
          totalEquity
        },
        totalLiabilitiesAndEquity
      },
      isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05
    };
  }

  // --- BANK RECONCILIATION ---
  public getBankAccounts(): BankAccount[] {
    return this.getItem(this.K_BANK_ACCOUNTS, INITIAL_BANK_ACCOUNTS);
  }

  public addBankAccount(
    bankData: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      ifscCode: string;
      branch: string;
      accountType: 'CURRENT' | 'SAVINGS' | 'OVERDRAFT';
      openingBalance: number;
      upiId?: string;
    },
    actor: UserProfile
  ): BankAccount {
    const bankAccounts = this.getBankAccounts();
    const accounts = this.getAccounts();
    const bankId = `bank_${Date.now()}`;
    const glAccountId = `acc_bank_${Date.now()}`;

    // 1. Create Ledger Account in COA under BANK_ACCOUNTS
    const newAccount: Account = {
      id: glAccountId,
      code: `102${bankAccounts.length + 1}`,
      name: `${bankData.bankName} (${bankData.accountNumber.slice(-4)})`,
      type: 'ASSET',
      subGroup: 'BANK_ACCOUNTS',
      openingBalance: bankData.openingBalance || 0,
      openingBalanceType: 'DR',
      currentBalance: bankData.openingBalance || 0,
      currentBalanceType: 'DR',
      isSystem: false,
      isActive: true
    };
    accounts.push(newAccount);
    this.setItem(this.K_ACCOUNTS, accounts);

    // 2. Create BankAccount Record
    const newBank: BankAccount = {
      id: bankId,
      bankName: bankData.bankName,
      accountName: bankData.accountName,
      accountNumber: bankData.accountNumber,
      ifscCode: bankData.ifscCode,
      branch: bankData.branch,
      accountType: bankData.accountType,
      openingBalance: bankData.openingBalance || 0,
      currentBookBalance: bankData.openingBalance || 0,
      currentBalance: bankData.openingBalance || 0,
      upiId: bankData.upiId || '',
      glAccountId,
      isActive: true
    };
    bankAccounts.push(newBank);
    this.setItem(this.K_BANK_ACCOUNTS, bankAccounts);

    this.logAudit(actor, 'ADD_BANK_ACCOUNT', 'BANK_REC', newBank.id, newBank.bankName, `Acc: ${newBank.accountNumber}`);
    return newBank;
  }

  public deleteBankAccount(bankId: string, actor: UserProfile) {
    let bankAccounts = this.getBankAccounts();
    const target = bankAccounts.find(b => b.id === bankId);
    if (!target) return;

    bankAccounts = bankAccounts.filter(b => b.id !== bankId);
    this.setItem(this.K_BANK_ACCOUNTS, bankAccounts);

    const accounts = this.getAccounts();
    const accIdx = accounts.findIndex(a => a.id === target.glAccountId);
    if (accIdx >= 0) {
      accounts[accIdx].isActive = false;
      this.setItem(this.K_ACCOUNTS, accounts);
    }

    this.logAudit(actor, 'DELETE_BANK_ACCOUNT', 'BANK_REC', bankId, target.bankName, `Removed bank account`);
  }

  public getBankStatements(): BankStatement[] {
    return this.getItem(this.K_BANK_STATEMENTS, []);
  }

  public importBankStatement(
    bankAccountId: string,
    fileName: string,
    transactions: Omit<BankStatementTransaction, 'id' | 'statementId' | 'matchStatus'>[],
    actor: UserProfile
  ): BankStatement {
    const bankAccounts = this.getBankAccounts();
    const bank = bankAccounts.find(b => b.id === bankAccountId);
    const statementId = `stmt_${Date.now()}`;
    const journals = this.getJournalEntries();

    let matchedCount = 0;
    const processedTxs: BankStatementTransaction[] = transactions.map((tx, idx) => {
      // Auto-match algorithm: match against journal entries for this bank with same amount and within 3 days
      let matchStatus: BankStatementTransaction['matchStatus'] = 'UNMATCHED';
      let matchedJournalEntryId: string | undefined;

      for (const j of journals) {
        const line = j.lines.find(l => l.accountId === bank?.glAccountId);
        if (line) {
          const expectedType = tx.type === 'CR' ? 'debit' : 'credit';
          const lineAmount = expectedType === 'debit' ? line.debit : line.credit;
          if (Math.abs(lineAmount - tx.amount) < 0.05) {
            matchStatus = 'MATCHED';
            matchedJournalEntryId = j.id;
            matchedCount++;
            break;
          }
        }
      }

      return {
        ...tx,
        id: `tx_${statementId}_${idx + 1}`,
        statementId,
        matchStatus,
        matchedJournalEntryId
      };
    });

    const newStatement: BankStatement = {
      id: statementId,
      bankAccountId,
      bankName: bank?.bankName || 'Unknown Bank',
      fileName,
      importedAt: new Date().toISOString(),
      importedBy: actor.name,
      periodStart: transactions[0]?.transactionDate || new Date().toISOString().split('T')[0],
      periodEnd: transactions[transactions.length - 1]?.transactionDate || new Date().toISOString().split('T')[0],
      openingBalance: bank?.openingBalance || 0,
      closingBalance: bank?.currentBookBalance || 0,
      totalCredits: transactions.filter(t => t.type === 'CR').reduce((s, t) => s + t.amount, 0),
      totalDebits: transactions.filter(t => t.type === 'DR').reduce((s, t) => s + t.amount, 0),
      totalTransactions: transactions.length,
      matchedTransactions: matchedCount,
      unmatchedTransactions: transactions.length - matchedCount,
      status: matchedCount === transactions.length ? 'RECONCILED' : 'PARTIALLY_RECONCILED'
    };

    // Store statement
    const statements = this.getBankStatements();
    statements.unshift(newStatement);
    this.setItem(this.K_BANK_STATEMENTS, statements);

    this.logAudit(actor, 'IMPORT_BANK_STATEMENT', 'BANK_REC', statementId, fileName, `Total: ${transactions.length} items, Matched: ${matchedCount}`);
    return newStatement;
  }

  // --- CUSTOMER CREDIT & COLLECTIONS ---
  public getCollectionReceipts(): CollectionReceipt[] {
    return this.getItem(this.K_COLLECTIONS, []);
  }

  public recordCollectionReceipt(data: Omit<CollectionReceipt, 'id' | 'receiptNumber' | 'createdAt' | 'isPostedToLedger'>, actor: UserProfile): CollectionReceipt {
    const list = this.getCollectionReceipts();
    const count = list.length + 1;
    const receiptNumber = `REC-2026-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const receipt: CollectionReceipt = {
      ...data,
      id: `rec_${Date.now()}`,
      receiptNumber,
      isPostedToLedger: true,
      createdAt: now
    };

    // 1. Reduce retailer outstanding balance
    const retailers = this.getRetailers();
    const rIdx = retailers.findIndex(r => r.id === data.retailerId);
    if (rIdx >= 0) {
      retailers[rIdx].currentOutstanding = Math.max(0, retailers[rIdx].currentOutstanding - data.amount);
      this.setItem(this.K_RETAILERS, retailers);
    }

    // 2. Update settled invoices if any
    if (data.settledInvoices && data.settledInvoices.length > 0) {
      const invoices = this.getInvoices();
      for (const item of data.settledInvoices) {
        const invIdx = invoices.findIndex(i => i.id === item.invoiceId);
        if (invIdx >= 0) {
          invoices[invIdx].amountPaid += item.allocatedAmount;
          invoices[invIdx].amountDue = Math.max(0, invoices[invIdx].totalInvoiceAmount - invoices[invIdx].amountPaid);
          invoices[invIdx].paymentStatus = invoices[invIdx].amountDue === 0 ? 'PAID' : 'PARTIALLY_PAID';
        }
      }
      this.setItem(this.K_INVOICES, invoices);
    }

    // 3. Post Receipt Voucher in Accounting:
    // Dr. Cash in Hand or Bank Account
    // Cr. Sundry Debtors
    this.postJournalEntry({
      voucherType: 'RECEIPT_VOUCHER',
      date: data.date,
      narration: `Receipt from ${data.retailerShopName} (Ref/UTR: ${data.referenceNumber})`,
      referenceType: 'PAYMENT',
      referenceId: receipt.id,
      referenceNumber: receiptNumber,
      lines: [
        {
          accountId: data.depositToAccountId || 'acc_cash_01',
          debit: data.amount,
          credit: 0,
          narration: `Collection deposit`
        },
        {
          accountId: 'acc_sundry_debtors',
          debit: 0,
          credit: data.amount,
          narration: `Payment from ${data.retailerShopName}`,
          subEntityId: data.retailerId,
          subEntityName: data.retailerShopName
        }
      ],
      actor
    });

    list.unshift(receipt);
    this.setItem(this.K_COLLECTIONS, list);

    this.logAudit(actor, 'RECORD_COLLECTION', 'CREDIT', receipt.id, receiptNumber, `Amount: ₹${data.amount}, Retailer: ${data.retailerShopName}`);
    return receipt;
  }

  public getPettyExpenses(): PettyExpense[] {
    return this.getItem(this.K_EXPENSES, []);
  }

  public recordPettyExpense(data: Omit<PettyExpense, 'id' | 'expenseNumber' | 'createdAt'>, actor: UserProfile): PettyExpense {
    const list = this.getPettyExpenses();
    const count = list.length + 1;
    const expenseNumber = `EXP-2026-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const expense: PettyExpense = {
      ...data,
      id: `exp_${Date.now()}`,
      expenseNumber,
      createdAt: now
    };

    // Determine expense account
    const expenseAccountId = 
      data.category === 'DELIVERY_FUEL' || data.category === 'VEHICLE_MAINTENANCE' ? 'acc_vehicle_fuel' :
      data.category === 'PACKAGING_MATERIAL' ? 'acc_freight' : 'acc_rent_utilities';

    // Post Payment Voucher
    this.postJournalEntry({
      voucherType: 'PAYMENT_VOUCHER',
      date: data.date,
      narration: `Expense: ${data.description} (Paid to ${data.paidTo})`,
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      referenceNumber: expenseNumber,
      lines: [
        {
          accountId: expenseAccountId,
          debit: data.amount,
          credit: 0,
          narration: data.description
        },
        {
          accountId: data.paidFromAccountId || 'acc_cash_petty',
          debit: 0,
          credit: data.amount,
          narration: `Paid for ${data.category}`
        }
      ],
      actor
    });

    list.unshift(expense);
    this.setItem(this.K_EXPENSES, list);

    this.logAudit(actor, 'RECORD_EXPENSE', 'ACCOUNTING', expense.id, expenseNumber, `Amount: ₹${data.amount}, Category: ${data.category}`);
    return expense;
  }

  public getCustomerCreditProfiles(): CustomerCreditProfile[] {
    const retailers = this.getRetailers();
    const invoices = this.getInvoices();

    return retailers.map(ret => {
      const retInvoices = invoices.filter(i => i.retailerId === ret.id);
      const totalInvoiced = retInvoices.reduce((s, i) => s + i.totalInvoiceAmount, 0);
      const totalCollected = retInvoices.reduce((s, i) => s + i.amountPaid, 0);

      // Ageing breakdown
      const now = Date.now();
      let current_0_30 = 0;
      let days_31_60 = 0;
      let days_61_90 = 0;
      let days_90_plus = 0;

      for (const inv of retInvoices) {
        if (inv.amountDue > 0) {
          const invTime = new Date(inv.invoiceDate).getTime();
          const daysDiff = Math.floor((now - invTime) / 86400000);
          if (daysDiff <= 30) current_0_30 += inv.amountDue;
          else if (daysDiff <= 60) days_31_60 += inv.amountDue;
          else if (daysDiff <= 90) days_61_90 += inv.amountDue;
          else days_90_plus += inv.amountDue;
        }
      }

      return {
        retailerId: ret.id,
        retailerShopName: ret.shopName,
        creditLimit: ret.creditLimit,
        creditDays: ret.creditDays,
        totalInvoiced,
        totalCollected,
        currentOutstanding: ret.currentOutstanding,
        availableCredit: Math.max(0, ret.creditLimit - ret.currentOutstanding),
        isCreditExceeded: ret.currentOutstanding > ret.creditLimit,
        ageing: {
          current_0_30,
          days_31_60,
          days_61_90,
          days_90_plus
        }
      };
    });
  }

  public getSupplierCreditorProfiles(): SupplierCreditorProfile[] {
    const suppliers = this.getSuppliers();
    const grns = this.getGoodsReceiptNotes();
    const journals = this.getJournalEntries();
    const now = Date.now();

    return suppliers.map(sup => {
      const supGrns = grns.filter(g => g.supplierId === sup.id);
      const totalPurchased = supGrns.reduce((sum, g) => sum + g.grandTotal, 0);

      let totalPaid = 0;
      let lastPaymentDate: string | undefined;
      let lastPaymentAmount: number | undefined;

      for (const j of journals) {
        if (j.voucherType === 'PAYMENT_VOUCHER') {
          for (const l of j.lines) {
            if (l.accountId === 'acc_sundry_creditors' && (l.subEntityId === sup.id || j.narration.toLowerCase().includes(sup.name.toLowerCase()))) {
              if (l.debit > 0) {
                totalPaid += l.debit;
                if (!lastPaymentDate || j.date > lastPaymentDate) {
                  lastPaymentDate = j.date;
                  lastPaymentAmount = l.debit;
                }
              }
            }
          }
        }
      }

      const openingBal = sup.openingBalance || 0;
      const currentPayable = Math.max(0, openingBal + totalPurchased - totalPaid);

      let current_0_30 = 0;
      let days_31_60 = 0;
      let days_61_90 = 0;
      let days_90_plus = 0;

      if (currentPayable > 0) {
        let remaining = currentPayable;
        for (const g of supGrns) {
          if (remaining <= 0) break;
          const gTime = new Date(g.receivedDate).getTime();
          const daysDiff = Math.max(0, Math.floor((now - gTime) / 86400000));
          const chunk = Math.min(remaining, g.grandTotal);
          remaining -= chunk;

          if (daysDiff <= 30) current_0_30 += chunk;
          else if (daysDiff <= 60) days_31_60 += chunk;
          else if (daysDiff <= 90) days_61_90 += chunk;
          else days_90_plus += chunk;
        }
        if (remaining > 0) {
          days_90_plus += remaining;
        }
      }

      return {
        supplierId: sup.id,
        supplierName: sup.name,
        supplierCode: sup.supplierCode || sup.id,
        contactPerson: sup.contactPerson,
        phone: sup.phone,
        city: sup.city,
        gstin: sup.gstin,
        paymentTermsDays: sup.paymentTermsDays || 30,
        totalPurchased: Math.round(totalPurchased * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        currentPayable: Math.round(currentPayable * 100) / 100,
        ageing: {
          current_0_30: Math.round(current_0_30 * 100) / 100,
          days_31_60: Math.round(days_31_60 * 100) / 100,
          days_61_90: Math.round(days_61_90 * 100) / 100,
          days_90_plus: Math.round(days_90_plus * 100) / 100
        },
        lastPaymentDate,
        lastPaymentAmount
      };
    });
  }

  public recordSupplierPayment(
    data: {
      supplierId: string;
      date: string;
      amount: number;
      paymentMethod: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
      referenceNumber: string;
      paidFromAccountId: string;
      notes?: string;
    },
    actor: UserProfile
  ): { success: boolean; voucherNumber?: string; message?: string } {
    const suppliers = this.getSuppliers();
    const supIdx = suppliers.findIndex(s => s.id === data.supplierId);
    if (supIdx < 0) return { success: false, message: 'Supplier not found' };

    const supplier = suppliers[supIdx];

    const voucherResult = this.postJournalEntry({
      voucherType: 'PAYMENT_VOUCHER',
      date: data.date,
      narration: `Payment to ${supplier.name} (Ref: ${data.referenceNumber}) - ${data.paymentMethod}`,
      referenceType: 'PAYMENT',
      referenceId: `pay_${Date.now()}`,
      referenceNumber: data.referenceNumber,
      lines: [
        {
          accountId: 'acc_sundry_creditors',
          debit: data.amount,
          credit: 0,
          narration: `Disbursement to ${supplier.name}`,
          subEntityId: supplier.id,
          subEntityName: supplier.name
        },
        {
          accountId: data.paidFromAccountId || 'acc_cash_01',
          debit: 0,
          credit: data.amount,
          narration: `${data.paymentMethod} payment for supplier dues`
        }
      ],
      actor
    });

    if (!voucherResult.success) {
      return { success: false, message: voucherResult.message };
    }

    supplier.currentOutstandingBalance = Math.max(0, (supplier.currentOutstandingBalance || 0) - data.amount);
    suppliers[supIdx] = supplier;
    this.setItem(this.K_SUPPLIERS, suppliers);

    this.logAudit(actor, 'RECORD_SUPPLIER_PAYMENT', 'PURCHASE', supplier.id, supplier.name, `Paid ₹${data.amount} via ${data.paymentMethod} (Ref: ${data.referenceNumber})`);
    return { success: true, voucherNumber: voucherResult.entry?.voucherNumber };
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): AppNotification[] {
    return this.getItem(this.K_NOTIFICATIONS, []);
  }

  public addNotification(note: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) {
    const list = this.getNotifications();
    const newNote: AppNotification = {
      ...note,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    list.unshift(newNote);
    this.setItem(this.K_NOTIFICATIONS, list);
  }

  public markNotificationRead(id: string) {
    const list = this.getNotifications();
    const item = list.find(n => n.id === id);
    if (item) {
      item.isRead = true;
      this.setItem(this.K_NOTIFICATIONS, list);
    }
  }

  public markAllNotificationsRead() {
    const list = this.getNotifications().map(n => ({ ...n, isRead: true }));
    this.setItem(this.K_NOTIFICATIONS, list);
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.getItem(this.K_AUDIT_LOGS, []);
  }

  public archiveProduct(productId: string, actor: UserProfile): { success: boolean; message: string } {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx < 0) return { success: false, message: 'Product not found.' };

    const prod = products[idx];
    prod.isActive = false;
    prod.isArchived = true;
    prod.updatedAt = new Date().toISOString();
    products[idx] = prod;
    this.setItem(this.K_PRODUCTS, products);

    this.logAudit(actor, 'ARCHIVE_PRODUCT', 'CATALOGUE', prod.id, prod.name, `Archived SKU: ${prod.sku}`);
    return { success: true, message: `Product ${prod.name} successfully archived.` };
  }

  // --- PURCHASE ACCOUNT DRILL-DOWN LEDGER ---
  public getPurchaseLedger(fromDate?: string, toDate?: string): {
    entries: PurchaseLedgerEntry[];
    totalTaxable: number;
    totalGst: number;
    grandTotal: number;
  } {
    const journals = this.getJournalEntries();
    const grns = this.getGoodsReceiptNotes();
    const entries: PurchaseLedgerEntry[] = [];

    let totalTaxable = 0;
    let totalGst = 0;
    let grandTotal = 0;

    for (const j of journals) {
      if (fromDate && j.date < fromDate) continue;
      if (toDate && j.date > toDate) continue;

      const purchaseLine = j.lines.find(l => l.accountId === 'acc_purchases');
      if (!purchaseLine || purchaseLine.debit === 0) continue;

      const taxable = purchaseLine.debit - purchaseLine.credit;
      const gstLine = j.lines.find(l => l.accountId === 'acc_input_gst');
      const gst = gstLine ? gstLine.debit : taxable * 0.05;
      const credLine = j.lines.find(l => l.accountId === 'acc_sundry_creditors');
      const invoiceTotal = credLine ? credLine.credit : taxable + gst;

      // Match against GRN if linked
      const grn = grns.find(g => g.id === j.referenceId || g.grnNumber === j.referenceNumber);
      const supplierName = grn?.supplierName || (j.narration.includes('from ') ? j.narration.split('from ')[1].split(' (')[0] : 'Supplier');
      const supplierInvoiceNumber = grn?.supplierInvoiceNumber || j.referenceNumber || 'PUR-INV';

      totalTaxable += taxable;
      totalGst += gst;
      grandTotal += invoiceTotal;

      entries.push({
        id: j.id,
        date: j.date,
        voucherNumber: j.voucherNumber,
        voucherType: j.voucherType,
        supplierId: grn?.supplierId || 'sup_general',
        supplierName,
        supplierInvoiceNumber,
        taxableAmount: taxable,
        cgstAmount: gst / 2,
        sgstAmount: gst / 2,
        totalGst: gst,
        totalInvoiceAmount: invoiceTotal,
        status: j.isPosted ? 'POSTED' : 'VERIFIED',
        paymentStatus: 'UNPAID',
        grnId: grn?.id,
        grnNumber: grn?.grnNumber,
        narration: j.narration
      });
    }

    return {
      entries,
      totalTaxable: Math.round(totalTaxable * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100
    };
  }

  // --- BALANCE SHEET: SUPPLIER-WISE SUNDRY CREDITORS ---
  public getSupplierCreditorsLedger(asOfDate?: string): {
    suppliers: SupplierCreditorSummary[];
    totalCreditors: number;
  } {
    const suppliers = this.getSuppliers();
    const journals = this.getJournalEntries();
    const grns = this.getGoodsReceiptNotes();

    const supplierSummaries: SupplierCreditorSummary[] = suppliers.map(sup => {
      const openingBalance = sup.openingBalance || 0;
      let creditPurchases = 0;
      let paymentsMade = 0;
      let adjustments = 0;

      for (const j of journals) {
        if (asOfDate && j.date > asOfDate) continue;
        if (j.voucherNumber === 'VR-OPEN-001') continue;

        // Check if voucher affects sundry creditors
        for (const l of j.lines) {
          if (l.accountId === 'acc_sundry_creditors') {
            const matchesSupplier =
              l.subEntityId === sup.id ||
              j.narration.toLowerCase().includes(sup.name.toLowerCase()) ||
              (sup.id === suppliers[0]?.id && !l.subEntityId);

            if (matchesSupplier) {
              if (l.credit > 0) {
                creditPurchases += l.credit;
              }
              if (l.debit > 0) {
                paymentsMade += l.debit;
              }
            }
          }
        }
      }

      const closingBalance = openingBalance + creditPurchases - paymentsMade - adjustments;

      return {
        supplierId: sup.id,
        supplierName: sup.name,
        supplierCode: sup.supplierCode || sup.id,
        gstin: sup.gstin,
        openingBalance,
        creditPurchases,
        paymentsMade,
        adjustments,
        closingBalance: Math.max(0, closingBalance)
      };
    });

    const totalCreditors = supplierSummaries.reduce((sum, s) => sum + s.closingBalance, 0);

    return {
      suppliers: supplierSummaries,
      totalCreditors: Math.round(totalCreditors * 100) / 100
    };
  }

  public getSupplierDetailedLedger(supplierId: string, fromDate?: string, toDate?: string): {
    supplier?: Supplier;
    summary: SupplierCreditorSummary;
    transactions: SupplierLedgerTransaction[];
  } {
    const suppliers = this.getSuppliers();
    const sup = suppliers.find(s => s.id === supplierId) || suppliers[0];

    if (!sup) {
      return {
        supplier: undefined,
        summary: {
          supplierId: supplierId || 'sup_none',
          supplierName: 'No Supplier Configured',
          supplierCode: '-',
          gstin: '-',
          openingBalance: 0,
          creditPurchases: 0,
          paymentsMade: 0,
          adjustments: 0,
          closingBalance: 0
        },
        transactions: []
      };
    }

    const journals = this.getJournalEntries();
    const grns = this.getGoodsReceiptNotes();

    const transactions: SupplierLedgerTransaction[] = [];
    const openingBalance = sup.openingBalance || 0;
    let runningBalance = openingBalance;

    if (openingBalance > 0) {
      transactions.push({
        id: `open_${sup.id}`,
        date: this.getSettings().financialYearStartDate || '2026-04-01',
        voucherNumber: 'VR-OPEN-001',
        voucherType: 'JOURNAL_VOUCHER',
        supplierInvoiceNumber: 'OPENING',
        particulars: `Opening Balance B/F - ${sup.name}`,
        debit: 0,
        credit: openingBalance,
        runningBalance: openingBalance
      });
    }

    let creditPurchases = 0;
    let paymentsMade = 0;

    for (const j of journals) {
      if (fromDate && j.date < fromDate) continue;
      if (toDate && j.date > toDate) continue;
      if (j.voucherNumber === 'VR-OPEN-001') continue;

      for (const l of j.lines) {
        if (l.accountId === 'acc_sundry_creditors') {
          const matches =
            l.subEntityId === sup.id ||
            j.narration.toLowerCase().includes(sup.name.toLowerCase()) ||
            (sup.id === suppliers[0]?.id && !l.subEntityId);

          if (matches) {
            if (l.credit > 0) {
              creditPurchases += l.credit;
              runningBalance += l.credit;
            }
            if (l.debit > 0) {
              paymentsMade += l.debit;
              runningBalance -= l.debit;
            }

            const grn = grns.find(g => g.id === j.referenceId || g.grnNumber === j.referenceNumber);
            transactions.push({
              id: `${j.id}_${l.id}`,
              date: j.date,
              voucherNumber: j.voucherNumber,
              voucherType: j.voucherType,
              supplierInvoiceNumber: grn?.supplierInvoiceNumber || j.referenceNumber || '-',
              particulars: l.narration || j.narration,
              debit: l.debit,
              credit: l.credit,
              runningBalance: Math.round(runningBalance * 100) / 100,
              referenceNumber: j.referenceNumber
            });
          }
        }
      }
    }

    return {
      supplier: sup,
      summary: {
        supplierId: sup.id,
        supplierName: sup.name,
        supplierCode: sup.supplierCode || sup.id,
        gstin: sup.gstin,
        openingBalance: sup.openingBalance || 0,
        creditPurchases,
        paymentsMade,
        adjustments: 0,
        closingBalance: Math.max(0, runningBalance)
      },
      transactions
    };
  }

  // --- CUSTOMER (DEBTOR) DETAILED LEDGER WITH RUNNING BALANCE ---
  public getCustomerDetailedLedger(retailerId: string, fromDate?: string, toDate?: string): {
    retailer?: Retailer;
    summary: CustomerDebtorSummary;
    transactions: CustomerLedgerTransaction[];
  } {
    const retailers = this.getRetailers();
    const ret = retailers.find(r => r.id === retailerId) || retailers[0];

    if (!ret) {
      return {
        retailer: undefined,
        summary: {
          retailerId: retailerId || 'ret_none',
          retailerShopName: 'No Retailer Configured',
          ownerName: '-',
          phone: '-',
          gstin: '-',
          openingBalance: 0,
          totalInvoiced: 0,
          totalCollected: 0,
          closingBalance: 0,
          creditLimit: 0
        },
        transactions: []
      };
    }

    const journals = this.getJournalEntries();
    const orders = this.getOrders();
    const transactions: CustomerLedgerTransaction[] = [];
    const openingBalance = ret.openingBalance || 0;
    let runningBalance = openingBalance;

    if (openingBalance > 0) {
      transactions.push({
        id: `open_${ret.id}`,
        date: this.getSettings().financialYearStartDate || '2026-04-01',
        voucherNumber: 'VR-OPEN-001',
        voucherType: 'JOURNAL_VOUCHER',
        invoiceNumber: 'OPENING',
        particulars: `Opening Balance B/F - ${ret.shopName}`,
        debit: openingBalance,
        credit: 0,
        runningBalance: openingBalance
      });
    }

    let totalInvoiced = 0;
    let totalCollected = 0;

    for (const j of journals) {
      if (fromDate && j.date < fromDate) continue;
      if (toDate && j.date > toDate) continue;
      if (j.voucherNumber === 'VR-OPEN-001') continue;

      for (const l of j.lines) {
        if (l.accountId === 'acc_sundry_debtors') {
          const matches =
            l.subEntityId === ret.id ||
            j.narration.toLowerCase().includes(ret.shopName.toLowerCase()) ||
            (l.subEntityName && l.subEntityName.toLowerCase().includes(ret.shopName.toLowerCase())) ||
            (ret.id === retailers[0]?.id && !l.subEntityId);

          if (matches) {
            if (l.debit > 0) {
              totalInvoiced += l.debit;
              runningBalance += l.debit;
            }
            if (l.credit > 0) {
              totalCollected += l.credit;
              runningBalance -= l.credit;
            }

            const order = orders.find(o => o.id === j.referenceId || o.orderNumber === j.referenceNumber || o.invoiceNumber === j.referenceNumber);
            transactions.push({
              id: `${j.id}_${l.id}`,
              date: j.date,
              voucherNumber: j.voucherNumber,
              voucherType: j.voucherType,
              invoiceNumber: order?.invoiceNumber || j.referenceNumber || '-',
              particulars: l.narration || j.narration,
              debit: l.debit,
              credit: l.credit,
              runningBalance: Math.round(runningBalance * 100) / 100,
              referenceNumber: j.referenceNumber
            });
          }
        }
      }
    }

    return {
      retailer: ret,
      summary: {
        retailerId: ret.id,
        retailerShopName: ret.shopName,
        ownerName: ret.ownerName,
        phone: ret.phone,
        gstin: ret.gstin || '',
        openingBalance: ret.openingBalance || 0,
        totalInvoiced,
        totalCollected,
        closingBalance: Math.max(0, runningBalance),
        creditLimit: ret.creditLimit
      },
      transactions
    };
  }

  // --- BANK AND CASH BOOK: DATE-WISE CLOSING BALANCES ---
  public getBankCashBook(accountId: string, fromDate?: string, toDate?: string): BankCashBookSummary {
    const accounts = this.getAccounts();
    const acc = accounts.find(a => a.id === accountId) || accounts[0];
    const journals = this.getJournalEntries();
    const bankStatements = this.getBankStatements();

    const start = fromDate || '2026-04-01';
    const end = toDate || new Date().toISOString().split('T')[0];

    // 1. Calculate opening balance as of fromDate:
    // Base opening balance from Chart of Accounts + net movements before fromDate
    let openingBalance = acc.openingBalance;
    for (const j of journals) {
      if (j.date < start) {
        for (const l of j.lines) {
          if (l.accountId === acc.id) {
            openingBalance += (l.debit - l.credit);
          }
        }
      }
    }

    // 2. Process transactions within [fromDate, toDate]
    let totalReceipts = 0;
    let totalPayments = 0;
    let netTransfers = 0;
    let runningBalance = openingBalance;
    const transactions: BankCashBookTransaction[] = [];

    // Sort journals ascending by date
    const sortedJournals = [...journals].sort((a, b) => a.date.localeCompare(b.date));

    for (const j of sortedJournals) {
      if (j.date >= start && j.date <= end) {
        for (const l of j.lines) {
          if (l.accountId === acc.id) {
            const isDebit = l.debit > 0;
            const isCredit = l.credit > 0;
            const amount = isDebit ? l.debit : l.credit;

            // Check if contra transfer with another bank/cash account
            const otherLine = j.lines.find(other => other.id !== l.id);
            const otherAccId = otherLine?.accountId || '';
            const isContra = otherAccId.startsWith('acc_cash') || otherAccId.startsWith('acc_bank');

            let txType: BankCashBookTransaction['type'] = 'RECEIPT';
            if (isContra) {
              txType = 'CONTRA';
              if (isDebit) netTransfers += amount;
              if (isCredit) netTransfers -= amount;
            } else if (isDebit) {
              txType = 'RECEIPT';
              totalReceipts += amount;
            } else if (isCredit) {
              txType = 'PAYMENT';
              totalPayments += amount;
            }

            if (isDebit) runningBalance += amount;
            if (isCredit) runningBalance -= amount;

            transactions.push({
              id: `${j.id}_${l.id}`,
              date: j.date,
              voucherNumber: j.voucherNumber,
              voucherType: j.voucherType,
              particulars: l.narration || j.narration,
              counterparty: otherLine?.accountName || 'Counterparty',
              amount,
              type: txType,
              paymentMethod: j.narration.includes('UPI') ? 'UPI' : j.narration.includes('Cash') ? 'CASH' : 'NEFT / RTGS',
              bankReference: j.referenceNumber || (j.narration.includes('Ref/UTR:') ? j.narration.split('Ref/UTR: ')[1].split(')')[0] : undefined),
              runningBalance: Math.round(runningBalance * 100) / 100,
              status: j.isPosted ? 'POSTED' : 'PENDING'
            });
          }
        }
      }
    }

    const closingBookBalance = Math.round(runningBalance * 100) / 100;

    // Check bank statement balance if bank account
    const matchedStatement = bankStatements.find(s => s.bankAccountId === (acc.id === 'acc_bank_tmb' ? 'bank_tmb_01' : 'bank_sbi_01'));
    const bankStatementBalance = matchedStatement ? matchedStatement.closingBalance : undefined;

    return {
      accountId: acc.id,
      accountName: acc.name,
      accountCode: acc.code,
      accountType: acc.subGroup === 'CASH_IN_HAND' ? 'CASH' : 'BANK',
      fromDate: start,
      toDate: end,
      openingBalance: Math.round(openingBalance * 100) / 100,
      totalReceipts: Math.round(totalReceipts * 100) / 100,
      totalPayments: Math.round(totalPayments * 100) / 100,
      netTransfers: Math.round(netTransfers * 100) / 100,
      closingBookBalance,
      bankStatementBalance,
      reconciledBalance: closingBookBalance,
      transactions
    };
  }

  // --- REPAIRED GLOBAL SEARCH ---
  public searchGlobal(query: string, userRole: UserRole, retailerId?: string): GlobalSearchResult[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    const results: GlobalSearchResult[] = [];

    // 1. Products
    const products = this.getProducts().filter(p => !p.isArchived);
    for (const p of products) {
      if (
        p.name.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      ) {
        results.push({
          category: 'PRODUCT',
          id: p.id,
          title: p.name,
          subtitle: `${p.sku} • ₹${p.sellingPriceWholesale} • ${p.availableStock} in stock`,
          badge: p.category,
          targetTab: userRole === 'retailer' ? 'retailer_catalog' : 'products',
          targetId: p.id
        });
      }
    }

    // 2. Retailers (Admin, Operations, Sales Rep)
    if (userRole !== 'retailer') {
      const retailers = this.getRetailers();
      for (const r of retailers) {
        if (
          r.shopName.toLowerCase().includes(q) ||
          r.ownerName.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.area.toLowerCase().includes(q) ||
          (r.gstin && r.gstin.toLowerCase().includes(q))
        ) {
          results.push({
            category: 'RETAILER',
            id: r.id,
            title: r.shopName,
            subtitle: `${r.ownerName} • ${r.area} • Ph: ${r.phone}`,
            badge: `Bal: ₹${r.currentOutstanding}`,
            targetTab: 'users',
            targetId: r.id
          });
        }
      }
    }

    // 3. Suppliers (Admin & Operations)
    if (userRole === 'admin' || userRole === 'distributor') {
      const suppliers = this.getSuppliers();
      for (const s of suppliers) {
        if (
          s.name.toLowerCase().includes(q) ||
          (s.supplierCode && s.supplierCode.toLowerCase().includes(q)) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          (s.gstin && s.gstin.toLowerCase().includes(q))
        ) {
          results.push({
            category: 'SUPPLIER',
            id: s.id,
            title: s.name,
            subtitle: `${s.supplierCode || s.id} • ${s.contactPerson} • ${s.city}`,
            badge: `Payable: ₹${s.currentOutstandingBalance}`,
            targetTab: 'purchases',
            targetId: s.id
          });
        }
      }
    }

    // 4. Sales Orders
    const orders = this.getOrders();
    for (const o of orders) {
      if (userRole === 'retailer' && o.retailerId !== retailerId) continue;
      if (
        o.orderNumber.toLowerCase().includes(q) ||
        o.retailerShopName.toLowerCase().includes(q) ||
        (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(q)) ||
        o.area.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'ORDER',
          id: o.id,
          title: `Order ${o.orderNumber}`,
          subtitle: `${o.retailerShopName} • ₹${o.grandTotal} • ${o.items.length} items`,
          badge: o.currentStage.replace(/_/g, ' '),
          targetTab: userRole === 'retailer' ? 'order_history' : 'orders',
          targetId: o.id
        });
      }
    }

    // 5. Invoices
    const invoices = this.getInvoices();
    for (const inv of invoices) {
      if (userRole === 'retailer' && inv.retailerId !== retailerId) continue;
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.retailerShopName.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'INVOICE',
          id: inv.id,
          title: `Tax Invoice ${inv.invoiceNumber}`,
          subtitle: `${inv.retailerShopName} • ₹${inv.totalInvoiceAmount} (Due: ₹${inv.amountDue})`,
          badge: inv.paymentStatus,
          targetTab: userRole === 'retailer' ? 'order_history' : 'orders',
          targetId: inv.orderId
        });
      }
    }

    // 6. Purchase Orders / GRNs (Admin & Operations)
    if (userRole === 'admin' || userRole === 'distributor') {
      const grns = this.getGoodsReceiptNotes();
      for (const g of grns) {
        if (
          g.grnNumber.toLowerCase().includes(q) ||
          g.supplierInvoiceNumber.toLowerCase().includes(q) ||
          g.supplierName.toLowerCase().includes(q)
        ) {
          results.push({
            category: 'PURCHASE',
            id: g.id,
            title: `GRN ${g.grnNumber}`,
            subtitle: `${g.supplierName} • Inv #${g.supplierInvoiceNumber} • ₹${g.grandTotal}`,
            badge: 'Stock Inward',
            targetTab: 'purchases',
            targetId: g.id
          });
        }
      }
    }

    return results.slice(0, 15);
  }

  public logAudit(actor: UserProfile, action: string, module: AuditLog['module'], entityId: string, entityName: string, details: string) {
    const logs = this.getAuditLogs();
    const entry: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      action,
      module,
      entityId,
      entityName,
      details
    };
    logs.unshift(entry);
    // Keep max 1000 logs
    if (logs.length > 1000) logs.pop();
    this.setItem(this.K_AUDIT_LOGS, logs);
  }
}

export const dataService = new EnterpriseDataService();
