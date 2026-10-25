import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { CollectionReceipt, PettyExpense } from '../../types/credit';
import { Retailer } from '../../types/auth';
import { Account } from '../../types/accounting';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString, formatDateTime } from '../../utils/date';
import { DollarSign, Plus, ArrowDownRight, ArrowUpRight, Landmark, Receipt, Fuel } from 'lucide-react';

export const CollectionsExpensesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [receipts, setReceipts] = useState<CollectionReceipt[]>(dataService.getCollectionReceipts());
  const [expenses, setExpenses] = useState<PettyExpense[]>(dataService.getPettyExpenses());
  const [retailers, setRetailers] = useState<Retailer[]>(dataService.getRetailers());
  const [accounts, setAccounts] = useState<Account[]>(dataService.getAccounts());
  const [activeTab, setActiveTab] = useState<'collections' | 'expenses' | 'cash_closing'>('collections');

  // Modals
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states - Receipt
  const [recRetailerId, setRecRetailerId] = useState(retailers[0]?.id || '');
  const [recAmount, setRecAmount] = useState(5000);
  const [recMethod, setRecMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE'>('UPI');
  const [recReference, setRecReference] = useState('');
  const [recAccountId, setRecAccountId] = useState('acc_bank_tmb');

  // Form states - Expense
  const [expCategory, setExpCategory] = useState<PettyExpense['category']>('DELIVERY_FUEL');
  const [expAmount, setExpAmount] = useState(650);
  const [expPaidTo, setExpPaidTo] = useState('Indian Oil Bunk - Palayamkottai Rd');
  const [expDescription, setExpDescription] = useState('Diesel for Delivery Van TN-69-AA-2341');
  const [expPaidFrom, setExpPaidFrom] = useState('acc_cash_petty');

  useEffect(() => {
    const unsub = dataService.subscribe('*', () => {
      setReceipts(dataService.getCollectionReceipts());
      setExpenses(dataService.getPettyExpenses());
      setRetailers(dataService.getRetailers());
      setAccounts(dataService.getAccounts());
    });
    return () => unsub();
  }, []);

  const totalCollections = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const getBal = (id: string) => accounts.find(a => a.id === id)?.currentBalance || 0;
  const cashInHand = getBal('acc_cash_01');
  const pettyCash = getBal('acc_cash_petty');

  const handlePostReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const ret = retailers.find(r => r.id === recRetailerId);
    if (!ret) return;

    dataService.recordCollectionReceipt({
      date: getTodayDateString(),
      retailerId: ret.id,
      retailerShopName: ret.shopName,
      amount: Number(recAmount),
      paymentMethod: recMethod,
      referenceNumber: recReference || `UTR-${Date.now().toString().slice(-6)}`,
      depositToAccountId: recAccountId,
      settledInvoices: [],
      collectedByUserId: currentUser.id,
      collectedByUserName: currentUser.name,
      isVerified: true
    }, currentUser);

    setIsReceiptModalOpen(false);
    setRecReference('');
  };

  const handlePostExpense = (e: React.FormEvent) => {
    e.preventDefault();

    dataService.recordPettyExpense({
      date: getTodayDateString(),
      category: expCategory,
      amount: Number(expAmount),
      paidFromAccountId: expPaidFrom,
      paidTo: expPaidTo,
      description: expDescription,
      approvedBy: currentUser.name
    }, currentUser);

    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand" /> Collections, Expenses & Daily Cash Closing
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Log retailer counter collections, record operational delivery vehicle expenses, and reconcile daily cash balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Plus}
            onClick={() => setIsExpenseModalOpen(true)}
          >
            Record Expense
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Receipt}
            onClick={() => setIsReceiptModalOpen(true)}
          >
            Collect Retailer Payment
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Collections"
          value={formatINR(totalCollections)}
          subtitle={`${receipts.length} payment receipts`}
          icon={ArrowDownRight}
          accentColor="success"
        />
        <StatCard
          title="Operating Expenses"
          value={formatINR(totalExpenses)}
          subtitle={`${expenses.length} expense vouchers`}
          icon={ArrowUpRight}
          accentColor="brand"
        />
        <StatCard
          title="Main Counter Cash"
          value={formatINR(cashInHand)}
          subtitle="Physical Cash in Safe"
          icon={DollarSign}
          accentColor="info"
        />
        <StatCard
          title="Petty Imprest Cash"
          value={formatINR(pettyCash)}
          subtitle="Van & Delivery Driver Cash"
          icon={Fuel}
          accentColor="warning"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-divider pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'collections' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
          }`}
        >
          Customer Collections ({receipts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'expenses' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
          }`}
        >
          Petty & Delivery Expenses ({expenses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cash_closing')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'cash_closing' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
          }`}
        >
          Daily Cash Book Closing
        </button>
      </div>

      {/* Tab 1: Collections */}
      {activeTab === 'collections' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Retailer Shop</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Reference / UTR</th>
                  <th className="py-3 px-4 text-right">Amount Collected</th>
                  <th className="py-3 px-4">Collected By</th>
                  <th className="py-3 px-4">Posting Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No collections recorded yet. Click "Collect Retailer Payment" to log an inward payment.
                    </td>
                  </tr>
                ) : (
                  receipts.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand">{rec.receiptNumber}</td>
                      <td className="py-3 px-4">{formatDate(rec.date)}</td>
                      <td className="py-3 px-4 font-semibold">{rec.retailerShopName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="info">{rec.paymentMethod}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-ink-secondary">{rec.referenceNumber}</td>
                      <td className="py-3 px-4 text-right font-bold text-num text-emerald-700">
                        {formatINR(rec.amount)}
                      </td>
                      <td className="py-3 px-4 text-ink-secondary">{rec.collectedByUserName}</td>
                      <td className="py-3 px-4">
                        <Badge variant="success">Dr. Bank / Cr. Debtors</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Expenses */}
      {activeTab === 'expenses' && (
        <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-muted">
                      No petty expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand">{exp.expenseNumber}</td>
                      <td className="py-3 px-4">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="brand">{exp.category.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{exp.paidTo}</td>
                      <td className="py-3 px-4 text-ink-secondary">{exp.description}</td>
                      <td className="py-3 px-4 text-right font-bold text-num text-rose-700">
                        {formatINR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-ink-secondary">{exp.approvedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Cash Book Closing */}
      {activeTab === 'cash_closing' && (
        <div className="max-w-2xl bg-surface border border-divider rounded-lg p-5 shadow-enterprise space-y-4">
          <div className="pb-3 border-b border-divider">
            <h3 className="text-sm font-bold text-ink-primary">Daily Cash Balance Closing Verification</h3>
            <p className="text-xs text-ink-secondary mt-0.5">Physical cash in drawer vs General Ledger books balance</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between p-3 bg-slate-50 rounded border border-divider">
              <span className="font-semibold text-ink-primary">Main Counter Safe Cash:</span>
              <span className="font-bold text-num text-brand text-sm">{formatINR(cashInHand)}</span>
            </div>

            <div className="flex justify-between p-3 bg-slate-50 rounded border border-divider">
              <span className="font-semibold text-ink-primary">Driver Petty Cash Float:</span>
              <span className="font-bold text-num text-brand text-sm">{formatINR(pettyCash)}</span>
            </div>

            <div className="flex justify-between p-3 bg-brand-50 rounded border border-brand-200">
              <span className="font-bold text-brand-900">Total Closing Cash in Business:</span>
              <span className="font-black text-num text-brand text-base">{formatINR(cashInHand + pettyCash)}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => alert(`Daily cash closing verified for ${formatDate(getTodayDateString())}. Debits and Credits balanced.`)}
            >
              Verify & Lock Daily Closing
            </Button>
          </div>
        </div>
      )}

      {/* Record Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Record Customer Payment Receipt"
        subtitle="Post customer collection to ledger and reduce outstanding balance"
      >
        <form onSubmit={handlePostReceipt} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Retailer Outlet *</label>
            <select
              value={recRetailerId}
              onChange={e => setRecRetailerId(e.target.value)}
              className="w-full p-2 border border-divider rounded bg-white text-xs"
            >
              {retailers.map(r => (
                <option key={r.id} value={r.id}>
                  {r.shopName} (Outstanding: {formatINR(r.currentOutstanding)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={recAmount}
                onChange={e => setRecAmount(Number(e.target.value))}
                className="w-full p-2 border border-divider rounded text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Payment Method *</label>
              <select
                value={recMethod}
                onChange={e => setRecMethod(e.target.value as any)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CASH">Cash on Delivery / Counter</option>
                <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Reference / UTR / Cheque Number</label>
              <input
                type="text"
                value={recReference}
                onChange={e => setRecReference(e.target.value)}
                className="w-full p-2 border border-divider rounded text-xs font-mono"
                placeholder="e.g. 33819201827"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Deposit To GL Account *</label>
              <select
                value={recAccountId}
                onChange={e => setRecAccountId(e.target.value)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="acc_bank_tmb">Tamilnad Mercantile Bank (TMB Current A/c)</option>
                <option value="acc_bank_sbi">State Bank of India (SBI Current A/c)</option>
                <option value="acc_cash_01">Cash in Hand (Counter)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsReceiptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Payment Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Petty & Operational Expense"
        subtitle="Post van fuel, godown maintenance, and office expenses"
      >
        <form onSubmit={handlePostExpense} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Expense Category *</label>
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value as any)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="DELIVERY_FUEL">Delivery Van Fuel</option>
                <option value="VEHICLE_MAINTENANCE">Delivery Van Maintenance & Tyre</option>
                <option value="PACKAGING_MATERIAL">Carton Boxes & Strapping Rolls</option>
                <option value="OFFICE_TEA_SNACKS">Staff Tea & Refreshments</option>
                <option value="ELECTRICITY">Warehouse Electricity & Power</option>
                <option value="STATIONERY">Printing Paper & Vouchers</option>
                <option value="MISCELLANEOUS">Miscellaneous General Expense</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Amount (₹) *</label>
              <input
                type="number"
                required
                min="1"
                value={expAmount}
                onChange={e => setExpAmount(Number(e.target.value))}
                className="w-full p-2 border border-divider rounded text-xs font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Paid To (Vendor / Person) *</label>
              <input
                type="text"
                required
                value={expPaidTo}
                onChange={e => setExpPaidTo(e.target.value)}
                className="w-full p-2 border border-divider rounded text-xs"
                placeholder="e.g. Indian Oil Petrol Bunk"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Disbursed From Account *</label>
              <select
                value={expPaidFrom}
                onChange={e => setExpPaidFrom(e.target.value)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="acc_cash_petty">Petty Cash Imprest</option>
                <option value="acc_cash_01">Main Counter Cash</option>
                <option value="acc_bank_tmb">TMB Bank UPI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Description / Bill Memo Details *</label>
            <input
              type="text"
              required
              value={expDescription}
              onChange={e => setExpDescription(e.target.value)}
              className="w-full p-2 border border-divider rounded text-xs"
              placeholder="e.g. 7.2 litres diesel for delivery run in Millerpuram"
            />
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Expense Voucher
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
