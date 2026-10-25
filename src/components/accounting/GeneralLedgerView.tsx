import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { Account, JournalEntry } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { downloadCSV } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { BookOpen, Download, Search } from 'lucide-react';

export const GeneralLedgerView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(dataService.getAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [journals, setJournals] = useState<JournalEntry[]>(dataService.getJournalEntries());

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setAccounts(dataService.getAccounts());
      setJournals(dataService.getJournalEntries());
    });
  }, []);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Extract all lines for this account with running balance
  const lines: {
    date: string;
    voucherNumber: string;
    voucherType: string;
    narration: string;
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

        lines.push({
          date: j.date,
          voucherNumber: j.voucherNumber,
          voucherType: j.voucherType,
          narration: l.narration || j.narration,
          debit: l.debit,
          credit: l.credit,
          runningBalance: running
        });
      }
    }
  }

  const handleExportCSV = () => {
    if (!selectedAccount) return;
    const csvData = [
      [`General Ledger: ${selectedAccount.name} (${selectedAccount.code})`],
      ['Date', 'Voucher Number', 'Voucher Type', 'Particulars', 'Debit (INR)', 'Credit (INR)', 'Running Balance (INR)'],
      ['Opening Balance', '-', '-', '-', selectedAccount.openingBalanceType === 'DR' ? selectedAccount.openingBalance.toString() : '0', selectedAccount.openingBalanceType === 'CR' ? selectedAccount.openingBalance.toString() : '0', selectedAccount.openingBalance.toString()],
      ...lines.map(l => [
        l.date,
        l.voucherNumber,
        l.voucherType,
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
            <BookOpen className="w-5 h-5 text-brand" /> General Ledger Statement
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Individual account statement showing opening balances, line movements, and running ledger totals.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export Account Statement (CSV)
        </Button>
      </div>

      {/* Account Selector Bar */}
      <div className="bg-surface p-4 rounded-lg border border-divider flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex-1 max-w-md">
          <label className="block font-semibold text-ink-primary mb-1">Select General Ledger Account:</label>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full p-2 border border-divider rounded bg-white text-xs font-semibold"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                [{acc.code}] {acc.name} — Current: {formatINR(acc.currentBalance)} {acc.currentBalanceType}
              </option>
            ))}
          </select>
        </div>

        {selectedAccount && (
          <div className="flex items-center gap-6 sm:border-l sm:border-divider sm:pl-6 text-right">
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
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Voucher Type</th>
                <th className="py-3 px-4">Particulars / Narration</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4 text-right">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {/* Opening balance row */}
              <tr className="bg-slate-50/50 font-semibold italic text-ink-secondary">
                <td className="py-2.5 px-4" colSpan={4}>Opening Balance Brought Forward</td>
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

              {lines.map((l, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(l.date)}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-brand">{l.voucherNumber}</td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <Badge variant="brand">{l.voucherType.replace(/_/g, ' ')}</Badge>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
