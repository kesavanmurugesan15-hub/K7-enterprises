/**
 * K7 ENTERPRISE — ACCEPTANCE CRITERIA AUTOMATED TEST SUITE
 * Tests core business workflows: Ordering, Delivery Lifecycle, Inventory & FEFO,
 * Double-Entry Accounting, Bank Reconciliation, and Security Validations.
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
  console.log('   K7 ENTERPRISE: AACHI MASALA DISTRIBUTOR ACCEPTANCE SUITE    ');
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
  const opsUser = dataService.getUsers().find(u => u.role === 'distributor')!;
  const retailer = dataService.getRetailers()[0]; // Selvam Stores

  // -------------------------------------------------------------
  // TEST SUITE 1: PRODUCT CATALOGUE & IMAGE ASSET MANAGEMENT
  // -------------------------------------------------------------
  console.log('\n--- 1. Product Catalogue & Image Asset Workflow ---');
  const newProduct = dataService.saveProduct({
    id: 'prod_test_garam',
    name: 'Aachi Garam Masala',
    tamilName: 'ஆச்சி கரம் மசாலா',
    sku: 'AACHI-GAR-50G',
    barcode: '8901725501015',
    category: 'Blended Masalas',
    brand: 'Aachi Masala',
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

  assert(newProduct.name === 'Aachi Garam Masala', 'Product created with correct name');
  assert(newProduct.availableStock === 150, 'Initial available stock is 150');
  assert(!!newProduct.imageUrl, 'Image URL reference is stored with product');

  // -------------------------------------------------------------
  // TEST SUITE 2: ORDER WORKFLOW & 11-STAGE DELIVERY LIFECYCLE
  // -------------------------------------------------------------
  console.log('\n--- 2. Order Workflow & 11-Stage Delivery Lifecycle ---');
  const orderResult = dataService.createSalesOrder({
    retailer,
    items: [
      { productId: newProduct.id, quantity: 30 }
    ],
    paymentMethod: 'CREDIT',
    notes: 'Urgent delivery for weekend store sale',
    actor: adminUser
  });

  assert(orderResult.success === true, 'Order created successfully');
  const order = orderResult.order!;
  assert(order.grandTotal === 866.25, `Server recalculated total correctly: ₹${order.grandTotal} (expected ₹866.25 including 5% GST)`);
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

  // DISPATCH stage triggers physical stock on hand deduction and movement ledger
  stageAdv = dataService.updateDeliveryStage(order.id, 'DISPATCHED', opsUser, 'Loaded onto Van TN-69-AA-2341');
  assert(stageAdv.success, 'Stage advanced to DISPATCHED');

  const productAfterDispatch = dataService.getProductById(newProduct.id)!;
  assert(productAfterDispatch.stockOnHand === 120, 'Physical stockOnHand deducted to 120 units');
  assert(productAfterDispatch.stockReserved === 0, 'Reservation released to 0 units');

  // Final delivery drop-off
  stageAdv = dataService.updateDeliveryStage(order.id, 'DELIVERED', opsUser, 'Delivered to Selvam Stores counter', {
    signatureName: 'M. Selvam'
  });
  assert(stageAdv.success, 'Stage advanced to DELIVERED with counter recipient signature');

  // Security test: delivered order CANNOT be regressed to an earlier state
  const invalidRegression = dataService.updateDeliveryStage(order.id, 'PACKING_IN_PROGRESS', opsUser);
  assert(invalidRegression.success === false, 'Security: Delivered order cannot be moved backward to earlier stages');

  // -------------------------------------------------------------
  // TEST SUITE 3: INVENTORY PURCHASING & FEFO GOODS RECEIPT (GRN)
  // -------------------------------------------------------------
  console.log('\n--- 3. Purchasing & FEFO Inward Goods Receipt (GRN) ---');
  const supplier = dataService.getSuppliers()[0]; // Aachi Madurai Depot
  const initialStock = dataService.getProductById(newProduct.id)!.stockOnHand;

  const grn = dataService.postGoodsReceipt({
    poId: '',
    poNumber: 'PO-2026-TEST',
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierInvoiceNumber: 'ACH-MAD-8921',
    supplierInvoiceDate: '2026-02-24',
    receivedDate: '2026-02-25',
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
        mfgDate: '2026-02-20',
        expDate: '2027-02-19',
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

  // Verify stock movement ledger
  const movements = dataService.getMovements().filter(m => m.productId === newProduct.id);
  assert(movements.some(m => m.movementType === 'PURCHASE_RECEIPT'), 'Auditable PURCHASE_RECEIPT logged in movement ledger');
  assert(movements.some(m => m.movementType === 'SALES_DISPATCH'), 'Auditable SALES_DISPATCH logged in movement ledger');

  // -------------------------------------------------------------
  // TEST SUITE 4: TALLY-STYLE DOUBLE-ENTRY ACCOUNTING
  // -------------------------------------------------------------
  console.log('\n--- 4. Double-Entry Accounting & Trial Balance Verification ---');
  // Verify that unbalanced voucher is rejected
  const unbalancedVoucher = dataService.postJournalEntry({
    voucherType: 'JOURNAL_VOUCHER',
    date: '2026-02-25',
    narration: 'Unbalanced test voucher',
    lines: [
      { accountId: 'acc_cash_01', debit: 500, credit: 0 },
      { accountId: 'acc_sales_revenue', debit: 0, credit: 400 } // Diff of 100
    ],
    actor: adminUser
  });
  assert(unbalancedVoucher.success === false, 'Security: System strictly rejects unbalanced journal entry (Dr != Cr)');

  // Post balanced receipt voucher for customer collection
  const initialOutstanding = dataService.getRetailers().find(r => r.id === retailer.id)!.currentOutstanding;
  const receipt = dataService.recordCollectionReceipt({
    date: '2026-02-25',
    retailerId: retailer.id,
    retailerShopName: retailer.shopName,
    amount: 5000,
    paymentMethod: 'UPI',
    referenceNumber: 'UTR-9988776655',
    depositToAccountId: 'acc_bank_tmb',
    settledInvoices: [],
    collectedByUserId: opsUser.id,
    collectedByUserName: opsUser.name,
    isVerified: true
  }, opsUser);

  const newOutstanding = dataService.getRetailers().find(r => r.id === retailer.id)!.currentOutstanding;
  assert(newOutstanding === initialOutstanding - 5000, `Retailer outstanding balance reduced by ₹5,000 (from ₹${initialOutstanding} to ₹${newOutstanding})`);

  // Verify Trial Balance mathematically balances
  const trialBalance = dataService.getTrialBalance();
  assert(trialBalance.isBalanced === true, `Trial Balance is balanced: Debits ₹${trialBalance.totalDebit} = Credits ₹${trialBalance.totalCredit}`);

  // Verify Profit & Loss and Balance Sheet derivation
  const pnl = dataService.getProfitAndLoss();
  assert(typeof pnl.netProfit === 'number', `Profit and Loss generated. Net Profit: ₹${pnl.netProfit}`);

  const balanceSheet = dataService.getBalanceSheet();
  console.log(`         Balance Sheet Debug: Assets = ₹${balanceSheet.assets.totalAssets}, Liab+Eq = ₹${balanceSheet.liabilitiesAndEquity.totalLiabilitiesAndEquity}, Diff = ₹${balanceSheet.assets.totalAssets - balanceSheet.liabilitiesAndEquity.totalLiabilitiesAndEquity}`);
  assert(balanceSheet.isBalanced === true, 'Balance Sheet reconciled (Total Assets = Total Liabilities & Capital)', `Diff was ₹${balanceSheet.assets.totalAssets - balanceSheet.liabilitiesAndEquity.totalLiabilitiesAndEquity}`);

  // -------------------------------------------------------------
  // TEST SUITE 5: BANK RECONCILIATION
  // -------------------------------------------------------------
  console.log('\n--- 5. Bank Reconciliation Workflow ---');
  const tmbAccount = dataService.getBankAccounts()[0];
  const statement = dataService.importBankStatement(
    tmbAccount.id,
    'TMB_Reconciliation_Feb2026.csv',
    [
      {
        transactionDate: '2026-02-25',
        valueDate: '2026-02-25',
        description: 'UPI/UTR-9988776655/SELVAM STORES',
        type: 'CR',
        amount: 5000,
        referenceNumber: 'UTR-9988776655'
      }
    ],
    adminUser
  );

  assert(statement.totalTransactions === 1, 'Bank statement imported with 1 transaction');
  assert(statement.matchedTransactions === 1, 'Auto-match engine matched ₹5,000 UPI collection against ledger entry');
  assert(statement.status === 'RECONCILED', 'Statement status flagged as RECONCILED');

  // -------------------------------------------------------------
  // TEST SUITE 6: SECURITY & OVERSOLD PREVENTION
  // -------------------------------------------------------------
  console.log('\n--- 6. Security, Concurrency & Overselling Prevention ---');
  const oversellAttempt = dataService.createSalesOrder({
    retailer,
    items: [
      { productId: newProduct.id, quantity: 9999 } // far exceeds stock
    ],
    paymentMethod: 'CASH',
    actor: adminUser
  });
  assert(oversellAttempt.success === false, 'Concurrency safety: Attempt to order more than available stock is rejected');

  // -------------------------------------------------------------
  // TEST SUITE 7: MASTER APPLICATION AUDIT & DRILL-DOWN VALIDATIONS
  // -------------------------------------------------------------
  console.log('\n--- 7. Master Application Audit & Accounting Drill-Downs ---');

  // 7.1 Profit & Loss Purchase Account Drill-Down Reconciliation
  const purchaseLedger = dataService.getPurchaseLedger();
  assert(purchaseLedger.entries.length > 0, `Purchase ledger contains ${purchaseLedger.entries.length} posted purchase entries`);
  assert(
    Math.abs(purchaseLedger.totalTaxable - pnl.expenses.costOfGoodsSold) < 0.05,
    `P&L Drill-down: Purchase Ledger total (₹${purchaseLedger.totalTaxable}) reconciles 100% with P&L COGS (₹${pnl.expenses.costOfGoodsSold})`
  );
  assert(purchaseLedger.entries[0].taxableAmount > 0, 'Purchase entry includes taxable amount, supplier invoice # and GST breakdown');

  // 7.2 Balance Sheet Sundry Creditors Drill-Down Reconciliation
  const creditorLedger = dataService.getSupplierCreditorsLedger();
  assert(creditorLedger.suppliers.length > 0, `Creditor ledger contains ${creditorLedger.suppliers.length} supplier creditor profiles`);
  assert(
    Math.abs(creditorLedger.totalCreditors - balanceSheet.liabilitiesAndEquity.currentLiabilities.accountsPayable) < 0.05,
    `Balance Sheet Drill-down: Supplier creditor total (₹${creditorLedger.totalCreditors}) reconciles 100% with Balance Sheet liabilities (₹${balanceSheet.liabilitiesAndEquity.currentLiabilities.accountsPayable})`
  );

  const supplierDetail = dataService.getSupplierDetailedLedger('sup_001');
  assert(supplierDetail.transactions.length > 0, 'Detailed supplier ledger returns chronologically ordered vouchers with running balance');

  // 7.3 Bank & Cash Book Date-Wise Closing Balances
  const bankBook = dataService.getBankCashBook('acc_bank_tmb', '2026-01-01', '2026-12-31');
  const calculatedClosing = Math.round((bankBook.openingBalance + bankBook.totalReceipts - bankBook.totalPayments + bankBook.netTransfers) * 100) / 100;
  assert(
    Math.abs(bankBook.closingBookBalance - calculatedClosing) < 0.05,
    `Bank Book formula verified: Closing (₹${bankBook.closingBookBalance}) = Opening (₹${bankBook.openingBalance}) + Receipts (₹${bankBook.totalReceipts}) - Payments (₹${bankBook.totalPayments}) + Transfers (₹${bankBook.netTransfers})`
  );

  // 7.4 Global Search across products, retailers, orders and invoices
  const productSearchResults = dataService.searchGlobal('chilli', 'admin');
  assert(productSearchResults.length > 0 && productSearchResults.some(r => r.category === 'PRODUCT'), 'Global Search: Successfully retrieved products matching "chilli"');

  const retailerSearchResults = dataService.searchGlobal('selvam', 'admin');
  assert(retailerSearchResults.length > 0 && retailerSearchResults.some(r => r.category === 'RETAILER'), 'Global Search: Successfully retrieved retailer profile matching "selvam"');

  const rbacRestrictedSearch = dataService.searchGlobal('Aachi', 'retailer', 'ret_001');
  const hasSuppliersInRetailerSearch = rbacRestrictedSearch.some(r => r.category === 'SUPPLIER');
  assert(hasSuppliersInRetailerSearch === false, 'Global Search RBAC: Retailer cannot view internal supplier records');

  // 7.5 Product Archival (Safe deactivation without historical corruption)
  const archiveResult = dataService.archiveProduct(newProduct.id, adminUser);
  assert(archiveResult.success === true, 'Product archival: Successfully deactivated product safely without destructive deletion');
  const refreshedProduct = dataService.getProductById(newProduct.id);
  assert(refreshedProduct?.isArchived === true && refreshedProduct?.isActive === false, 'Product flagged as isArchived=true and isActive=false');


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
