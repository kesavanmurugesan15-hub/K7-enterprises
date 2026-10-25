import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import type { Supplier } from '../../types/purchase';
import type { SupplierCreditorProfile } from '../../types/credit';
import type { BankAccount } from '../../types/bank';
import type { Account, SupplierLedgerTransaction } from '../../types/accounting';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/date';
import { downloadCSV } from '../../utils/export';
import {
  Building,
  Plus,
  Search,
  DollarSign,
  Download,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Edit2
} from 'lucide-react';

export const CreditorManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const [profiles, setProfiles] = useState<SupplierCreditorProfile[]>(dataService.getSupplierCreditorProfiles());
  const [suppliers, setSuppliers] = useState<Supplier[]>(dataService.getSuppliers());
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(dataService.getBankAccounts());
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  // Form states
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null);
  const [ledgerTransactions, setLedgerTransactions] = useState<SupplierLedgerTransaction[]>([]);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    date: getTodayDateString(),
    amount: 0,
    paymentMethod: 'UPI' as 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE',
    referenceNumber: '',
    paidFromAccountId: '',
    notes: ''
  });
  const [paymentStatus, setPaymentStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });

  const refreshData = () => {
    setProfiles(dataService.getSupplierCreditorProfiles());
    setSuppliers(dataService.getSuppliers());
    setBankAccounts(dataService.getBankAccounts());
  };

  useEffect(() => {
    const unsub = dataService.subscribe('*', refreshData);
    return () => unsub();
  }, []);

  const totalPayables = profiles.reduce((sum, p) => sum + p.currentPayable, 0);
  const totalPurchased = profiles.reduce((sum, p) => sum + p.totalPurchased, 0);
  const totalPaid = profiles.reduce((sum, p) => sum + p.totalPaid, 0);
  const totalOverdue = profiles.reduce((sum, p) => sum + p.ageing.days_31_60 + p.ageing.days_61_90 + p.ageing.days_90_plus, 0);

  const filtered = profiles.filter(p =>
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingSupplier({
      name: '',
      supplierCode: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      gstin: '',
      paymentTermsDays: 30,
      openingBalance: 0,
      currentOutstandingBalance: 0,
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier({ ...sup });
    setIsAddModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.name || !editingSupplier?.contactPerson || !editingSupplier?.phone) {
      alert('Please fill in required fields: Supplier Name, Contact Person, and Phone.');
      return;
    }

    const saved: Supplier = {
      id: editingSupplier.id || `sup_${Date.now()}`,
      name: editingSupplier.name!,
      supplierCode: editingSupplier.supplierCode || `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      contactPerson: editingSupplier.contactPerson!,
      phone: editingSupplier.phone!,
      email: editingSupplier.email || '',
      address: editingSupplier.address || '',
      city: editingSupplier.city || 'Tamil Nadu',
      state: editingSupplier.state || 'Tamil Nadu',
      gstin: editingSupplier.gstin || '',
      paymentTermsDays: Number(editingSupplier.paymentTermsDays || 30),
      openingBalance: Number(editingSupplier.openingBalance || 0),
      currentOutstandingBalance: editingSupplier.currentOutstandingBalance !== undefined
        ? Number(editingSupplier.currentOutstandingBalance)
        : Number(editingSupplier.openingBalance || 0),
      isActive: editingSupplier.isActive ?? true,
      createdAt: editingSupplier.createdAt || new Date().toISOString()
    };

    dataService.saveSupplier(saved, currentUser);
    setIsAddModalOpen(false);
    setEditingSupplier(null);
    refreshData();
  };

  const handleOpenPay = (supId: string) => {
    const target = suppliers.find(s => s.id === supId) || suppliers[0];
    const profile = profiles.find(p => p.supplierId === supId);
    setSelectedSupplierForPay(target);

    // Default to first bank account or cash
    const accounts = dataService.getAccounts();
    const cashAcc = accounts.find(a => a.id === 'acc_cash_01');
    const firstBank = bankAccounts[0];

    setPaymentData({
      date: getTodayDateString(),
      amount: profile ? profile.currentPayable : 0,
      paymentMethod: 'UPI',
      referenceNumber: `UTR-${Date.now().toString().slice(-8)}`,
      paidFromAccountId: firstBank ? firstBank.glAccountId : (cashAcc?.id || 'acc_cash_01'),
      notes: ''
    });
    setPaymentStatus({ type: 'idle' });
    setIsPayModalOpen(true);
  };

  const handlePostPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay) return;
    if (paymentData.amount <= 0) {
      setPaymentStatus({ type: 'error', message: 'Payment amount must be greater than zero.' });
      return;
    }

    const res = dataService.recordSupplierPayment({
      supplierId: selectedSupplierForPay.id,
      date: paymentData.date,
      amount: Number(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: paymentData.referenceNumber,
      paidFromAccountId: paymentData.paidFromAccountId,
      notes: paymentData.notes
    }, currentUser);

    if (res.success) {
      setPaymentStatus({ type: 'success', message: `Payment voucher ${res.voucherNumber} posted successfully!` });
      setTimeout(() => {
        setIsPayModalOpen(false);
        refreshData();
      }, 1500);
    } else {
      setPaymentStatus({ type: 'error', message: res.message || 'Payment voucher could not be posted.' });
    }
  };

  const handleOpenLedger = (supId: string) => {
    const target = suppliers.find(s => s.id === supId) || suppliers[0];
    setSelectedSupplierForLedger(target);
    const ledger = dataService.getSupplierDetailedLedger(supId);
    setLedgerTransactions(ledger.transactions);
    setIsLedgerModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Creditors & Accounts Payable Register'],
      [`Generated: ${getTodayDateString()}`],
      ['Supplier Code', 'Supplier Name', 'City', 'Phone', 'GSTIN', 'Credit Days', 'Total Purchased (INR)', 'Total Paid (INR)', 'Current Payable (INR)', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
      ...profiles.map(p => [
        p.supplierCode,
        p.supplierName,
        p.city,
        p.phone,
        p.gstin,
        p.paymentTermsDays.toString(),
        p.totalPurchased.toString(),
        p.totalPaid.toString(),
        p.currentPayable.toString(),
        p.ageing.current_0_30.toString(),
        p.ageing.days_31_60.toString(),
        p.ageing.days_61_90.toString(),
        p.ageing.days_90_plus.toString()
      ]),
      ['Total', '', '', '', '', '', totalPurchased.toString(), totalPaid.toString(), totalPayables.toString()]
    ];
    downloadCSV('Creditors_Accounts_Payable_Register', csvData);
  };

  const handleExportSingleLedger = () => {
    if (!selectedSupplierForLedger) return;
    const csvData = [
      [`Creditor Statement: ${selectedSupplierForLedger.name} (${selectedSupplierForLedger.supplierCode || selectedSupplierForLedger.id})`],
      [`GSTIN: ${selectedSupplierForLedger.gstin} | City: ${selectedSupplierForLedger.city}`],
      ['Date', 'Voucher Number', 'Voucher Type', 'Supplier Invoice #', 'Particulars', 'Debit / Paid (INR)', 'Credit / Inward (INR)', 'Running Balance (INR)'],
      ...ledgerTransactions.map(t => [
        t.date,
        t.voucherNumber,
        t.voucherType,
        t.supplierInvoiceNumber || '-',
        t.particulars,
        t.debit.toString(),
        t.credit.toString(),
        t.runningBalance.toString()
      ])
    ];
    downloadCSV(`Creditor_Ledger_${selectedSupplierForLedger.supplierCode || selectedSupplierForLedger.id}`, csvData);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-surface p-5 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-primary flex items-center gap-2">
            <Building className="w-5 h-5 text-brand" /> Creditor Management (Sundry Creditors & Suppliers)
          </h2>
          <p className="text-xs text-ink-secondary mt-1">
            Maintain registered vendor master records, track bills payable, post payment vouchers, and audit vendor running ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
            Export Register (CSV)
          </Button>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Add New Creditor
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Total Registered Creditors</p>
          <p className="text-2xl font-bold text-ink-primary mt-1 text-num">{profiles.length}</p>
          <p className="text-[11px] text-ink-muted mt-1">Active supplier depots</p>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Total Payables Outstanding</p>
          <p className="text-2xl font-bold text-rose-700 font-mono mt-1 text-num">{formatINR(totalPayables)}</p>
          <p className="text-[11px] text-ink-muted mt-1">Sundry Creditors balance</p>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Total Purchases Inwarded</p>
          <p className="text-2xl font-bold text-ink-primary font-mono mt-1 text-num">{formatINR(totalPurchased)}</p>
          <p className="text-[11px] text-ink-muted mt-1">Billed GRN Inwards</p>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wider">Overdue Bills (&gt; 30 Days)</p>
          <p className="text-2xl font-bold text-amber-700 font-mono mt-1 text-num">{formatINR(totalOverdue)}</p>
          <p className="text-[11px] text-amber-800 font-medium mt-1">Due for settlement</p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="p-4 border-b border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <h3 className="font-bold text-sm text-ink-primary">Creditors Master Register</h3>
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search creditor name, code, phone, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-divider rounded-md focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-muted">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-ink-primary text-xs">No creditors registered yet</p>
            <p className="text-ink-secondary text-[11px] mt-1 mb-4">
              Add your manufacturing depots or FMCG suppliers to track credit terms and payables.
            </p>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
              Add First Creditor
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Creditor / Supplier</th>
                  <th className="py-3 px-4">Code / City</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">GSTIN & Terms</th>
                  <th className="py-3 px-4 text-right">Total Purchases</th>
                  <th className="py-3 px-4 text-right">Total Paid</th>
                  <th className="py-3 px-4 text-right">Net Payable</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {filtered.map(p => {
                  const sup = suppliers.find(s => s.id === p.supplierId);
                  const isPaid = p.currentPayable === 0;

                  return (
                    <tr key={p.supplierId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-ink-primary">{p.supplierName}</div>
                        <div className="text-[11px] text-ink-secondary">{p.contactPerson}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium text-brand bg-brand-50 px-1.5 py-0.5 rounded text-[11px]">
                          {p.supplierCode}
                        </span>
                        <div className="text-[11px] text-ink-muted mt-0.5">{p.city}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono">{p.phone}</div>
                        {sup?.email && <div className="text-[11px] text-ink-muted">{sup.email}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] uppercase">{p.gstin || 'UNREGISTERED'}</div>
                        <div className="text-[11px] text-ink-muted">{p.paymentTermsDays} Days Credit</div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-num">
                        {formatINR(p.totalPurchased)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-num text-emerald-700">
                        {formatINR(p.totalPaid)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono font-bold text-sm text-num ${isPaid ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatINR(p.currentPayable)}
                        </span>
                        <div>
                          {isPaid ? (
                            <Badge variant="success" className="text-[10px]">Settled</Badge>
                          ) : (
                            <Badge variant={p.ageing.days_31_60 > 0 || p.ageing.days_61_90 > 0 ? 'error' : 'warning'} className="text-[10px]">
                              Payable
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPay(p.supplierId)}
                            className="px-2.5 py-1 bg-brand text-white rounded text-[11px] font-semibold hover:bg-brand-hover shadow-sm transition-colors flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenLedger(p.supplierId)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded text-[11px] font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1"
                            title="Inspect Supplier Running Ledger"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>Ledger</span>
                          </button>
                          {sup && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sup)}
                              className="p-1 hover:bg-slate-100 rounded text-ink-muted hover:text-ink-primary"
                              title="Edit Supplier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Add / Edit Creditor */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSupplier?.id ? 'Edit Creditor Profile' : 'Register New Creditor / Supplier'}
        subtitle="Manage supplier business information, GSTIN, and opening balance"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Creditor / Supplier Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aachi Spices & Foods Depot"
                value={editingSupplier?.name || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Supplier Code</label>
              <input
                type="text"
                placeholder="e.g. ACH-MDU-DEPOT"
                value={editingSupplier?.supplierCode || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, supplierCode: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Depot Manager"
                value={editingSupplier?.contactPerson || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Official Mobile / Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={editingSupplier?.phone || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Billing Email</label>
              <input
                type="email"
                placeholder="depot@supplier.com"
                value={editingSupplier?.email || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">GSTIN Number</label>
              <input
                type="text"
                placeholder="33AAACA1234F1Z1"
                value={editingSupplier?.gstin || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, gstin: e.target.value.toUpperCase() })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Depot / Factory Address</label>
            <input
              type="text"
              placeholder="Plot No, Industrial Estate, Main Road"
              value={editingSupplier?.address || ''}
              onChange={e => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">City / Town *</label>
              <input
                type="text"
                required
                placeholder="e.g. Madurai"
                value={editingSupplier?.city || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, city: e.target.value })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Credit Terms (Days)</label>
              <input
                type="number"
                value={editingSupplier?.paymentTermsDays || 30}
                onChange={e => setEditingSupplier({ ...editingSupplier, paymentTermsDays: Number(e.target.value) })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Opening Payable Balance (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editingSupplier?.openingBalance || ''}
                onChange={e => setEditingSupplier({ ...editingSupplier, openingBalance: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none text-num"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-divider">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Creditor
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Record Payment to Creditor */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment to ${selectedSupplierForPay?.name || 'Creditor'}`}
        subtitle="Disburse funds and post double-entry payment voucher"
        maxWidth="lg"
      >
        <form onSubmit={handlePostPayment} className="space-y-4 text-xs">
          {paymentStatus.type === 'success' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{paymentStatus.message}</span>
            </div>
          )}
          {paymentStatus.type === 'error' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{paymentStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentData.date}
                onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                className="w-full p-2 border border-divider rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={paymentData.amount || ''}
                onChange={e => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 border border-divider rounded font-mono text-num font-bold text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Payment Mode *</label>
              <select
                value={paymentData.paymentMethod}
                onChange={e => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                className="w-full p-2 border border-divider rounded bg-white"
              >
                <option value="UPI">UPI Transfer</option>
                <option value="BANK_TRANSFER">NEFT / RTGS / IMPS</option>
                <option value="CHEQUE">Cheque Clearance</option>
                <option value="CASH">Cash in Hand</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Paid From Account *</label>
              <select
                value={paymentData.paidFromAccountId}
                onChange={e => setPaymentData({ ...paymentData, paidFromAccountId: e.target.value })}
                className="w-full p-2 border border-divider rounded bg-white"
              >
                <option value="acc_cash_01">Cash in Hand (Counter)</option>
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.glAccountId}>
                    {b.bankName} - {b.accountNumber.slice(-4)} ({formatINR(b.currentBookBalance || b.currentBalance || 0)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Reference Number / UTR / Cheque No *</label>
            <input
              type="text"
              required
              placeholder="e.g. UTR-9988776655 or CHQ-491021"
              value={paymentData.referenceNumber}
              onChange={e => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
              className="w-full p-2 border border-divider rounded font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Narration / Notes</label>
            <input
              type="text"
              placeholder="e.g. Part payment against monthly stock inward"
              value={paymentData.notes}
              onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })}
              className="w-full p-2 border border-divider rounded"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-divider">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsPayModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Post Payment Voucher
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Detailed Creditor Ledger Drill-Down */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Creditor Ledger: ${selectedSupplierForLedger?.name || 'Supplier'}`}
        subtitle={`Code: ${selectedSupplierForLedger?.supplierCode || selectedSupplierForLedger?.id} • GSTIN: ${selectedSupplierForLedger?.gstin || '-'}`}
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-ink-secondary">
              Closing Payable: <strong className="font-mono text-rose-700">{formatINR(selectedSupplierForLedger?.currentOutstandingBalance || 0)}</strong>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Download} onClick={handleExportSingleLedger}>
                Export Statement (CSV)
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsLedgerModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {ledgerTransactions.length === 0 ? (
            <div className="py-8 text-center text-ink-muted">
              No transactions recorded for this creditor yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[450px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
                  <tr className="border-b border-divider text-[10px] text-ink-secondary uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Voucher #</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Bill / Inv #</th>
                    <th className="py-2.5 px-3">Particulars</th>
                    <th className="py-2.5 px-3 text-right">Debit (Paid ₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit (Billed ₹)</th>
                    <th className="py-2.5 px-3 text-right">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider font-sans">
                  {ledgerTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-ink-secondary font-mono">{formatDate(tx.date)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-brand">{tx.voucherNumber}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="neutral" className="text-[10px]">{tx.voucherType.replace(/_VOUCHER/g, '')}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-ink-secondary">{tx.supplierInvoiceNumber || '-'}</td>
                      <td className="py-2.5 px-3 font-medium text-ink-primary">{tx.particulars}</td>
                      <td className="py-2.5 px-3 text-right text-num font-semibold text-emerald-700">
                        {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-num font-semibold text-rose-700">
                        {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-num text-ink-primary">
                        {formatINR(tx.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
