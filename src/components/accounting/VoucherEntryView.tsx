import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import type { Account, JournalEntry, VoucherType } from '../../types/accounting';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString, formatDateTime } from '../../utils/date';
import { Plus, Trash2, Scale, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';

export const VoucherEntryView: React.FC = () => {
  const { currentUser } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>(dataService.getJournalEntries());
  const [accounts, setAccounts] = useState<Account[]>(dataService.getAccounts());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [voucherType, setVoucherType] = useState<VoucherType>('JOURNAL_VOUCHER');
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState<{ accountId: string; debit: number; credit: number; narration?: string }[]>([
    { accountId: accounts[0]?.id || '', debit: 1000, credit: 0 },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 1000 }
  ]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribe('*', () => {
      setJournals(dataService.getJournalEntries());
      setAccounts(dataService.getAccounts());
    });
    return () => unsub();
  }, []);

  const totalDebit = lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { accountId: accounts[0]?.id || '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length <= 2) {
      alert('A double-entry voucher must have at least 2 lines (debit and credit).');
      return;
    }
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSubmitVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isBalanced) {
      setFormError(`Cannot post unbalanced voucher. Debits (₹${totalDebit.toFixed(2)}) must equal Credits (₹${totalCredit.toFixed(2)}).`);
      return;
    }

    if (!narration) {
      setFormError('Please enter a narration description for the audit trail.');
      return;
    }

    const res = dataService.postJournalEntry({
      voucherType,
      date: entryDate,
      narration,
      lines,
      actor: currentUser
    });

    if (!res.success) {
      setFormError(res.message || 'Failed to post voucher.');
      return;
    }

    setIsModalOpen(false);
    setNarration('');
    setLines([
      { accountId: accounts[0]?.id || '', debit: 1000, credit: 0 },
      { accountId: accounts[1]?.id || '', debit: 0, credit: 1000 }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand" /> Double-Entry Voucher Postings
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Strict debit-credit balance validation with immutable audit history.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
        >
          Create Voucher Entry
        </Button>
      </div>

      {/* Vouchers Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Particulars / Line Entries</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4">Narration</th>
                <th className="py-3 px-4">Audited By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {journals.map(j => (
                <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-brand">{j.voucherNumber}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{formatDate(j.date)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge variant="brand">{j.voucherType.replace(/_/g, ' ')}</Badge>
                  </td>
                  <td className="py-3 px-4 min-w-[240px]">
                    <div className="space-y-1">
                      {j.lines.map((l, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="font-semibold text-ink-primary">
                            {l.debit > 0 ? `Dr. ${l.accountName}` : `   To ${l.accountName}`}
                          </span>
                          <span className="font-mono text-ink-secondary">
                            {l.debit > 0 ? formatINR(l.debit) : formatINR(l.credit)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono text-num">
                    {formatINR(j.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold font-mono text-num">
                    {formatINR(j.totalCredit)}
                  </td>
                  <td className="py-3 px-4 text-ink-secondary text-[11px] max-w-xs leading-relaxed">
                    {j.narration}
                  </td>
                  <td className="py-3 px-4 text-ink-secondary text-[11px]">
                    {j.createdByUserName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post Double-Entry Voucher"
        subtitle="Ensure Total Debits exactly balance Total Credits before posting"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitVoucher} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Voucher Type *</label>
              <select
                value={voucherType}
                onChange={e => setVoucherType(e.target.value as VoucherType)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="JOURNAL_VOUCHER">Journal Voucher (General Adjustments)</option>
                <option value="SALES_VOUCHER">Sales Voucher (Invoicing)</option>
                <option value="PURCHASE_VOUCHER">Purchase Voucher (Depot Inward)</option>
                <option value="RECEIPT_VOUCHER">Receipt Voucher (Customer Collections)</option>
                <option value="PAYMENT_VOUCHER">Payment Voucher (Expenses / Supplier Payments)</option>
                <option value="CONTRA_VOUCHER">Contra Voucher (Cash to Bank / Bank to Cash)</option>
                <option value="CREDIT_NOTE">Credit Note (Sales Return)</option>
                <option value="DEBIT_NOTE">Debit Note (Purchase Return)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Voucher Date *</label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full p-2 border border-divider rounded text-xs"
              />
            </div>
          </div>

          {/* Lines */}
          <div className="border border-divider rounded-lg p-3 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-primary">Journal Line Accounts</span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-brand hover:underline"
              >
                + Add Another Line
              </button>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded border border-divider flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-1 w-full">
                  <select
                    value={line.accountId}
                    onChange={e => {
                      const updated = [...lines];
                      updated[idx].accountId = e.target.value;
                      setLines(updated);
                    }}
                    className="w-full p-1.5 border border-divider rounded text-xs bg-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        [{acc.code}] {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Debit (₹)"
                    value={line.debit || ''}
                    onChange={e => {
                      const updated = [...lines];
                      const val = Number(e.target.value);
                      updated[idx].debit = val;
                      if (val > 0) updated[idx].credit = 0;
                      setLines(updated);
                    }}
                    className="w-full p-1.5 border border-divider rounded text-xs font-mono font-bold"
                  />
                </div>

                <div className="w-full sm:w-28">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Credit (₹)"
                    value={line.credit || ''}
                    onChange={e => {
                      const updated = [...lines];
                      const val = Number(e.target.value);
                      updated[idx].credit = val;
                      if (val > 0) updated[idx].debit = 0;
                      setLines(updated);
                    }}
                    className="w-full p-1.5 border border-divider rounded text-xs font-mono font-bold"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLine(idx)}
                  className="p-1.5 text-ink-muted hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Debits vs Credits Balance Check Box */}
            <div className="pt-2 border-t border-divider flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-4">
                <span>Total Debit: <span className="font-mono text-brand font-black">{formatINR(totalDebit)}</span></span>
                <span>Total Credit: <span className="font-mono text-brand font-black">{formatINR(totalCredit)}</span></span>
              </div>
              <div>
                {isBalanced ? (
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Balanced
                  </span>
                ) : (
                  <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Diff: {formatINR(Math.abs(totalDebit - totalCredit))}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Narration *</label>
            <textarea
              required
              rows={2}
              value={narration}
              onChange={e => setNarration(e.target.value)}
              className="w-full p-2 border border-divider rounded text-xs"
              placeholder="e.g. Inward transport freight charges settled to lorry operator"
            />
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={!isBalanced}>
              Post Balanced Voucher
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
