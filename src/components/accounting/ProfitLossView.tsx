import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { ProfitLossReport } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { downloadCSV, printElementById } from '../../utils/export';
import { Button } from '../common/Button';
import { TrendingUp, Download, Printer } from 'lucide-react';

export const ProfitLossView: React.FC = () => {
  const [report, setReport] = useState<ProfitLossReport>(dataService.getProfitAndLoss());

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setReport(dataService.getProfitAndLoss());
    });
  }, []);

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Profit & Loss Statement'],
      [`Period: ${report.fromDate} to ${report.toDate}`],
      ['Classification', 'Category', 'Amount (INR)'],
      ['Revenue', 'Aachi Sales Revenue', report.income.salesRevenue.toString()],
      ['Cost', 'Purchases & COGS', report.expenses.costOfGoodsSold.toString()],
      ['Gross Profit', 'Revenue minus Purchases', report.grossProfit.toString()],
      ['Operating Expense', 'Freight & Inward Transport', report.expenses.freightAndDelivery.toString()],
      ['Operating Expense', 'Delivery Van Fuel & Maintenance', report.expenses.operatingExpenses.toString()],
      ['Operating Expense', 'Staff Salaries & Incentives', report.expenses.salaryExpenses.toString()],
      ['Operating Expense', 'Warehouse Rent & Electricity', report.expenses.utilitiesAndRent.toString()],
      ['Total Operating Expenses', '', report.expenses.totalExpenses.toString()],
      ['Net Profit', '', report.netProfit.toString()]
    ];
    downloadCSV('Profit_and_Loss_Statement', csvData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" /> Profit & Loss Statement
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Financial Year 2026-27 performance derived from posted double-entry journals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => printElementById('printable-pnl', 'Profit and Loss Statement')}
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

      {/* P&L Statement Card */}
      <div id="printable-pnl" className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden text-xs">
        <div className="p-5 border-b border-divider bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-ink-primary">K7 Enterprise — Profit & Loss Account</h3>
            <p className="text-xs text-ink-secondary">For the Period: {formatDate(report.fromDate)} to {formatDate(report.toDate)}</p>
          </div>
          <span className="text-xs font-semibold text-brand">Aachi Distributor Thoothukudi</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Revenue */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pb-2 border-b border-divider">
              I. Sales Revenue & Income
            </h4>
            <div className="divide-y divide-divider/60 pt-1">
              <div className="py-2 flex justify-between">
                <span>Revenue from Aachi Product Sales</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.income.salesRevenue)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold bg-slate-50/70 px-2 rounded">
                <span>Total Income (A):</span>
                <span className="font-mono font-bold text-num text-emerald-700">{formatINR(report.income.totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Cost of Goods Sold */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pb-2 border-b border-divider">
              II. Cost of Goods Sold / Purchases
            </h4>
            <div className="divide-y divide-divider/60 pt-1">
              <div className="py-2 flex justify-between">
                <span>Purchases of Aachi Stock (C&F Depot Inwards)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.costOfGoodsSold)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold bg-slate-50/70 px-2 rounded">
                <span>Gross Profit (Income minus Cost):</span>
                <span className="font-mono font-bold text-num text-brand text-sm">{formatINR(report.grossProfit)}</span>
              </div>
            </div>
          </div>

          {/* Operating Expenses */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pb-2 border-b border-divider">
              III. Distribution & Operating Expenses
            </h4>
            <div className="divide-y divide-divider/60 pt-1 space-y-0.5">
              <div className="py-2 flex justify-between">
                <span>Delivery Van Fuel & Maintenance</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.operatingExpenses)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Freight & Inward Cartage</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.freightAndDelivery)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Staff Salaries & Sales Incentives</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.salaryExpenses)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span>Warehouse Godown Rent & Electricity</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.utilitiesAndRent)}</span>
              </div>
              <div className="py-2.5 flex justify-between font-bold bg-slate-50/70 px-2 rounded">
                <span>Total Operating Expenses (B):</span>
                <span className="font-mono font-bold text-num text-rose-700">{formatINR(report.expenses.totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit Summary */}
          <div className="p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between text-sm">
            <div>
              <p className="font-bold text-brand-900">Net Business Profit for Current Period:</p>
              <p className="text-xs text-brand-700">Carried forward to Proprietor Capital & Balance Sheet</p>
            </div>
            <div className="text-right">
              <p className="font-black text-xl font-mono text-brand text-num">{formatINR(report.netProfit)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
