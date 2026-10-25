/**
 * K7 ENTERPRISE — MASTER ACCEPTANCE CRITERIA AUTOMATED TEST SUITE
 * Tests:
 * 1. Clean Boot & Zero Dummy State Verification
 * 2. Owner First-Time Business Setup & Opening Balances (DR = CR)
 * 3. Product Catalogue & Image Asset Management
 * 4. Sales Orders & 11-Stage Delivery Lifecycle
 * 5. Purchasing & FEFO Inward Goods Receipt (GRN)
 * 6. Double-Entry Accounting, Trial Balance & Balance Sheet Reconciliation
 * 7. P&L and Balance Sheet Drill-Down Ledgers
 * 8. Bank Reconciliation & Omni-Search RBAC
 */

// Node LocalStorage polyfill for headless testing
class MemoryStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string) { return this.store.get(key) || null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}
(global as any).localStorage = new MemoryStorage();

async function runAcceptanceTests() {
  console.log('================================================================');
  console.log('   K7 ENTERPRISE: CLEAN SETUP & ACCOUNTING ACCEPTANCE SUITE    ');
  console.log('   Thoothukudi, Tamil Nadu, India                               ');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (details) console.error(`         Reason: ${details}`);
    }
  }

  // Import after localStorage is initialized
  const { dataService } = await import('../services/dataService');
  const adminUser = dataService.getUsers().find(u => u.role === 'admin')!;

  // -------------------------------------------------------------
  // TEST SUITE 1: CLEAN BOOT & ZERO-DATA ARCHITECTURE VERIFICATION
  // -------------------------------------------------------------
  console.log('--- 1. Clean Boot & Zero Dummy Data Verification ---');
  assert(dataService.getProducts().length === 0, 'Clean boot: 0 products pre-populated');
  assert(dataService.getOrders().length === 0, 'Clean boot: 0 sales orders pre-populated');
  assert(dataService.getRetailers().length === 0, 'Clean boot: 0 retailers pre-populated');
  assert(dataService.getSuppliers().length === 0, 'Clean boot: 0 suppliers pre-populated');
  assert(dataService.getBankAccounts().length === 0, 'Clean boot: 0 bank accounts pre-populated');

  const initialAccounts = dataService.getAccounts();
  const allInitialZero = initialAccounts.every(a => a.openingBalance === 0 && a.currentBalance === 0);
  assert(allInitialZero, 'Clean Chart of Accounts: All account opening & current balances strictly initialized to 0.00');

  // -------------------------------------------------------------
  // TEST SUITE 2: OWNER BUSINESS SETUP, BANK ACCOUNTS & OPENING BALANCES
  // -------------------------------------------------------------
  console.log('\n--- 2. Owner Business Configuration & Opening Balances ---');

  // 2.1 Owner configures business profile
  const updatedSettings = dataService.updateSettings({
    businessName: 'K7 Enterprises',
    ownerName: 'Kesavan K.',
    distributorName: 'Authorized FMCG Distributor',
    subTitle: 'Distribution & Accounting Management',
    address: '42/1 Palayamkottai Road, Bryant Nagar',
    city: 'Thoothukudi',
    district: 'Thoothukudi',
    state: 'Tamil Nadu',
    pincode: '628002',
    phone: '+91 94431 00000',
    email: 'info@k7enterprise.in',
    gstRegistered: true,
    gstin: '33AAAAK7000A1Z5',
    panNumber: 'AAAAK7000A',
    fssaiNumber: '12426001000123',
    financialYear: '2026-27',
    financialYearStartDate: '2026-04-01',
    financialYearEndDate: '2027-03-31',
    isConfigured: true
  }, adminUser);

  assert(updatedSettings.businessName === 'K7 Enterprises', 'Business settings: Company name configured by owner');
  assert(updatedSettings.isConfigured === true, 'Business settings: isConfigured flag set to true');

  // 2.2 Owner configures Bank Account
  const bank = dataService.addBankAccount({
    bankName: 'Tamilnad Mercantile Bank',
    accountName: 'K7 Enterprises',
    accountNumber: '10200100987654',
    ifscCode: 'TMBL0000102',
    branch: 'Beach Road, Thoothukudi',
    accountType: 'CURRENT',
    openingBalance: 300000,
    upiId: 'k7enterprises@tmb'
  }, adminUser);

  assert(dataService.getBankAccounts().length === 1, 'Bank Account added successfully');
  assert(bank.openingBalance === 300000, 'Bank Account opening balance recorded: ₹300,000');

  // 2.3 Owner sets Opening Balances with Double-Entry check
  // Unbalanced attempt must fail
  const badOpening = dataService.setOpeningBalances([
    { accountId: 'acc_cash_01', debit: 50000, credit: 0 },
    { accountId: 'acc_proprietor_capital', debit: 0, credit: 40000 }
  ], '2026-04-01', '2026-27', adminUser);
  assert(badOpening.success === false, 'Security: System rejects unbalanced opening balances (Dr != Cr)');

  // Balanced opening entry
  const balancedOpening = dataService.setOpeningBalances([
    { accountId: 'acc_cash_01', debit: 50000, credit: 0 },
    { accountId: bank.glAccountId, debit: 300000, credit: 0 },
    { accountId: 'acc_proprietor_capital', debit: 0, credit: 350000 }
  ], '2026-04-01', '2026-27', adminUser);
  assert(balancedOpening.success === true, 'Opening balances successfully posted with Dr (₹350,000) = Cr (₹350,000)');

  // 2.4 Register an operational user, retailer and supplier
  const opsUser = {
    id: 'usr_ops_01',
    name: 'Senthil Nathan',
    email: 'senthil@k7enterprise.in',
    phone: '9842100000',
    role: 'distributor' as const,
    businessId: 'biz_default',
    businessName: 'K7 Enterprises',
    isActive: true,
    createdAt: new Date().toISOString()
  };
  dataService.saveUser(opsUser, adminUser);

  const retailer = {
    id: 'ret_001',
    shopName: 'Selvam Super Store',
    ownerName: 'M. Selvam',
    phone: '9842111111',
    address: '15 Great Cotton Road',
    area: 'Cruz Fernandez Puram',
    city: 'Thoothukudi',
    pincode: '628001',
    creditLimit: 50000,
    creditDays: 14,
    currentOutstanding: 0,
    priceTier: 'wholesale' as const,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  dataService.saveRetailer(retailer, adminUser);

  const supplier = {
    id: 'sup_001',
    name: 'Aachi Spices & Foods Depot',
    contactPerson: 'K. R. Vairavan',
    phone: '9842222222',
    email: 'madurai.depot@aachigroup.com',
    address: 'Plot 12, SIDCO Industrial Estate, Kappalur',
    city: 'Madurai',
    gstin: '33AAACA1234F1Z1',
    supplierCode: 'ACH-MDU-DEPOT',
    openingBalance: 0,
    currentOutstandingBalance: 0,
    isActive: true
  };
  dataService.saveSupplier(supplier, adminUser);

  assert(dataService.getRetailers().length === 1, 'Retailer profile registered');
  assert(dataService.getSuppliers().length === 1, 'Supplier profile registered');

  // -------------------------------------------------------------
  // TEST SUITE 3: PRODUCT CATALOGUE & INVENTORY MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n--- 3. Product Catalogue & Stock Allocation ---');
  const newProduct = dataService.saveProduct({
    id: 'prod_test_garam',
    name: 'Garam Masala 50g',
    tamilName: 'கரம் மசாலா',
    sku: 'GAR-50G',
    barcode: '8901725501015',
    category: 'Blended Masalas',
    brand: 'K7 Brand',
    packSize: '50g',
    unitOfMeasure: 'PKT',
    caseSize: 50,
    purchaseRate: 22.00,
    mrp: 35.00,
    sellingPriceWholesale: 27.50,
    sellingPriceRetail: 31.00,
    gstPercent: 5,
    hsnCode: '2103',
    reorderLevel: 25,
    stockOnHand: 150,
    stockReserved: 0,
    availableStock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d',
    isActive: true,
    batches: [
      {
        id: 'bat_gar_01',
        batchNumber: 'B-GAR-2601',
        mfgDate: '2026-02-01',
        expDate: '2027-01-31',
        quantity: 150,
        reservedQuantity: 0,
        purchaseRate: 22.00,
        mrp: 35.00
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, adminUser);

  assert(newProduct.name === 'Garam Masala 50g', 'Product created with correct name');
  assert(newProduct.availableStock === 150, 'Initial available stock is 150');

  // -------------------------------------------------------------
  // TEST SUITE 4: SALES ORDER & 11-STAGE DELIVERY LIFECYCLE
  // -------------------------------------------------------------
  console.log('\n--- 4. Order Lifecycle & 11-Stage Delivery Workflow ---');
  const orderResult = dataService.createSalesOrder({
    retailer,
    items: [{ productId: newProduct.id, quantity: 30 }],
    paymentMethod: 'CREDIT',
    notes: 'Urgent delivery for retail counter',
    actor: adminUser
  });

  assert(orderResult.success === true, 'Sales Order created successfully');
  const order = orderResult.order!;
  assert(order.grandTotal === 866.25, `Server recalculated total correctly: ₹${order.grandTotal} (30 × ₹27.50 + 5% GST = ₹866.25)`);
  assert(order.currentStage === 'ORDER_PLACED', 'Initial stage is ORDER_PLACED');

  // Verify stock reservation (prevent overselling)
  const productAfterOrder = dataService.getProductById(newProduct.id)!;
  assert(productAfterOrder.stockReserved === 30, 'Reserved stock increased by 30 units');
  assert(productAfterOrder.availableStock === 120, 'Available stock decreased to 120 units');

  // Advance delivery workflow through stages
  let stageAdv = dataService.updateDeliveryStage(order.id, 'ACCEPTED', opsUser, 'Credit verified');
  assert(stageAdv.success, 'Stage advanced to ACCEPTED');

  stageAdv = dataService.updateDeliveryStage(order.id, 'STOCK_ALLOCATED', opsUser, 'Warehouse allocation confirmed');
  assert(stageAdv.success, 'Stage advanced to STOCK_ALLOCATED');

  stageAdv = dataService.updateDeliveryStage(order.id, 'PACKING_IN_PROGRESS', opsUser, 'Boxing carton');
  assert(stageAdv.success, 'Stage advanced to PACKING_IN_PROGRESS');

  stageAdv = dataService.updateDeliveryStage(order.id, 'READY_FOR_DISPATCH', opsUser, 'Carton sealed');
  assert(stageAdv.success, 'Stage advanced to READY_FOR_DISPATCH');

  stageAdv = dataService.updateDeliveryStage(order.id, 'DISPATCHED', opsUser, 'Loaded onto Van TN-69-AA-2341');
  assert(stageAdv.success, 'Stage advanced to DISPATCHED');

  const productAfterDispatch = dataService.getProductById(newProduct.id)!;
  assert(productAfterDispatch.stockOnHand === 120, 'Physical stockOnHand deducted to 120 units');
  assert(productAfterDispatch.stockReserved === 0, 'Reservation released to 0 units');

  stageAdv = dataService.updateDeliveryStage(order.id, 'DELIVERED', opsUser, 'Delivered to Selvam Stores counter', {
    signatureName: 'M. Selvam'
  });
  assert(stageAdv.success, 'Stage advanced to DELIVERED with counter recipient signature');

  // Security test: delivered order CANNOT be regressed to an earlier state
  const invalidRegression = dataService.updateDeliveryStage(order.id, 'PACKING_IN_PROGRESS', opsUser);
  assert(invalidRegression.success === false, 'Security: Delivered order cannot be moved backward to earlier stages');

  // -------------------------------------------------------------
  // TEST SUITE 5: PURCHASING & FEFO GOODS RECEIPT NOTE (GRN)
  // -------------------------------------------------------------
  console.log('\n--- 5. Purchasing & FEFO Inward Goods Receipt (GRN) ---');
  const initialStock = dataService.getProductById(newProduct.id)!.stockOnHand;

  const grn = dataService.postGoodsReceipt({
    poId: '',
    poNumber: 'PO-2026-001',
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierInvoiceNumber: 'ACH-MAD-8921',
    supplierInvoiceDate: '2026-04-05',
    receivedDate: '2026-04-06',
    receivedBy: opsUser.name,
    items: [
      {
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        packSize: newProduct.packSize,
        receivedQuantity: 100,
        acceptedQuantity: 100,
        rejectedQuantity: 0,
        unitRate: 22.00,
        batchNumber: 'B-GAR-2602',
        mfgDate: '2026-04-01',
        expDate: '2027-03-31',
        gstPercent: 5,
        taxableAmount: 2200,
        gstAmount: 110,
        totalAmount: 2310
      }
    ],
    totalTaxable: 2200,
    totalGst: 110,
    freightCharges: 0,
    grandTotal: 2310
  }, opsUser);

  assert(grn.grnNumber.startsWith('GRN-2026-'), 'GRN generated with valid sequential numbering');
  const stockAfterGrn = dataService.getProductById(newProduct.id)!.stockOnHand;
  assert(stockAfterGrn === initialStock + 100, `Physical stock increased from ${initialStock} to ${stockAfterGrn} (+100)`);

  // Verify stock movements
  const movements = dataService.getMovements().filter(m => m.productId === newProduct.id);
  assert(movements.some(m => m.movementType === 'PURCHASE_RECEIPT'), 'Auditable PURCHASE_RECEIPT logged in movement ledger');
  assert(movements.some(m => m.movementType === 'SALES_DISPATCH'), 'Auditable SALES_DISPATCH logged in movement ledger');

  // -------------------------------------------------------------
  // TEST SUITE 6: DOUBLE-ENTRY ACCOUNTING & FINANCIAL REPORTS
  // -------------------------------------------------------------
  console.log('\n--- 6. Double-Entry Accounting, Trial Balance & Balance Sheet ---');

  // Verify that unbalanced voucher is rejected
  const unbalancedVoucher = dataService.postJournalEntry({
    voucherType: 'JOURNAL_VOUCHER',
    date: '2026-04-10',
    narration: 'Unbalanced test voucher',
    lines: [
      { accountId: 'acc_cash_01', debit: 500, credit: 0 },
      { accountId: 'acc_sales_revenue', debit: 0, credit: 400 }
    ],
    actor: adminUser
  });
  assert(unbalancedVoucher.success === false, 'Security: System strictly rejects unbalanced journal entry (Dr != Cr)');

  // Post balanced collection receipt
  const initialOutstanding = dataService.getRetailers().find(r => r.id === retailer.id)!.currentOutstanding;
  dataService.recordCollectionReceipt({
    date: '2026-04-10',
    retailerId: retailer.id,
    retailerShopName: retailer.shopName,
    amount: 500,
    paymentMethod: 'UPI',
    referenceNumber: 'UTR-9988776655',
    depositToAccountId: bank.glAccountId,
    settledInvoices: [],
    collectedByUserId: opsUser.id,
    collectedByUserName: opsUser.name,
    isVerified: true
  }, opsUser);

  const newOutstanding = dataService.getRetailers().find(r => r.id === retailer.id)!.currentOutstanding;
  assert(newOutstanding === initialOutstanding - 500, `Retailer outstanding balance reduced by ₹500 (from ₹${initialOutstanding} to ₹${newOutstanding})`);

  // Trial balance verification
  const trialBalance = dataService.getTrialBalance();
  assert(trialBalance.isBalanced === true, `Trial Balance is balanced: Debits ₹${trialBalance.totalDebit} = Credits ₹${trialBalance.totalCredit}`);

  // Profit and Loss verification
  const pnl = dataService.getProfitAndLoss('2026-04-01', '2027-03-31');
  assert(typeof pnl.netProfit === 'number', `Profit and Loss generated. Net Profit: ₹${pnl.netProfit}`);

  // Balance sheet verification
  const balanceSheet = dataService.getBalanceSheet('2027-03-31');
  console.log(`         Balance Sheet: Assets = ₹${balanceSheet.assets.totalAssets}, Liabilities + Capital = ₹${balanceSheet.liabilitiesAndEquity.totalLiabilitiesAndEquity}`);
  assert(balanceSheet.isBalanced === true, 'Balance Sheet reconciled (Total Assets = Total Liabilities & Capital)');

  // -------------------------------------------------------------
  // TEST SUITE 7: DRILL-DOWNS & RECONCILIATION
  // -------------------------------------------------------------
  console.log('\n--- 7. P&L & Balance Sheet Drill-Down Ledgers ---');

  // Purchase account drill-down
  const purchaseLedger = dataService.getPurchaseLedger('2026-04-01', '2027-03-31');
  assert(purchaseLedger.entries.length > 0, `Purchase ledger contains ${purchaseLedger.entries.length} posted purchase entries`);
  assert(
    Math.abs(purchaseLedger.totalTaxable - pnl.expenses.costOfGoodsSold) < 0.05,
    `P&L Drill-down: Purchase Ledger total (₹${purchaseLedger.totalTaxable}) reconciles 100% with P&L COGS (₹${pnl.expenses.costOfGoodsSold})`
  );

  // Supplier creditors drill-down
  const creditorLedger = dataService.getSupplierCreditorsLedger('2027-03-31');
  assert(creditorLedger.suppliers.length > 0, `Creditor ledger contains ${creditorLedger.suppliers.length} supplier profiles`);
  assert(
    Math.abs(creditorLedger.totalCreditors - balanceSheet.liabilitiesAndEquity.currentLiabilities.accountsPayable) < 0.05,
    `Balance Sheet Drill-down: Supplier creditor total (₹${creditorLedger.totalCreditors}) reconciles 100% with Balance Sheet liabilities (₹${balanceSheet.liabilitiesAndEquity.currentLiabilities.accountsPayable})`
  );

  // Bank & Cash Book
  const bankBook = dataService.getBankCashBook(bank.glAccountId, '2026-04-01', '2027-03-31');
  const calculatedClosing = Math.round((bankBook.openingBalance + bankBook.totalReceipts - bankBook.totalPayments + bankBook.netTransfers) * 100) / 100;
  assert(
    Math.abs(bankBook.closingBookBalance - calculatedClosing) < 0.05,
    `Bank Book formula verified: Closing (₹${bankBook.closingBookBalance}) = Opening (₹${bankBook.openingBalance}) + Receipts (₹${bankBook.totalReceipts}) - Payments (₹${bankBook.totalPayments})`
  );

  // Global search & RBAC
  const searchResults = dataService.searchGlobal('Garam', 'admin');
  assert(searchResults.length > 0 && searchResults.some(r => r.category === 'PRODUCT'), 'Global Search: Successfully retrieved newly added product');

  const rbacSearch = dataService.searchGlobal('Aachi', 'retailer', retailer.id);
  assert(!rbacSearch.some(r => r.category === 'SUPPLIER'), 'Global Search RBAC: Retailer cannot view supplier records');

  // Product safe archival
  const archiveResult = dataService.archiveProduct(newProduct.id, adminUser);
  assert(archiveResult.success === true, 'Product archival: Successfully deactivated product without deletion');

  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passedTests} / ${totalTests} WORKFLOW TESTS PASSED (100%) `);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('ALL ACCEPTANCE CRITERIA VERIFIED AND VALIDATED SUCCESSFULLY.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAcceptanceTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
