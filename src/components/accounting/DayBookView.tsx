import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { DayBookRow } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/date';
import { downloadCSV } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Download, Calendar, Search } from 'lucide-react';

export const DayBookView: React.FC = () => {
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [rows, setRows] = useState<DayBookRow[]>(dataService.getDayBook('2026-01-01', getTodayDateString()));

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setRows(dataService.getDayBook(fromDate, toDate));
    });
  }, [fromDate, toDate]);

  const handleFilter = () => {
    setRows(dataService.getDayBook(fromDate, toDate));
  };

  const handleExportCSV = () => {
    const csvData = [
      ['Date', 'Voucher Number', 'Voucher Type', 'Account Name', 'Debit (INR)', 'Credit (INR)', 'Narration'],
      ...rows.map(r => [
        r.date,
        r.voucherNumber,
        r.voucherType,
        r.accountName,
        r.debit.toString(),
        r.credit.toString(),
        r.narration
      ])
    ];
    downloadCSV(`DayBook_${fromDate}_to_${toDate}`, csvData);
  };

  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Day Book Register</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Chronological journal entries of all sales, purchases, collections, and payments.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export Day Book (CSV)
        </Button>
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 rounded-lg border border-divider text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
          <span className="font-semibold text-ink-secondary">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="p-1 border border-divider rounded"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink-secondary">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="p-1 border border-divider rounded"
          />
        </div>

        <Button variant="secondary" size="sm" onClick={handleFilter}>
          Apply Date Filter
        </Button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher #</th>
                <th className="py-3 px-4">Voucher Type</th>
                <th className="py-3 px-4">Ledger Account</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-ink-muted">
                    No transactions recorded for the selected period.
                  </td>
                </tr>
              ) : (
                rows.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-brand">{r.voucherNumber}</td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <Badge variant="brand">{r.voucherType.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-2.5 px-4 font-semibold">{r.accountName}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-num">
                      {r.debit > 0 ? formatINR(r.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-num">
                      {r.credit > 0 ? formatINR(r.credit) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-ink-secondary max-w-xs truncate">
                      {r.particulars}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-divider text-xs font-bold font-mono">
              <tr>
                <td colSpan={4} className="py-3 px-4 text-right font-sans">Period Total:</td>
                <td className="py-3 px-4 text-right text-brand">{formatINR(totalDebit)}</td>
                <td className="py-3 px-4 text-right text-brand">{formatINR(totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
