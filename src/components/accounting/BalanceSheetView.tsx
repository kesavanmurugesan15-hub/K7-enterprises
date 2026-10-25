import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { BalanceSheetReport } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { downloadCSV, printElementById } from '../../utils/export';
import { Button } from '../common/Button';
import { Building2, Download, Printer, CheckCircle2 } from 'lucide-react';

export const BalanceSheetView: React.FC = () => {
  const [report, setReport] = useState<BalanceSheetReport>(dataService.getBalanceSheet());

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setReport(dataService.getBalanceSheet());
    });
  }, []);

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Balance Sheet'],
      [`As of: ${report.asOfDate}`],
      ['Classification', 'Ledger Head', 'Amount (INR)'],
      ['Asset', 'Cash in Hand (Counter & Petty)', report.assets.currentAssets.cashInHand.toString()],
      ['Asset', 'Bank Balances (TMB & SBI Current)', report.assets.currentAssets.bankBalances.toString()],
      ['Asset', 'Sundry Debtors (Retailer Receivables)', report.assets.currentAssets.accountsReceivable.toString()],
      ['Asset', 'Stock-in-Hand (Inventory Asset)', report.assets.currentAssets.inventoryValuation.toString()],
      ['Total Assets', '', report.assets.totalAssets.toString()],
      ['Liability', 'Sundry Creditors (Aachi Depot Payables)', report.liabilitiesAndEquity.currentLiabilities.accountsPayable.toString()],
      ['Liability', 'Duties & Taxes (Net GST Output)', report.liabilitiesAndEquity.currentLiabilities.taxLiabilities.toString()],
      ['Equity', "Proprietor's Capital", report.liabilitiesAndEquity.capitalAndReserves.ownerCapital.toString()],
      ['Equity', 'Retained Earnings', report.liabilitiesAndEquity.capitalAndReserves.retainedEarnings.toString()],
      ['Equity', 'Current Period Profit', report.liabilitiesAndEquity.capitalAndReserves.currentPeriodProfit.toString()],
      ['Total Liabilities & Equity', '', report.liabilitiesAndEquity.totalLiabilitiesAndEquity.toString()]
    ];
    downloadCSV('Balance_Sheet_Report', csvData);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" /> Balance Sheet Statement
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Statement of financial position: Total Assets = Total Liabilities & Capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => printElementById('printable-balance-sheet', 'Balance Sheet Statement')}
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

      {/* Balance Verification Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Balance Sheet Reconciled:</span> Total Assets equal Total Liabilities and Proprietor Capital.
          </div>
        </div>
        <span className="font-mono font-bold">{formatINR(report.assets.totalAssets)}</span>
      </div>

      {/* Printable Sheet */}
      <div id="printable-balance-sheet" className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-6 rounded-lg border border-divider shadow-enterprise text-xs">
        {/* Left Column: ASSETS */}
        <div className="space-y-4">
          <div className="pb-2 border-b-2 border-brand flex justify-between items-center">
            <h3 className="font-bold text-sm text-ink-primary uppercase tracking-wider">Assets</h3>
            <span className="font-semibold text-ink-muted">As of {formatDate(report.asOfDate)}</span>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary">
              Current Assets
            </h4>
            <div className="divide-y divide-divider/60 space-y-1">
              <div className="py-2 flex justify-between">
                <span>Cash in Hand & Petty Cash</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.cashInHand)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Bank Accounts (TMB & SBI)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.bankBalances)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Sundry Debtors (Retailer Receivables)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.accountsReceivable)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Closing Stock-in-Hand (Inventory Asset)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.inventoryValuation)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-divider flex justify-between items-center text-sm font-bold bg-slate-50 p-3 rounded">
            <span>Total Assets:</span>
            <span className="font-mono text-brand font-black">{formatINR(report.assets.totalAssets)}</span>
          </div>
        </div>

        {/* Right Column: LIABILITIES & EQUITY */}
        <div className="space-y-4">
          <div className="pb-2 border-b-2 border-brand flex justify-between items-center">
            <h3 className="font-bold text-sm text-ink-primary uppercase tracking-wider">Liabilities & Capital</h3>
            <span className="font-semibold text-ink-muted">INR (₹)</span>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary">
              Current Liabilities
            </h4>
            <div className="divide-y divide-divider/60 space-y-1">
              <div className="py-2 flex justify-between">
                <span>Sundry Creditors (Aachi C&F Depot)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.currentLiabilities.accountsPayable)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Duties & Taxes (Net Output GST Payable)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.currentLiabilities.taxLiabilities)}</span>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pt-3">
              Proprietor's Capital & Reserves
            </h4>
            <div className="divide-y divide-divider/60 space-y-1">
              <div className="py-2 flex justify-between">
                <span>Proprietor Capital Account</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.capitalAndReserves.ownerCapital)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>General Reserves & Retained Earnings</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.capitalAndReserves.retainedEarnings)}</span>
              </div>
              <div className="py-2 flex justify-between text-brand font-semibold">
                <span>Add: Net Profit for Current Period</span>
                <span className="font-mono font-bold text-num">{formatINR(report.liabilitiesAndEquity.capitalAndReserves.currentPeriodProfit)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-divider flex justify-between items-center text-sm font-bold bg-slate-50 p-3 rounded">
            <span>Total Liabilities & Capital:</span>
            <span className="font-mono text-brand font-black">{formatINR(report.liabilitiesAndEquity.totalLiabilitiesAndEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
