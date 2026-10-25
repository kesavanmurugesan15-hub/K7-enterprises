import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import type { Account } from '../../types/accounting';
import type { BankAccount } from '../../types/bank';
import {
  Save,
  Building2,
  Landmark,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Scale,
  ShieldCheck,
  Check
} from 'lucide-react';

export const BusinessSettingsView: React.FC = () => {
  const { settings, updateSettings } = useBusiness();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'statutory' | 'fy' | 'banks' | 'opening_balances'>('profile');

  // Bank Accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(dataService.getBankAccounts());
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBankData, setNewBankData] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    accountType: 'CURRENT' | 'SAVINGS' | 'OVERDRAFT';
    openingBalance: number;
    upiId: string;
  }>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    accountType: 'CURRENT',
    openingBalance: 0,
    upiId: ''
  });

  // Chart of Accounts Opening Balances state
  const [accounts, setAccounts] = useState<Account[]>(dataService.getAccounts());
  const [balanceEntries, setBalanceEntries] = useState<{ [accountId: string]: { debit: number; credit: number } }>({});
  const [openingBalanceStatus, setOpeningBalanceStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  // Reset Confirmation Modal state
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    const unsubAccounts = dataService.subscribe('k7_accounts', () => {
      setAccounts(dataService.getAccounts());
    });
    const unsubBanks = dataService.subscribe('k7_bank_accounts', () => {
      setBankAccounts(dataService.getBankAccounts());
    });
    return () => {
      unsubAccounts();
      unsubBanks();
    };
  }, []);

  // Initialize balanceEntries from accounts
  useEffect(() => {
    const initialMap: { [accountId: string]: { debit: number; credit: number } } = {};
    accounts.forEach(acc => {
      if (acc.openingBalanceType === 'DR') {
        initialMap[acc.id] = { debit: acc.openingBalance, credit: 0 };
      } else {
        initialMap[acc.id] = { debit: 0, credit: acc.openingBalance };
      }
    });
    setBalanceEntries(initialMap);
  }, [accounts]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      isConfigured: true
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankData.bankName || !newBankData.accountNumber) return;

    dataService.addBankAccount(newBankData, currentUser);
    setBankAccounts(dataService.getBankAccounts());
    setShowAddBankModal(false);
    setNewBankData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      accountType: 'CURRENT',
      openingBalance: 0,
      upiId: ''
    });
  };

  const handleDeleteBank = (bankId: string) => {
    if (window.confirm('Are you sure you want to remove this bank account?')) {
      dataService.deleteBankAccount(bankId, currentUser);
      setBankAccounts(dataService.getBankAccounts());
    }
  };

  // Opening Balance calculations
  const totalDebitOpening = Object.values(balanceEntries).reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCreditOpening = Object.values(balanceEntries).reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const diffOpening = Math.round(Math.abs(totalDebitOpening - totalCreditOpening) * 100) / 100;
  const isOpeningBalanced = diffOpening < 0.05;

  const handleSaveOpeningBalances = () => {
    if (!isOpeningBalanced) {
      setOpeningBalanceStatus({
        type: 'error',
        message: `Opening Balances are unbalanced. Total Debits (${formatINR(totalDebitOpening)}) must equal Total Credits (${formatINR(totalCreditOpening)}). Difference: ${formatINR(diffOpening)}`
      });
      return;
    }

    const payload = Object.entries(balanceEntries).map(([accountId, val]) => ({
      accountId,
      debit: Number(val.debit) || 0,
      credit: Number(val.credit) || 0
    }));

    const result = dataService.setOpeningBalances(
      payload,
      formData.financialYearStartDate || '2026-04-01',
      formData.financialYear || '2026-27',
      currentUser
    );

    if (result.success) {
      setOpeningBalanceStatus({
        type: 'success',
        message: 'Opening balances successfully posted and reconciled to General Ledger!'
      });
      setTimeout(() => setOpeningBalanceStatus({ type: 'idle' }), 4000);
    } else {
      setOpeningBalanceStatus({
        type: 'error',
        message: result.message || 'Failed to post opening balances'
      });
    }
  };

  const handleResetCleanState = () => {
    dataService.resetToCleanState(currentUser);
    setShowResetConfirmModal(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink-primary">Business Settings & Financial Control</h2>
            {formData.isConfigured ? (
              <Badge variant="success" className="gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Configured & Active
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> First-Time Setup Required
              </Badge>
            )}
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Configure your enterprise name, registered office, GSTIN, financial year period, bank accounts, and opening balance reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSaved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => setShowResetConfirmModal(true)}
            className="text-rose-700 border-rose-200 hover:bg-rose-50"
          >
            Reset All Demo Data
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-divider pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
            activeTab === 'profile'
              ? 'bg-brand text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Entity Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('statutory')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
            activeTab === 'statutory'
              ? 'bg-brand text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>GST & Statutory</span>
        </button>
        <button
          onClick={() => setActiveTab('fy')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
            activeTab === 'fy'
              ? 'bg-brand text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Financial Year & Prefixes</span>
        </button>
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
            activeTab === 'banks'
              ? 'bg-brand text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Bank Accounts ({bankAccounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('opening_balances')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md transition-colors ${
            activeTab === 'opening_balances'
              ? 'bg-brand text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-surface'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Chart of Accounts & Opening Balances</span>
          {isOpeningBalanced ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* TAB 1: Entity Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6 text-xs">
          <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-divider">
              <Building2 className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold text-ink-primary">Company & Proprietor Identification</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Company / Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. K7 Enterprises"
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value, distributorName: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Proprietor / Owner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kesavan K."
                  value={formData.ownerName || ''}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Business Tagline / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. FMCG Distribution & Wholesale"
                  value={formData.subTitle}
                  onChange={e => setFormData({ ...formData, subTitle: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Distributor Trade Name</label>
                <input
                  type="text"
                  placeholder="e.g. Authorized FMCG Distributor"
                  value={formData.distributorName}
                  onChange={e => setFormData({ ...formData, distributorName: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-ink-primary mb-1">Registered Godown & Office Address *</label>
              <input
                type="text"
                required
                placeholder="Door No, Street Name, Commercial Complex, Industrial Estate"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">City / Town *</label>
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">District *</label>
                <input
                  type="text"
                  required
                  placeholder="District"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">State *</label>
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  placeholder="600001"
                  value={formData.pincode}
                  onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Official Mobile / Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Official Billing Email</label>
                <input
                  type="email"
                  placeholder="orders@business.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="md" icon={Save} type="submit">
              Save Profile Details
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: GST & Statutory */}
      {activeTab === 'statutory' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6 text-xs">
          <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-divider">
              <FileText className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold text-ink-primary">Taxation & Legal Compliance</h3>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between">
              <div>
                <p className="font-bold text-ink-primary">GST Registered Business?</p>
                <p className="text-ink-secondary text-[11px] mt-0.5">
                  Enable to generate GST compliant invoices with CGST/SGST breakdowns and E-Way bill credentials.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.gstRegistered || false}
                  onChange={e => setFormData({ ...formData, gstRegistered: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">
                  GSTIN Number {formData.gstRegistered && '*'}
                </label>
                <input
                  type="text"
                  required={formData.gstRegistered}
                  placeholder="33AAAAA0000A1Z5"
                  value={formData.gstin}
                  onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">PAN Number *</label>
                <input
                  type="text"
                  required
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={e => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">FSSAI License Number</label>
                <input
                  type="text"
                  placeholder="14-digit FSSAI Number"
                  value={formData.fssaiNumber}
                  onChange={e => setFormData({ ...formData, fssaiNumber: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="md" icon={Save} type="submit">
              Save Statutory Settings
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: Financial Year & Prefixes */}
      {activeTab === 'fy' && (
        <form onSubmit={handleProfileSubmit} className="space-y-6 text-xs">
          <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-divider">
              <Calendar className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-semibold text-ink-primary">Financial Year & Voucher Sequences</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Financial Year Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-27"
                  value={formData.financialYear}
                  onChange={e => setFormData({ ...formData, financialYear: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
                <p className="text-[11px] text-ink-secondary mt-1">Used on invoices, day books and ledger references.</p>
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Financial Year Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.financialYearStartDate || '2026-04-01'}
                  onChange={e => setFormData({ ...formData, financialYearStartDate: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
                <p className="text-[11px] text-ink-secondary mt-1">Standard Indian FY starts on 1st April.</p>
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Financial Year End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.financialYearEndDate || '2027-03-31'}
                  onChange={e => setFormData({ ...formData, financialYearEndDate: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
                <p className="text-[11px] text-ink-secondary mt-1">Standard Indian FY ends on 31st March.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Sales Invoice Prefix *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV/2026-27/"
                  value={formData.invoicePrefix}
                  onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Sales Order Prefix *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SO-"
                  value={formData.orderPrefix}
                  onChange={e => setFormData({ ...formData, orderPrefix: e.target.value })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-ink-primary mb-1">Order Approval Threshold (₹)</label>
                <input
                  type="number"
                  value={formData.requireOrderApprovalThreshold}
                  onChange={e => setFormData({ ...formData, requireOrderApprovalThreshold: Number(e.target.value) })}
                  className="w-full p-2.5 border border-divider rounded focus:border-brand focus:outline-none"
                />
                <p className="text-[11px] text-ink-secondary mt-1">
                  Sales orders exceeding this amount will require Administrator approval.
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <p className="font-bold text-ink-primary">Enable FEFO Batch Allocation</p>
                  <p className="text-ink-secondary text-[11px] mt-0.5">
                    First-Expiry-First-Out automated stock dispatching for FMCG perishables.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableFEFO}
                  onChange={e => setFormData({ ...formData, enableFEFO: e.target.checked })}
                  className="h-4 w-4 text-brand rounded focus:ring-brand"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="md" icon={Save} type="submit">
              Save Financial Year Settings
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: Bank Accounts */}
      {activeTab === 'banks' && (
        <div className="space-y-6 text-xs">
          <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-semibold text-ink-primary">Configured Settlement & Cash Bank Accounts</h3>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => setShowAddBankModal(true)}
              >
                Add Bank Account
              </Button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-lg border border-dashed border-divider">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-ink-primary">No bank accounts configured yet</p>
                <p className="text-ink-secondary text-xs mt-1 mb-4">
                  Add your primary commercial bank account or cash ledger to track payments and generate receipts.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowAddBankModal(true)}
                >
                  Add Your First Bank Account
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-divider bg-slate-50 text-[11px] text-ink-secondary uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Bank & Branch</th>
                      <th className="py-2.5 px-3">Account Holder</th>
                      <th className="py-2.5 px-3">Account Number</th>
                      <th className="py-2.5 px-3">IFSC Code</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Opening Balance</th>
                      <th className="py-2.5 px-3 text-right">Current Balance</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider font-sans">
                    {bankAccounts.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <p className="font-bold text-ink-primary">{b.bankName}</p>
                          <p className="text-[11px] text-ink-secondary">{b.branch || 'Main Branch'}</p>
                        </td>
                        <td className="py-3 px-3 text-ink-primary font-medium">{b.accountName}</td>
                        <td className="py-3 px-3 font-mono text-ink-primary">{b.accountNumber}</td>
                        <td className="py-3 px-3 font-mono uppercase">{b.ifscCode}</td>
                        <td className="py-3 px-3">
                          <Badge variant="neutral">{b.accountType}</Badge>
                        </td>
                        <td className="py-3 px-3 text-right text-num font-medium">
                          {formatINR(b.openingBalance)}
                        </td>
                        <td className="py-3 px-3 text-right text-num font-bold text-ink-primary">
                          {formatINR(b.currentBalance)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDeleteBank(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Remove Bank Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Bank Modal */}
          {showAddBankModal && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="bg-surface rounded-lg border border-divider shadow-xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-divider">
                  <h3 className="text-base font-bold text-ink-primary flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-brand" /> Add Bank Account
                  </h3>
                  <button
                    onClick={() => setShowAddBankModal(false)}
                    className="text-slate-400 hover:text-ink-primary font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddBank} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. State Bank of India"
                        value={newBankData.bankName}
                        onChange={e => setNewBankData({ ...newBankData, bankName: e.target.value })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. K7 Enterprises"
                        value={newBankData.accountName}
                        onChange={e => setNewBankData({ ...newBankData, accountName: e.target.value })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">Account Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="Account Number"
                        value={newBankData.accountNumber}
                        onChange={e => setNewBankData({ ...newBankData, accountNumber: e.target.value })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">IFSC Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="SBIN0001234"
                        value={newBankData.ifscCode}
                        onChange={e => setNewBankData({ ...newBankData, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">Branch Name</label>
                      <input
                        type="text"
                        placeholder="Branch Name"
                        value={newBankData.branch}
                        onChange={e => setNewBankData({ ...newBankData, branch: e.target.value })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">Account Type</label>
                      <select
                        value={newBankData.accountType}
                        onChange={e => setNewBankData({ ...newBankData, accountType: e.target.value as any })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                      >
                        <option value="CURRENT">Current Account</option>
                        <option value="SAVINGS">Savings Account</option>
                        <option value="OVERDRAFT">Overdraft (OD / CC)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">Opening Balance (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newBankData.openingBalance}
                        onChange={e => setNewBankData({ ...newBankData, openingBalance: Number(e.target.value) })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none text-num"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-ink-primary mb-1">UPI ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="business@upi"
                        value={newBankData.upiId}
                        onChange={e => setNewBankData({ ...newBankData, upiId: e.target.value })}
                        className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-divider">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setShowAddBankModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Add & Link Account
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Chart of Accounts & Opening Balances */}
      {activeTab === 'opening_balances' && (
        <div className="space-y-6 text-xs">
          <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-divider">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-semibold text-ink-primary">Chart of Accounts — Opening Balance Setup</h3>
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5">
                  Enter starting balances as of {formData.financialYearStartDate || '01-04-2026'}. Standard double-entry requires Total Debits = Total Credits.
                </p>
              </div>

              {/* Live Reconciliation Tracker */}
              <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-lg border border-divider">
                <div className="text-right">
                  <p className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">Total Debits</p>
                  <p className="font-bold text-ink-primary text-num">{formatINR(totalDebitOpening)}</p>
                </div>
                <div className="text-slate-300 font-light">|</div>
                <div className="text-right">
                  <p className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">Total Credits</p>
                  <p className="font-bold text-ink-primary text-num">{formatINR(totalCreditOpening)}</p>
                </div>
                <div className="text-slate-300 font-light">|</div>
                <div>
                  <p className="text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">Difference</p>
                  {isOpeningBalanced ? (
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      Balanced
                    </span>
                  ) : (
                    <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                      {formatINR(diffOpening)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status alerts */}
            {openingBalanceStatus.type === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{openingBalanceStatus.message}</span>
              </div>
            )}
            {openingBalanceStatus.type === 'error' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{openingBalanceStatus.message}</span>
              </div>
            )}

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                  <tr className="border-b border-divider text-[11px] text-ink-secondary uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Account Name</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right w-36">Opening Debit (₹)</th>
                    <th className="py-2.5 px-3 text-right w-36">Opening Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider font-sans">
                  {accounts.map(acc => {
                    const entry = balanceEntries[acc.id] || { debit: 0, credit: 0 };
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-ink-secondary">{acc.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-ink-primary">{acc.name}</td>
                        <td className="py-2.5 px-3 text-[11px] text-ink-secondary">{acc.subGroup.replace(/_/g, ' ')}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              acc.type === 'ASSET'
                                ? 'bg-blue-50 text-blue-700'
                                : acc.type === 'LIABILITY'
                                ? 'bg-amber-50 text-amber-700'
                                : acc.type === 'EQUITY'
                                ? 'bg-purple-50 text-purple-700'
                                : acc.type === 'INCOME'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {acc.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={entry.debit > 0 ? entry.debit : ''}
                            onChange={e => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setBalanceEntries({
                                ...balanceEntries,
                                [acc.id]: { debit: val, credit: val > 0 ? 0 : entry.credit }
                              });
                            }}
                            className="w-full text-right p-1.5 border border-divider rounded focus:border-brand focus:outline-none text-num"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={entry.credit > 0 ? entry.credit : ''}
                            onChange={e => {
                              const val = Math.max(0, parseFloat(e.target.value) || 0);
                              setBalanceEntries({
                                ...balanceEntries,
                                [acc.id]: { debit: val > 0 ? 0 : entry.debit, credit: val }
                              });
                            }}
                            className="w-full text-right p-1.5 border border-divider rounded focus:border-brand focus:outline-none text-num"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-divider">
              <p className="text-[11px] text-ink-secondary">
                Posting updates initial Trial Balance and generates opening voucher <span className="font-mono font-bold text-ink-primary">VR-OPEN-001</span>.
              </p>
              <Button
                variant="primary"
                size="md"
                icon={Save}
                disabled={!isOpeningBalanced}
                onClick={handleSaveOpeningBalances}
              >
                Save & Post Opening Balances
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg border border-divider shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-ink-primary">Purge All Data & Start Clean?</h3>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              This action will reset your system to a clean setup with zero dummy products, zero sales orders, zero sample purchase receipts, and zero artificial balances.
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px] font-medium">
              Warning: All existing local browser records will be removed. You will configure your real company name, products, suppliers, and bank accounts from scratch.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-rose-600 hover:bg-rose-700"
                onClick={handleResetCleanState}
              >
                Yes, Purge All & Start Clean
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
