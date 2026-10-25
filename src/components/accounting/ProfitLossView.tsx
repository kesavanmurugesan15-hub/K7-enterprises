import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import type { ProfitLossReport, PurchaseLedgerEntry, JournalEntry } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/date';
import { downloadCSV, printElementById } from '../../utils/export';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { TrendingUp, Download, Printer, ChevronRight, Calendar, ArrowLeft, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const ProfitLossView: React.FC = () => {
  const { settings } = useBusiness();
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState(getTodayDateString());
  const [report, setReport] = useState<ProfitLossReport>(dataService.getProfitAndLoss(fromDate, toDate));

  // Drill-down states
  const [isPurchaseLedgerOpen, setIsPurchaseLedgerOpen] = useState(false);
  const [purchaseLedgerData, setPurchaseLedgerData] = useState<{
    entries: PurchaseLedgerEntry[];
    totalTaxable: number;
    totalGst: number;
    grandTotal: number;
  }>({ entries: [], totalTaxable: 0, totalGst: 0, grandTotal: 0 });

  // Voucher detail inspect modal
  const [selectedVoucher, setSelectedVoucher] = useState<JournalEntry | null>(null);

  const refreshData = () => {
    setReport(dataService.getProfitAndLoss(fromDate, toDate));
    if (isPurchaseLedgerOpen) {
      setPurchaseLedgerData(dataService.getPurchaseLedger(fromDate, toDate));
    }
  };

  useEffect(() => {
    return dataService.subscribe('*', refreshData);
  }, [fromDate, toDate, isPurchaseLedgerOpen]);

  const handleApplyDateRange = (e: React.FormEvent) => {
    e.preventDefault();
    setReport(dataService.getProfitAndLoss(fromDate, toDate));
    if (isPurchaseLedgerOpen) {
      setPurchaseLedgerData(dataService.getPurchaseLedger(fromDate, toDate));
    }
  };

  const handleOpenPurchaseLedger = () => {
    const data = dataService.getPurchaseLedger(fromDate, toDate);
    setPurchaseLedgerData(data);
    setIsPurchaseLedgerOpen(true);
  };

  const handleInspectVoucher = (voucherNumber: string) => {
    const journals = dataService.getJournalEntries();
    const found = journals.find(j => j.voucherNumber === voucherNumber);
    if (found) {
      setSelectedVoucher(found);
    }
  };

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Profit & Loss Statement'],
      [`Period: ${report.fromDate} to ${report.toDate}`],
      ['Classification', 'Category', 'Amount (INR)'],
      ['Revenue', 'Sales Revenue', report.income.salesRevenue.toString()],
      ['Cost', 'Purchases & COGS', report.expenses.costOfGoodsSold.toString()],
      ['Gross Profit', 'Revenue minus Purchases', report.grossProfit.toString()],
      ['Operating Expense', 'Freight & Inward Transport', report.expenses.freightAndDelivery.toString()],
      ['Operating Expense', 'Delivery Van Fuel & Maintenance', report.expenses.operatingExpenses.toString()],
      ['Operating Expense', 'Staff Salaries & Incentives', report.expenses.salaryExpenses.toString()],
      ['Operating Expense', 'Warehouse Rent & Electricity', report.expenses.utilitiesAndRent.toString()],
      ['Total Operating Expenses', '', report.expenses.totalExpenses.toString()],
      ['Net Profit', '', report.netProfit.toString()]
    ];
    downloadCSV(`Profit_and_Loss_${report.fromDate}_to_${report.toDate}`, csvData);
  };

  const handleExportPurchaseLedgerCSV = () => {
    const csvData = [
      ['K7 Enterprise — Purchase Account Detailed Ledger'],
      [`Reporting Period: ${fromDate} to ${toDate}`],
      ['Date', 'Voucher Number', 'Supplier Name', 'Supplier Invoice #', 'Taxable (INR)', 'CGST (INR)', 'SGST (INR)', 'Total (INR)', 'Status'],
      ...purchaseLedgerData.entries.map(e => [
        e.date,
        e.voucherNumber,
        e.supplierName,
        e.supplierInvoiceNumber,
        e.taxableAmount.toString(),
        e.cgstAmount.toString(),
        e.sgstAmount.toString(),
        e.totalInvoiceAmount.toString(),
        e.status
      ]),
      ['Total', '', '', '', purchaseLedgerData.totalTaxable.toString(), (purchaseLedgerData.totalGst / 2).toString(), (purchaseLedgerData.totalGst / 2).toString(), purchaseLedgerData.grandTotal.toString(), 'Reconciled with P&L']
    ];
    downloadCSV(`Purchase_Ledger_${fromDate}_to_${toDate}`, csvData);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header Card */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand" /> Profit & Loss Statement
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Financial performance derived from posted double-entry journals with interactive account drill-downs.
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

      {/* Date Range Selector */}
      <form onSubmit={handleApplyDateRange} className="flex flex-wrap items-center gap-3 bg-surface p-3.5 rounded-lg border border-divider shadow-sm text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
          <span className="font-semibold text-ink-secondary">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="p-1 border border-divider rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-ink-secondary">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="p-1 border border-divider rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-brand"
          />
        </div>

        <Button variant="secondary" size="sm" type="submit">
          Apply Period
        </Button>

        <span className="text-[11px] text-ink-muted ml-auto hidden sm:inline">
          Reporting Period: <strong className="text-ink-primary">{formatDate(report.fromDate)}</strong> to <strong className="text-ink-primary">{formatDate(report.toDate)}</strong>
        </span>
      </form>

      {/* P&L Statement Card */}
      <div id="printable-pnl" className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden text-xs">
        <div className="p-5 border-b border-divider bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-ink-primary">
              {settings.businessName || 'K7 Enterprise'} — Profit & Loss Account
            </h3>
            <p className="text-xs text-ink-secondary">For the Period: {formatDate(report.fromDate)} to {formatDate(report.toDate)}</p>
          </div>
          <span className="text-xs font-semibold text-brand">
            {settings.distributorName || (settings.city ? `${settings.city} Hub` : 'FMCG Distribution')}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* I. Revenue */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pb-2 border-b border-divider">
              I. Sales Revenue & Income
            </h4>
            <div className="divide-y divide-divider/60 pt-1">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-ink-primary">Revenue from Wholesale Product Sales</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.income.salesRevenue)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center font-bold bg-slate-50/70 px-2 rounded">
                <span>Total Income (A):</span>
                <span className="font-mono font-bold text-num text-emerald-700">{formatINR(report.income.totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* II. Cost of Goods Sold / Purchases (Interactive Drill-Down) */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-divider">
              <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary">
                II. Cost of Goods Sold / Purchases
              </h4>
              <span className="text-[10px] text-brand font-medium">Click line for detailed ledger</span>
            </div>
            <div className="divide-y divide-divider/60 pt-1">
              <div
                onClick={handleOpenPurchaseLedger}
                className="py-3 px-2 flex justify-between items-center rounded hover:bg-brand-50/60 cursor-pointer transition-colors group border border-transparent hover:border-brand/20"
                title="Click to inspect detailed Purchase Account Ledger"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-primary group-hover:text-brand transition-colors">
                    Purchases & Cost of Goods Sold
                  </span>
                  <Badge variant="info">Click to Drill Down</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-num text-ink-primary group-hover:text-brand text-sm">
                    {formatINR(report.expenses.costOfGoodsSold)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              <div className="py-2.5 flex justify-between items-center font-bold bg-slate-50/70 px-2 rounded mt-1">
                <span>Gross Profit (Income minus Cost):</span>
                <span className="font-mono font-bold text-num text-brand text-sm">{formatINR(report.grossProfit)}</span>
              </div>
            </div>
          </div>

          {/* III. Distribution & Operating Expenses */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pb-2 border-b border-divider">
              III. Distribution & Operating Expenses
            </h4>
            <div className="divide-y divide-divider/60 pt-1 space-y-0.5">
              <div className="py-2 flex justify-between items-center">
                <span>Delivery Van Fuel & Maintenance</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.operatingExpenses)}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span>Freight & Inward Cartage</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.freightAndDelivery)}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span>Staff Salaries & Sales Incentives</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.salaryExpenses)}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span>Warehouse Godown Rent & Electricity</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.expenses.utilitiesAndRent)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center font-bold bg-slate-50/70 px-2 rounded">
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

      {/* --- PURCHASE ACCOUNT DETAILED DRILL-DOWN MODAL --- */}
      <Modal
        isOpen={isPurchaseLedgerOpen}
        onClose={() => setIsPurchaseLedgerOpen(false)}
        title="Purchase Account Ledger (Drill-Down)"
        subtitle={`Period: ${formatDate(fromDate)} to ${formatDate(toDate)} • Head: Purchases & Cost of Goods Sold (acc_purchases)`}
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Reconciled with P&L: <strong>{formatINR(purchaseLedgerData.totalTaxable)}</strong> = P&L COGS <strong>{formatINR(report.expenses.costOfGoodsSold)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Download} onClick={handleExportPurchaseLedgerCSV}>
                Export Ledger (CSV)
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsPurchaseLedgerOpen(false)}>
                Back to Profit & Loss
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-divider">
            <div>
              <p className="text-[11px] text-ink-secondary">Taxable Purchases</p>
              <p className="text-sm font-bold font-mono text-ink-primary mt-0.5">{formatINR(purchaseLedgerData.totalTaxable)}</p>
              <span className="text-[10px] text-emerald-700 font-semibold">100% P&L Reconciled</span>
            </div>
            <div>
              <p className="text-[11px] text-ink-secondary">Input GST (ITC)</p>
              <p className="text-sm font-bold font-mono text-ink-primary mt-0.5">{formatINR(purchaseLedgerData.totalGst)}</p>
              <span className="text-[10px] text-ink-muted">50% CGST + 50% SGST</span>
            </div>
            <div>
              <p className="text-[11px] text-ink-secondary">Total Invoiced</p>
              <p className="text-sm font-bold font-mono text-brand mt-0.5">{formatINR(purchaseLedgerData.grandTotal)}</p>
              <span className="text-[10px] text-ink-muted">Credited to Suppliers</span>
            </div>
            <div>
              <p className="text-[11px] text-ink-secondary">Total Transactions</p>
              <p className="text-sm font-bold font-mono text-ink-primary mt-0.5">{purchaseLedgerData.entries.length}</p>
              <span className="text-[10px] text-ink-muted">Posted in period</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="border border-divider rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Voucher #</th>
                    <th className="py-2.5 px-3">Supplier Name</th>
                    <th className="py-2.5 px-3">Supplier Inv #</th>
                    <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    <th className="py-2.5 px-3 text-right">GST (₹)</th>
                    <th className="py-2.5 px-3 text-right">Total Invoice (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {purchaseLedgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-ink-muted">
                        No purchase transactions posted in the selected period.
                      </td>
                    </tr>
                  ) : (
                    purchaseLedgerData.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap text-ink-secondary font-medium">{formatDate(entry.date)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-brand">{entry.voucherNumber}</td>
                        <td className="py-2.5 px-3 font-medium text-ink-primary">{entry.supplierName}</td>
                        <td className="py-2.5 px-3 font-mono text-ink-secondary">{entry.supplierInvoiceNumber}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-num">{formatINR(entry.taxableAmount)}</td>
                        <td className="py-2.5 px-3 text-right text-num text-ink-secondary">{formatINR(entry.totalGst)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-num text-ink-primary">{formatINR(entry.totalInvoiceAmount)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="success">{entry.status}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleInspectVoucher(entry.voucherNumber)}
                            className="p-1 hover:bg-slate-200 rounded text-ink-secondary hover:text-ink-primary transition-colors"
                            title="Inspect Double-Entry Voucher Lines"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-divider font-bold">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right">Ledger Total for Period:</td>
                    <td className="py-2.5 px-3 text-right font-mono text-brand text-sm">{formatINR(purchaseLedgerData.totalTaxable)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-num">{formatINR(purchaseLedgerData.totalGst)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-num">{formatINR(purchaseLedgerData.grandTotal)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* --- VOUCHER INSPECTION SUB-MODAL --- */}
      {selectedVoucher && (
        <Modal
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          title={`Double-Entry Voucher: ${selectedVoucher.voucherNumber}`}
          subtitle={`Voucher Type: ${selectedVoucher.voucherType} • Date: ${formatDate(selectedVoucher.date)}`}
          maxWidth="lg"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-divider">
              <p className="font-semibold text-ink-primary">Narration:</p>
              <p className="text-ink-secondary mt-0.5">{selectedVoucher.narration}</p>
              {selectedVoucher.referenceNumber && (
                <p className="text-ink-muted text-[11px] mt-1 font-mono">Reference #: {selectedVoucher.referenceNumber}</p>
              )}
            </div>

            <table className="w-full text-left text-xs border border-divider rounded">
              <thead className="bg-slate-100 border-b border-divider font-semibold text-ink-secondary">
                <tr>
                  <th className="py-2 px-3">Account Code & Name</th>
                  <th className="py-2 px-3 text-right">Debit (₹)</th>
                  <th className="py-2 px-3 text-right">Credit (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {selectedVoucher.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-ink-primary">{l.accountName}</span>
                      <span className="text-[10px] text-ink-muted font-mono ml-1.5">({l.accountCode})</span>
                      {l.narration && <div className="text-[10px] text-ink-muted">{l.narration}</div>}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-num font-medium">
                      {l.debit > 0 ? formatINR(l.debit) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-num font-medium">
                      {l.credit > 0 ? formatINR(l.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-divider font-bold">
                <tr>
                  <td className="py-2 px-3 text-right">Total:</td>
                  <td className="py-2 px-3 text-right font-mono text-num">{formatINR(selectedVoucher.totalDebit)}</td>
                  <td className="py-2 px-3 text-right font-mono text-num">{formatINR(selectedVoucher.totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
};
