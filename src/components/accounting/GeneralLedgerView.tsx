import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { Account, JournalEntry } from '../../types/accounting';
import type { Retailer } from '../../types/auth';
import type { Supplier } from '../../types/purchase';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { downloadCSV } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BookOpen, Download, Store, Building, Phone, CreditCard, User, Search, Filter } from 'lucide-react';

export const GeneralLedgerView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(dataService.getAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc_sundry_debtors');
  const [journals, setJournals] = useState<JournalEntry[]>(dataService.getJournalEntries());
  const [retailers, setRetailers] = useState<Retailer[]>(dataService.getRetailers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(dataService.getSuppliers());

  // Party Sub-Ledger filters
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('ALL');
  const [selectedCreditorId, setSelectedCreditorId] = useState<string>('ALL');

  const refreshData = () => {
    setAccounts(dataService.getAccounts());
    setJournals(dataService.getJournalEntries());
    setRetailers(dataService.getRetailers());
    setSuppliers(dataService.getSuppliers());
  };

  useEffect(() => {
    const unsub = dataService.subscribe('*', refreshData);
    return () => unsub();
  }, []);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];
  const isDebtors = selectedAccountId === 'acc_sundry_debtors';
  const isCreditors = selectedAccountId === 'acc_sundry_creditors';

  // If Debtor selected specific
  const debtorDetailed = (isDebtors && selectedDebtorId !== 'ALL')
    ? dataService.getCustomerDetailedLedger(selectedDebtorId)
    : null;

  // If Creditor selected specific
  const creditorDetailed = (isCreditors && selectedCreditorId !== 'ALL')
    ? dataService.getSupplierDetailedLedger(selectedCreditorId)
    : null;

  // Extract all lines for this account with running balance if not specific sub-ledger
  const lines: {
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration: string;
    partyName: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }[] = [];

  let running = selectedAccount ? selectedAccount.openingBalance : 0;
  const isAssetOrExpense = selectedAccount?.type === 'ASSET' || selectedAccount?.type === 'EXPENSE';

  for (const j of journals) {
    for (const l of j.lines) {
      if (l.accountId === selectedAccountId) {
        if (isAssetOrExpense) {
          running += (l.debit - l.credit);
        } else {
          running += (l.credit - l.debit);
        }

        const partyName = l.subEntityName || (l.accountName.includes('—') ? l.accountName.split('—')[1].trim() : '-');

        lines.push({
          date: j.date,
          voucherNumber: j.voucherNumber,
          voucherType: j.voucherType,
          narration: l.narration || j.narration,
          partyName,
          debit: l.debit,
          credit: l.credit,
          runningBalance: running
        });
      }
    }
  }

  const handleExportCSV = () => {
    if (!selectedAccount) return;

    if (isDebtors && debtorDetailed) {
      const csvData = [
        [`Debtor Subsidiary Ledger: ${debtorDetailed.summary.retailerShopName}`],
        [`Owner: ${debtorDetailed.summary.ownerName} | Phone: ${debtorDetailed.summary.phone} | Credit Limit: INR ${debtorDetailed.summary.creditLimit}`],
        ['Date', 'Voucher Number', 'Voucher Type', 'Invoice #', 'Particulars', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'],
        ...debtorDetailed.transactions.map(t => [
          t.date,
          t.voucherNumber,
          t.voucherType,
          t.invoiceNumber,
          t.particulars,
          t.debit.toString(),
          t.credit.toString(),
          t.runningBalance.toString()
        ])
      ];
      downloadCSV(`Debtor_Ledger_${debtorDetailed.summary.retailerShopName.replace(/\s+/g, '_')}`, csvData);
      return;
    }

    if (isCreditors && creditorDetailed) {
      const csvData = [
        [`Creditor Subsidiary Ledger: ${creditorDetailed.summary.supplierName} (${creditorDetailed.summary.supplierCode})`],
        [`GSTIN: ${creditorDetailed.summary.gstin} | Opening Balance: INR ${creditorDetailed.summary.openingBalance}`],
        ['Date', 'Voucher Number', 'Voucher Type', 'Supplier Invoice #', 'Particulars', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'],
        ...creditorDetailed.transactions.map(t => [
          t.date,
          t.voucherNumber,
          t.voucherType,
          t.supplierInvoiceNumber,
          t.particulars,
          t.debit.toString(),
          t.credit.toString(),
          t.runningBalance.toString()
        ])
      ];
      downloadCSV(`Creditor_Ledger_${creditorDetailed.summary.supplierName.replace(/\s+/g, '_')}`, csvData);
      return;
    }

    const csvData = [
      [`General Ledger: ${selectedAccount.name} (${selectedAccount.code})`],
      ['Date', 'Voucher Number', 'Voucher Type', 'Party Name', 'Particulars', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'],
      ['Opening Balance', '-', '-', '-', '-', selectedAccount.openingBalanceType === 'DR' ? selectedAccount.openingBalance.toString() : '0', selectedAccount.openingBalanceType === 'CR' ? selectedAccount.openingBalance.toString() : '0', selectedAccount.openingBalance.toString()],
      ...lines.map(l => [
        l.date,
        l.voucherNumber,
        l.voucherType,
        l.partyName,
        l.narration,
        l.debit.toString(),
        l.credit.toString(),
        l.runningBalance.toString()
      ])
    ];
    downloadCSV(`Ledger_${selectedAccount.code}_${selectedAccount.name.replace(/\s+/g, '_')}`, csvData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand" /> General Ledger & Party Statements
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Individual account statements, debtor/creditor party subsidiary ledgers, and running balances.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export Account Statement (CSV)
        </Button>
      </div>

      {/* Account Selector Bar */}
      <div className="bg-surface p-4 rounded-lg border border-divider space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1">
              Select General Ledger Account:
            </label>
            <select
              value={selectedAccountId}
              onChange={e => {
                setSelectedAccountId(e.target.value);
                setSelectedDebtorId('ALL');
                setSelectedCreditorId('ALL');
              }}
              className="w-full p-2 border border-divider rounded bg-white text-xs font-semibold text-ink-primary focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] {acc.name} — Current: {formatINR(acc.currentBalance)} {acc.currentBalanceType}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Party Filter for Sundry Debtors */}
          {isDebtors && (
            <div className="bg-blue-50/60 border border-blue-200 rounded p-2.5">
              <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-700" />
                Select Debtor (Customer / Retailer Name):
              </label>
              <select
                value={selectedDebtorId}
                onChange={e => setSelectedDebtorId(e.target.value)}
                className="w-full p-1.5 border border-blue-300 rounded bg-white text-xs font-semibold text-blue-950 focus:outline-none"
              >
                <option value="ALL">📁 All Debtors (Consolidated Sundry Debtors)</option>
                {retailers.map(r => (
                  <option key={r.id} value={r.id}>
                    👤 {r.shopName} — {r.ownerName} ({r.city}) | Due: {formatINR(r.currentOutstanding)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Secondary Party Filter for Sundry Creditors */}
          {isCreditors && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded p-2.5">
              <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-700" />
                Select Creditor (Supplier / Vendor Name):
              </label>
              <select
                value={selectedCreditorId}
                onChange={e => setSelectedCreditorId(e.target.value)}
                className="w-full p-1.5 border border-emerald-300 rounded bg-white text-xs font-semibold text-emerald-950 focus:outline-none"
              >
                <option value="ALL">📁 All Creditors (Consolidated Sundry Creditors)</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    🏢 {s.name} ({s.supplierCode || s.city}) | Payable: {formatINR(s.currentOutstandingBalance)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Party Summary Bar */}
        {isDebtors && debtorDetailed && debtorDetailed.retailer && (
          <div className="p-3 bg-slate-50 border border-divider rounded-md flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink-primary text-sm">{debtorDetailed.retailer.shopName}</span>
                <Badge variant="brand">{debtorDetailed.retailer.city}</Badge>
              </div>
              <p className="text-[11px] text-ink-muted">
                Owner: {debtorDetailed.retailer.ownerName} | Phone: {debtorDetailed.retailer.phone} | GSTIN: {debtorDetailed.retailer.gstin || 'Unregistered'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] text-ink-muted uppercase">Credit Limit</p>
                <p className="font-mono font-semibold text-ink-primary">{formatINR(debtorDetailed.summary.creditLimit)}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase">Total Invoiced (Dr)</p>
                <p className="font-mono font-semibold text-blue-700">{formatINR(debtorDetailed.summary.totalInvoiced)}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase">Total Receipts (Cr)</p>
                <p className="font-mono font-semibold text-emerald-700">{formatINR(debtorDetailed.summary.totalCollected)}</p>
              </div>
              <div className="border-l border-divider pl-4">
                <p className="text-[10px] text-ink-muted uppercase">Net Outstanding</p>
                <p className="font-mono font-bold text-base text-brand">{formatINR(debtorDetailed.summary.closingBalance)}</p>
              </div>
            </div>
          </div>
        )}

        {isCreditors && creditorDetailed && creditorDetailed.supplier && (
          <div className="p-3 bg-slate-50 border border-divider rounded-md flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink-primary text-sm">{creditorDetailed.supplier.name}</span>
                <Badge variant="neutral">{creditorDetailed.supplier.supplierCode}</Badge>
                <Badge variant="brand">{creditorDetailed.supplier.city}</Badge>
              </div>
              <p className="text-[11px] text-ink-muted">
                Contact: {creditorDetailed.supplier.contactPerson} | Phone: {creditorDetailed.supplier.phone} | GSTIN: {creditorDetailed.supplier.gstin || '-'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-[10px] text-ink-muted uppercase">Opening Balance</p>
                <p className="font-mono font-semibold text-ink-primary">{formatINR(creditorDetailed.summary.openingBalance)}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase">Total Purchases (Cr)</p>
                <p className="font-mono font-semibold text-blue-700">{formatINR(creditorDetailed.summary.creditPurchases)}</p>
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase">Payments Made (Dr)</p>
                <p className="font-mono font-semibold text-emerald-700">{formatINR(creditorDetailed.summary.paymentsMade)}</p>
              </div>
              <div className="border-l border-divider pl-4">
                <p className="text-[10px] text-ink-muted uppercase">Net Payable</p>
                <p className="font-mono font-bold text-base text-brand">{formatINR(creditorDetailed.summary.closingBalance)}</p>
              </div>
            </div>
          </div>
        )}

        {!debtorDetailed && !creditorDetailed && selectedAccount && (
          <div className="flex items-center justify-end gap-6 text-right pt-2 border-t border-divider">
            <div>
              <p className="text-[11px] text-ink-secondary">Opening Balance</p>
              <p className="font-mono font-bold text-ink-primary text-sm">
                {formatINR(selectedAccount.openingBalance)} {selectedAccount.openingBalanceType}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-ink-secondary">Closing Balance</p>
              <p className="font-mono font-bold text-brand text-base">
                {formatINR(selectedAccount.currentBalance)} {selectedAccount.currentBalanceType}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto">
          {/* Specific Debtor Ledger View */}
          {debtorDetailed ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Voucher Type</th>
                  <th className="py-3 px-4">Invoice / Bill #</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 text-right">Debit / Billed (₹)</th>
                  <th className="py-3 px-4 text-right">Credit / Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {debtorDetailed.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No transactions recorded for this debtor yet.
                    </td>
                  </tr>
                ) : (
                  debtorDetailed.transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-brand">{t.voucherNumber}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <Badge variant="brand">{t.voucherType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-ink-primary">{t.invoiceNumber}</td>
                      <td className="py-2.5 px-4 text-ink-secondary max-w-xs">{t.particulars}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-num">
                        {t.debit > 0 ? formatINR(t.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-num text-emerald-700">
                        {t.credit > 0 ? formatINR(t.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-num text-brand">
                        {formatINR(t.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : creditorDetailed ? (
            /* Specific Creditor Ledger View */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Voucher Type</th>
                  <th className="py-3 px-4">Supplier Invoice #</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 text-right">Debit / Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Credit / Purchases (₹)</th>
                  <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {creditorDetailed.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No inward bills or payments recorded for this creditor yet.
                    </td>
                  </tr>
                ) : (
                  creditorDetailed.transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-brand">{t.voucherNumber}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <Badge variant="brand">{t.voucherType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-ink-primary">{t.supplierInvoiceNumber}</td>
                      <td className="py-2.5 px-4 text-ink-secondary max-w-xs">{t.particulars}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-num text-emerald-700">
                        {t.debit > 0 ? formatINR(t.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-num text-blue-700">
                        {t.credit > 0 ? formatINR(t.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-num text-brand">
                        {formatINR(t.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Consolidated General Ledger View with Debtor/Creditor Party Names */
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Voucher #</th>
                  <th className="py-3 px-4">Voucher Type</th>
                  <th className="py-3 px-4">Party / Counterparty</th>
                  <th className="py-3 px-4">Particulars / Narration</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {/* Opening balance row */}
                <tr className="bg-slate-50/50 font-semibold italic text-ink-secondary">
                  <td className="py-2.5 px-4" colSpan={5}>Opening Balance Brought Forward</td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {selectedAccount?.openingBalanceType === 'DR' ? formatINR(selectedAccount.openingBalance) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {selectedAccount?.openingBalanceType === 'CR' ? formatINR(selectedAccount.openingBalance) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-ink-primary">
                    {formatINR(selectedAccount?.openingBalance)} {selectedAccount?.openingBalanceType}
                  </td>
                </tr>

                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-ink-muted">
                      No voucher entries posted to this account yet.
                    </td>
                  </tr>
                ) : (
                  lines.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(l.date)}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-brand">{l.voucherNumber}</td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <Badge variant="brand">{l.voucherType.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="py-2.5 px-4">
                        {l.partyName && l.partyName !== '-' ? (
                          <span className="font-semibold text-ink-primary bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {l.partyName}
                          </span>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-ink-secondary max-w-sm">{l.narration}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-num">
                        {l.debit > 0 ? formatINR(l.debit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-num">
                        {l.credit > 0 ? formatINR(l.credit) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-num text-brand">
                        {formatINR(l.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
