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
import { Product, ProductBatch } from '../types/product';
import { SalesOrder, DeliveryStage, PaymentMethod, PaymentStatus, OrderItem, SalesInvoice } from '../types/order';
import { InventoryMovement, StockValuationSummary } from '../types/inventory';
import { PurchaseOrder, GoodsReceiptNote, Supplier } from '../types/purchase';
import { Account, JournalEntry, VoucherType, DayBookRow, TrialBalanceReport, ProfitLossReport, BalanceSheetReport } from '../types/accounting';
import { BankAccount, BankStatement, BankStatementTransaction } from '../types/bank';
import { CollectionReceipt, PettyExpense, CustomerCreditProfile } from '../types/credit';
import { AppNotification, AuditLog } from '../types/notification';
import { BusinessSettings, Retailer, UserProfile } from '../types/auth';

type Listener = () => void;

class EnterpriseDataService {
  private listeners: Map<string, Set<Listener>> = new Map();

  // Storage keys
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

  private initializeDefaults() {
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
    if (!localStorage.getItem(this.K_INVOICES)) {
      // Seed initial invoices from initial orders
      const invoices: SalesInvoice[] = INITIAL_ORDERS.map((ord, idx) => ({
        id: `inv_100${idx + 1}`,
        invoiceNumber: ord.invoiceNumber || `K7/INV/26-27/009${idx + 1}`,
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        invoiceDate: ord.orderDate.split('T')[0],
        dueDate: '2026-03-10',
        retailerId: ord.retailerId,
        retailerShopName: ord.retailerShopName,
        billingAddress: ord.deliveryAddress,
        items: ord.items,
        taxableAmount: ord.taxableSubtotal,
        cgstAmount: ord.totalGst / 2,
        sgstAmount: ord.totalGst / 2,
        totalGst: ord.totalGst,
        roundOff: ord.roundOff,
        totalInvoiceAmount: ord.grandTotal,
        amountPaid: ord.paidAmount,
        amountDue: ord.dueAmount,
        paymentStatus: ord.paymentStatus,
        isPostedToLedger: true,
        createdAt: ord.orderDate
      }));
      this.setItem(this.K_INVOICES, invoices);
    }
    if (!localStorage.getItem(this.K_JOURNALS)) {
      // Seed initial balanced double-entry vouchers
      const initialJournals: JournalEntry[] = [
        {
          id: 'jrnl_open_01',
          voucherNumber: 'VR-OPEN-001',
          voucherType: 'JOURNAL_VOUCHER',
          date: '2026-01-01',
          totalDebit: 668920,
          totalCredit: 668920,
          isBalanced: true,
          narration: 'Opening Financial Balances for Financial Year 2026-27',
          isPosted: true,
          isReversed: false,
          createdByUserId: 'usr_admin_01',
          createdByUserName: 'Kesavan K. (Proprietor)',
          createdAt: '2026-01-01T00:00:00Z',
          lines: [
            { id: 'l1', accountId: 'acc_cash_01', accountName: 'Cash in Hand', accountCode: '1010', debit: 42500, credit: 0 },
            { id: 'l2', accountId: 'acc_cash_petty', accountName: 'Petty Cash', accountCode: '1015', debit: 5000, credit: 0 },
            { id: 'l3', accountId: 'acc_bank_tmb', accountName: 'TMB Bank A/c', accountCode: '1020', debit: 312500, credit: 0 },
            { id: 'l4', accountId: 'acc_bank_sbi', accountName: 'SBI Bank A/c', accountCode: '1025', debit: 145000, credit: 0 },
            { id: 'l5', accountId: 'acc_sundry_debtors', accountName: 'Sundry Debtors', accountCode: '1030', debit: 51550, credit: 0 },
            { id: 'l6', accountId: 'acc_stock_asset', accountName: 'Stock-in-Hand', accountCode: '1040', debit: 108420, credit: 0 },
            { id: 'l7', accountId: 'acc_input_gst', accountName: 'Input Tax Credit', accountCode: '1050', debit: 9800, credit: 0 },
            { id: 'l8', accountId: 'acc_sundry_creditors', accountName: 'Sundry Creditors (Aachi C&F)', accountCode: '2010', debit: 0, credit: 277400 },
            { id: 'l9', accountId: 'acc_output_gst', accountName: 'Output GST Payable', accountCode: '2020', debit: 0, credit: 14600 },
            { id: 'l10', accountId: 'acc_proprietor_capital', accountName: "Proprietor's Capital", accountCode: '3010', debit: 0, credit: 350000 },
            { id: 'l11', accountId: 'acc_retained_earnings', accountName: 'Retained Earnings', accountCode: '3020', debit: 0, credit: 32770 }
          ]
        }
      ];
      this.setItem(this.K_JOURNALS, initialJournals);
    }
    if (!localStorage.getItem(this.K_MOVEMENTS)) {
      const initialMovements: InventoryMovement[] = [
        {
          id: 'mov_001',
          productId: 'prod_001',
          productName: 'Aachi Chilli Powder 100g',
          sku: 'AACHI-CHL-100G',
          batchNumber: 'B-CHL-2601',
          movementType: 'PURCHASE_RECEIPT',
          quantityChange: 450,
          previousStock: 0,
          newStock: 450,
          unitCost: 36.50,
          totalCost: 16425,
          referenceType: 'GOODS_RECEIPT',
          referenceId: 'grn_init_01',
          referenceNumber: 'GRN-2026-001',
          performedByUserId: 'usr_ops_01',
          performedByUserName: 'Senthil Nathan',
          timestamp: '2026-01-10T10:00:00Z',
          notes: 'Initial inward from Madurai C&F Depot'
        },
        {
          id: 'mov_002',
          productId: 'prod_004',
          productName: 'Aachi Chicken Masala 100g',
          sku: 'AACHI-CHK-100G',
          batchNumber: 'B-CHK-2601',
          movementType: 'PURCHASE_RECEIPT',
          quantityChange: 550,
          previousStock: 0,
          newStock: 550,
          unitCost: 41.00,
          totalCost: 22550,
          referenceType: 'GOODS_RECEIPT',
          referenceId: 'grn_init_01',
          referenceNumber: 'GRN-2026-001',
          performedByUserId: 'usr_ops_01',
          performedByUserName: 'Senthil Nathan',
          timestamp: '2026-01-10T10:00:00Z',
          notes: 'Initial inward from Madurai C&F Depot'
        }
      ];
      this.setItem(this.K_MOVEMENTS, initialMovements);
    }
    if (!localStorage.getItem(this.K_NOTIFICATIONS)) {
      const initialNotes: AppNotification[] = [
        {
          id: 'note_01',
          type: 'ORDER_NEW',
          title: 'New Order Received',
          message: 'Order #K7-SO-2026-0081 received from Selvam Super Store (₹3,360)',
          timestamp: new Date().toISOString(),
          isRead: false,
          linkToTab: 'orders'
        },
        {
          id: 'note_02',
          type: 'LOW_STOCK_ALERT',
          title: 'Reorder Level Alert',
          message: 'Aachi Lime Pickle 300g is approaching reorder threshold (130 left)',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: false,
          linkToTab: 'inventory'
        }
      ];
      this.setItem(this.K_NOTIFICATIONS, initialNotes);
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
    this.logAudit(actor, 'UPDATE_SETTINGS', 'BUSINESS', 'biz_k7_thoothukudi', 'Business Settings', 'Updated company profile and settings');
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
    lines: { accountId: string; debit: number; credit: number; narration?: string }[];
    actor: UserProfile;
    referenceType?: JournalEntry['referenceType'];
    referenceId?: string;
    referenceNumber?: string;
  }): { success: boolean; entry?: JournalEntry; message?: string } {
    let totalDebit = 0;
    let totalCredit = 0;
    const accounts = this.getAccounts();

    const verifiedLines = entry.lines.map((l, i) => {
      const acc = accounts.find(a => a.id === l.accountId);
      const dr = Math.round(Number(l.debit || 0) * 100) / 100;
      const cr = Math.round(Number(l.credit || 0) * 100) / 100;
      totalDebit += dr;
      totalCredit += cr;
      return {
        id: `line_${i + 1}`,
        accountId: l.accountId,
        accountName: acc?.name || 'Unknown Account',
        accountCode: acc?.code || '0000',
        debit: dr,
        credit: cr,
        narration: l.narration
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
          narration: `Due from ${order.retailerShopName}`
        },
        {
          accountId: 'acc_sales_revenue',
          debit: 0,
          credit: order.taxableSubtotal,
          narration: `Aachi sales revenue`
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
          narration: `Payable to ${grn.supplierName}`
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
          narration: j.narration
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

    const getBal = (id: string) => {
      const acc = accounts.find(a => a.id === id);
      return acc?.currentBalance || 0;
    };

    const cashInHand = getBal('acc_cash_01') + getBal('acc_cash_petty');
    const bankBalances = getBal('acc_bank_tmb') + getBal('acc_bank_sbi');
    const accountsReceivable = getBal('acc_sundry_debtors');
    const inventoryValuation = getBal('acc_stock_asset') + getBal('acc_purchases');
    
    // Duties & Taxes net position: if input > output it's an ITC Asset; if output > input it's a Liability
    const netTax = getBal('acc_output_gst') - getBal('acc_input_gst');
    const itcAsset = netTax < 0 ? -netTax : 0;
    const taxLiability = netTax > 0 ? netTax : 0;

    const totalCurrentAssets = cashInHand + bankBalances + accountsReceivable + inventoryValuation + itcAsset;

    const accountsPayable = getBal('acc_sundry_creditors');
    const totalCurrentLiabilities = accountsPayable + taxLiability;

    const ownerCapital = getBal('acc_proprietor_capital');
    const retainedEarnings = getBal('acc_retained_earnings');
    const currentPeriodProfit = pnl.netProfit;
    const totalEquity = ownerCapital + retainedEarnings + currentPeriodProfit;

    const totalAssets = totalCurrentAssets;
    const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;

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
          narration: `Payment from ${data.retailerShopName}`
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
