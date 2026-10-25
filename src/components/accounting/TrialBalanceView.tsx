import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import type { TrialBalanceReport } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { downloadCSV, printElementById } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Scale, Download, Printer, CheckCircle2, AlertTriangle } from 'lucide-react';

export const TrialBalanceView: React.FC = () => {
  const { settings } = useBusiness();
  const [report, setReport] = useState<TrialBalanceReport>(dataService.getTrialBalance());

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setReport(dataService.getTrialBalance());
    });
  }, []);

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Trial Balance Verification'],
      [`Generated: ${report.generatedAt}`],
      ['GL Code', 'Account Name', 'Account Type', 'Sub Group', 'Closing Debit (INR)', 'Closing Credit (INR)'],
      ...report.items.map(item => [
        item.accountCode,
        item.accountName,
        item.type,
        item.subGroup,
        item.closingDebit.toString(),
        item.closingCredit.toString()
      ]),
      ['Total', '', '', '', report.totalDebit.toString(), report.totalCredit.toString()]
    ];
    downloadCSV('K7_Enterprise_Trial_Balance', csvData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Scale className="w-5 h-5 text-brand" /> Trial Balance Verification
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Mathematical proof of double-entry ledger balance: Total Closing Debits = Total Closing Credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => printElementById('printable-trial-balance', 'K7 Enterprise Trial Balance')}
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export (CSV)
          </Button>
        </div>
      </div>

      {/* Balance Indicator Alert */}
      <div className={`p-4 rounded-lg border flex items-center justify-between ${
        report.isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center gap-3">
          {report.isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <p className="font-bold text-xs">
              {report.isBalanced
                ? 'Trial Balance Perfectly Reconciled (Debits = Credits)'
                : 'Imbalance Detected in Ledger'}
            </p>
            <p className="text-[11px] mt-0.5 opacity-90">
              Total Debits: <span className="font-mono font-bold">{formatINR(report.totalDebit)}</span> | Total Credits: <span className="font-mono font-bold">{formatINR(report.totalCredit)}</span>
            </p>
          </div>
        </div>

        <Badge variant={report.isBalanced ? 'success' : 'error'}>
          {report.isBalanced ? 'BALANCED' : 'IMBALANCE'}
        </Badge>
      </div>

      {/* Printable Report Table */}
      <div id="printable-trial-balance" className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="p-4 border-b border-divider bg-slate-50 flex items-center justify-between print-only">
          <div>
            <h3 className="font-bold text-base text-ink-primary">{settings.businessName || 'K7 Enterprise'} — Trial Balance</h3>
            <p className="text-xs text-ink-secondary">{settings.city || settings.district || 'Distribution Hub'} • FY {settings.financialYear || '2026-27'}</p>
          </div>
          <span className="text-xs text-ink-muted">As of: {formatDateTime(report.generatedAt)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Account Particulars</th>
                <th className="py-3 px-4">Primary Head</th>
                <th className="py-3 px-4 text-right">Debit Total (₹)</th>
                <th className="py-3 px-4 text-right">Credit Total (₹)</th>
                <th className="py-3 px-4 text-right">Closing Debit (₹)</th>
                <th className="py-3 px-4 text-right">Closing Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {report.items.map(it => (
                <tr key={it.accountId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-brand">{it.accountCode}</td>
                  <td className="py-2.5 px-4 font-semibold text-ink-primary">{it.accountName}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-[11px] font-medium text-ink-secondary">{it.type}</span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-num text-ink-secondary">
                    {formatINR(it.debitTotal)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-num text-ink-secondary">
                    {formatINR(it.creditTotal)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-num">
                    {it.closingDebit > 0 ? formatINR(it.closingDebit) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-num">
                    {it.closingCredit > 0 ? formatINR(it.closingCredit) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-divider text-xs font-black font-mono">
              <tr>
                <td colSpan={5} className="py-3 px-4 text-right font-sans text-sm">Balanced Grand Total:</td>
                <td className="py-3 px-4 text-right text-brand text-sm">{formatINR(report.totalDebit)}</td>
                <td className="py-3 px-4 text-right text-brand text-sm">{formatINR(report.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
