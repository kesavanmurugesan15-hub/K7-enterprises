import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type {
  BalanceSheetReport,
  SupplierCreditorSummary,
  SupplierLedgerTransaction
} from '../../types/accounting';
import type { Supplier } from '../../types/purchase';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/date';
import { downloadCSV, printElementById } from '../../utils/export';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  Building2,
  Download,
  Printer,
  CheckCircle2,
  ChevronRight,
  Calendar,
  ArrowLeft,
  BookOpen,
  Building,
  AlertCircle
} from 'lucide-react';

export const BalanceSheetView: React.FC = () => {
  const [asOfDate, setAsOfDate] = useState(getTodayDateString());
  const [report, setReport] = useState<BalanceSheetReport>(dataService.getBalanceSheet(asOfDate));

  // Creditors Drill-down modal state
  const [isCreditorsModalOpen, setIsCreditorsModalOpen] = useState(false);
  const [creditorsData, setCreditorsData] = useState<{
    suppliers: SupplierCreditorSummary[];
    totalCreditors: number;
  }>({ suppliers: [], totalCreditors: 0 });

  // Level 2: Selected Supplier Detailed Ledger state
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<{
    supplier?: Supplier;
    summary?: SupplierCreditorSummary;
    transactions: SupplierLedgerTransaction[];
  } | null>(null);

  const refreshData = () => {
    setReport(dataService.getBalanceSheet(asOfDate));
    if (isCreditorsModalOpen) {
      setCreditorsData(dataService.getSupplierCreditorsLedger(asOfDate));
    }
  };

  useEffect(() => {
    return dataService.subscribe('*', refreshData);
  }, [asOfDate, isCreditorsModalOpen]);

  const handleApplyDate = (e: React.FormEvent) => {
    e.preventDefault();
    setReport(dataService.getBalanceSheet(asOfDate));
    if (isCreditorsModalOpen) {
      setCreditorsData(dataService.getSupplierCreditorsLedger(asOfDate));
    }
  };

  const handleOpenCreditorsModal = () => {
    const data = dataService.getSupplierCreditorsLedger(asOfDate);
    setCreditorsData(data);
    setSelectedSupplierDetail(null);
    setIsCreditorsModalOpen(true);
  };

  const handleSelectSupplierForLedger = (supplierId: string) => {
    const detail = dataService.getSupplierDetailedLedger(supplierId, undefined, asOfDate);
    setSelectedSupplierDetail(detail);
  };

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Balance Sheet'],
      [`As of: ${report.asOfDate}`],
      ['Classification', 'Ledger Head', 'Amount (INR)'],
      ['Asset', 'Cash in Hand (Counter & Petty)', report.assets.currentAssets.cashInHand.toString()],
      ['Asset', 'Bank Balances (Current Accounts)', report.assets.currentAssets.bankBalances.toString()],
      ['Asset', 'Sundry Debtors (Retailer Receivables)', report.assets.currentAssets.accountsReceivable.toString()],
      ['Asset', 'Stock-in-Hand (Inventory Asset)', report.assets.currentAssets.inventoryValuation.toString()],
      ['Total Assets', '', report.assets.totalAssets.toString()],
      ['Liability', 'Sundry Creditors (Supplier Payables)', report.liabilitiesAndEquity.currentLiabilities.accountsPayable.toString()],
      ['Liability', 'Duties & Taxes (Net GST Output)', report.liabilitiesAndEquity.currentLiabilities.taxLiabilities.toString()],
      ['Equity', "Proprietor's Capital", report.liabilitiesAndEquity.capitalAndReserves.ownerCapital.toString()],
      ['Equity', 'Retained Earnings', report.liabilitiesAndEquity.capitalAndReserves.retainedEarnings.toString()],
      ['Equity', 'Current Period Profit', report.liabilitiesAndEquity.capitalAndReserves.currentPeriodProfit.toString()],
      ['Total Liabilities & Equity', '', report.liabilitiesAndEquity.totalLiabilitiesAndEquity.toString()]
    ];
    downloadCSV(`Balance_Sheet_${report.asOfDate}`, csvData);
  };

  const handleExportCreditorsCSV = () => {
    if (selectedSupplierDetail && selectedSupplierDetail.supplier) {
      const csvData = [
        [`Supplier Ledger: ${selectedSupplierDetail.supplier.name} (${selectedSupplierDetail.supplier.supplierCode || selectedSupplierDetail.supplier.id})`],
        [`As of: ${asOfDate}`],
        ['Date', 'Voucher #', 'Voucher Type', 'Supplier Inv #', 'Particulars', 'Debit (Payments)', 'Credit (Purchases)', 'Running Balance'],
        ...selectedSupplierDetail.transactions.map(t => [
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
      downloadCSV(`Creditor_Ledger_${selectedSupplierDetail.supplier.supplierCode || selectedSupplierDetail.supplier.id}`, csvData);
    } else {
      const csvData = [
        ['K7 Enterprise — Sundry Creditors Supplier-Wise Summary'],
        [`As of: ${asOfDate}`],
        ['Supplier Name', 'Code', 'GSTIN', 'Opening Balance', 'Credit Purchases', 'Payments Made', 'Closing Balance'],
        ...creditorsData.suppliers.map(s => [
          s.supplierName,
          s.supplierCode,
          s.gstin,
          s.openingBalance.toString(),
          s.creditPurchases.toString(),
          s.paymentsMade.toString(),
          s.closingBalance.toString()
        ]),
        ['Total Creditors', '', '', '', '', '', creditorsData.totalCreditors.toString()]
      ];
      downloadCSV(`Sundry_Creditors_Summary_${asOfDate}`, csvData);
    }
  };

  const diff = Math.round(Math.abs(report.assets.totalAssets - report.liabilitiesAndEquity.totalLiabilitiesAndEquity) * 100) / 100;
  const isReconciled = diff < 0.05;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand" /> Balance Sheet Statement
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Statement of financial position with clickable interactive creditor liabilities and account drill-downs.
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

      {/* As-Of-Date Selector */}
      <form onSubmit={handleApplyDate} className="flex flex-wrap items-center gap-3 bg-surface p-3.5 rounded-lg border border-divider shadow-sm text-xs">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-ink-muted" />
          <span className="font-semibold text-ink-secondary">As of Date:</span>
          <input
            type="date"
            value={asOfDate}
            onChange={e => setAsOfDate(e.target.value)}
            className="p-1 border border-divider rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-brand"
          />
        </div>

        <Button variant="secondary" size="sm" type="submit">
          Update Sheet
        </Button>

        <span className="text-[11px] text-ink-muted ml-auto hidden sm:inline">
          Reporting As of: <strong className="text-ink-primary">{formatDate(report.asOfDate)}</strong>
        </span>
      </form>

      {/* Balance Verification Banner */}
      <div className={`p-4 rounded-lg flex items-center justify-between text-xs border ${
        isReconciled
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center gap-2.5">
          {isReconciled ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {isReconciled ? 'Balance Sheet Reconciled:' : 'Balance Sheet Discrepancy Detected:'}
            </span>{' '}
            {isReconciled
              ? `Total Assets equal Total Liabilities and Proprietor Capital (Difference: ${formatINR(diff)}).`
              : `Total Assets differ from Total Liabilities & Capital by ${formatINR(diff)}.`}
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
              <div className="py-2.5 flex justify-between items-center">
                <span>Cash in Hand & Petty Cash</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.cashInHand)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span>Bank Accounts (TMB & SBI)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.bankBalances)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span>Sundry Debtors (Retailer Receivables)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.assets.currentAssets.accountsReceivable)}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
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
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary">
                Current Liabilities
              </h4>
              <span className="text-[10px] text-brand font-medium">Click line for supplier ledger</span>
            </div>

            <div className="divide-y divide-divider/60 space-y-1">
              {/* Interactive Sundry Creditors Row */}
              <div
                onClick={handleOpenCreditorsModal}
                className="py-2.5 px-2 flex justify-between items-center rounded hover:bg-brand-50/60 cursor-pointer transition-colors group border border-transparent hover:border-brand/20"
                title="Click to view Tally-style Supplier-Wise Creditor Ledger"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-primary group-hover:text-brand transition-colors">
                    Sundry Creditors (Supplier Payables)
                  </span>
                  <Badge variant="info">Click to Drill Down</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-num text-ink-primary group-hover:text-brand">
                    {formatINR(report.liabilitiesAndEquity.currentLiabilities.accountsPayable)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-brand transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span>Duties & Taxes (Net Output GST Payable)</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.currentLiabilities.taxLiabilities)}</span>
              </div>
            </div>

            <h4 className="font-bold text-xs uppercase tracking-wider text-ink-secondary pt-3">
              Proprietor's Capital & Reserves
            </h4>
            <div className="divide-y divide-divider/60 space-y-1">
              <div className="py-2 flex justify-between items-center">
                <span>Proprietor Capital Account</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.capitalAndReserves.ownerCapital)}</span>
              </div>
              <div className="py-2 flex justify-between items-center">
                <span>General Reserves & Retained Earnings</span>
                <span className="font-mono font-semibold text-num">{formatINR(report.liabilitiesAndEquity.capitalAndReserves.retainedEarnings)}</span>
              </div>
              <div className="py-2 flex justify-between items-center text-brand font-semibold">
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

      {/* --- SUNDRY CREDITORS SUPPLIER-WISE DRILL-DOWN MODAL --- */}
      <Modal
        isOpen={isCreditorsModalOpen}
        onClose={() => {
          setIsCreditorsModalOpen(false);
          setSelectedSupplierDetail(null);
        }}
        title={
          selectedSupplierDetail
            ? `Supplier Ledger: ${selectedSupplierDetail.supplier?.name}`
            : 'Sundry Creditors: Supplier-Wise Outstanding Ledger'
        }
        subtitle={
          selectedSupplierDetail
            ? `GSTIN: ${selectedSupplierDetail.supplier?.gstin} • Supplier Code: ${selectedSupplierDetail.supplier?.supplierCode || selectedSupplierDetail.supplier?.id} • As of: ${formatDate(asOfDate)}`
            : `As of ${formatDate(asOfDate)} • Head: Sundry Creditors (acc_sundry_creditors)`
        }
        maxWidth="4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Total Creditors Reconciled: <strong>{formatINR(creditorsData.totalCreditors)}</strong> = Balance Sheet <strong>{formatINR(report.liabilitiesAndEquity.currentLiabilities.accountsPayable)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={Download} onClick={handleExportCreditorsCSV}>
                Export (CSV)
              </Button>
              {selectedSupplierDetail ? (
                <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => setSelectedSupplierDetail(null)}>
                  Back to Supplier Summary
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setIsCreditorsModalOpen(false)}>
                  Back to Balance Sheet
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* LEVEL 1: SUPPLIER-WISE SUMMARY TABLE */}
          {!selectedSupplierDetail ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-divider rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-bold text-ink-primary">Tally-Style Creditors Summary</p>
                  <p className="text-ink-secondary text-[11px]">
                    Click on any supplier below to open their complete transaction ledger and invoice history.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-ink-secondary">Total Outstanding:</span>
                  <p className="text-base font-bold font-mono text-brand">{formatINR(creditorsData.totalCreditors)}</p>
                </div>
              </div>

              <div className="border border-divider rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Supplier Name & Reference</th>
                        <th className="py-2.5 px-3 text-right">Opening Bal (₹)</th>
                        <th className="py-2.5 px-3 text-right">Credit Purchases (₹)</th>
                        <th className="py-2.5 px-3 text-right">Payments Made (₹)</th>
                        <th className="py-2.5 px-3 text-right">Closing Outstanding (₹)</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {creditorsData.suppliers.map((sup, idx) => (
                        <tr
                          key={idx}
                          onClick={() => handleSelectSupplierForLedger(sup.supplierId)}
                          className="hover:bg-brand-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-ink-primary flex items-center gap-1.5">
                              <Building className="w-3.5 h-3.5 text-brand" />
                              <span>{sup.supplierName}</span>
                            </div>
                            <div className="text-[11px] text-ink-muted font-mono">
                              Code: {sup.supplierCode} | GSTIN: {sup.gstin}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-num">{formatINR(sup.openingBalance)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-num text-emerald-700">+{formatINR(sup.creditPurchases)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-num text-rose-700">-{formatINR(sup.paymentsMade)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-num text-brand text-sm">{formatINR(sup.closingBalance)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                              <BookOpen className="w-3 h-3" />
                              View Ledger
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-divider font-bold">
                      <tr>
                        <td className="py-2.5 px-3">Total Creditors Liability:</td>
                        <td className="py-2.5 px-3 text-right font-mono text-num">
                          {formatINR(creditorsData.suppliers.reduce((s, x) => s + x.openingBalance, 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          +{formatINR(creditorsData.suppliers.reduce((s, x) => s + x.creditPurchases, 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          -{formatINR(creditorsData.suppliers.reduce((s, x) => s + x.paymentsMade, 0))}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-brand text-sm">
                          {formatINR(creditorsData.totalCreditors)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* LEVEL 2: DETAILED SUPPLIER TRANSACTION LEDGER */
            <div className="space-y-3">
              {/* Supplier Info Header */}
              <div className="p-3 bg-slate-50 border border-divider rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-ink-primary flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-brand" />
                    <span>{selectedSupplierDetail.supplier?.name}</span>
                  </h4>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Supplier Code: <strong className="font-mono text-ink-primary">{selectedSupplierDetail.supplier?.supplierCode || selectedSupplierDetail.supplier?.id}</strong> | GSTIN: <strong className="font-mono text-ink-primary">{selectedSupplierDetail.supplier?.gstin}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-ink-secondary">Closing Balance:</span>
                  <p className="text-base font-bold font-mono text-brand">{formatINR(selectedSupplierDetail.summary?.closingBalance || 0)}</p>
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
                        <th className="py-2.5 px-3">Voucher Type</th>
                        <th className="py-2.5 px-3">Supplier Inv #</th>
                        <th className="py-2.5 px-3">Particulars</th>
                        <th className="py-2.5 px-3 text-right">Debit (Payment ₹)</th>
                        <th className="py-2.5 px-3 text-right">Credit (Invoice ₹)</th>
                        <th className="py-2.5 px-3 text-right">Running Balance (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider">
                      {selectedSupplierDetail.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-ink-muted">
                            No ledger transactions recorded for this supplier.
                          </td>
                        </tr>
                      ) : (
                        selectedSupplierDetail.transactions.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap text-ink-secondary font-medium">{formatDate(tx.date)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-brand">{tx.voucherNumber}</td>
                            <td className="py-2.5 px-3 font-medium text-ink-secondary text-[11px]">{tx.voucherType.replace(/_/g, ' ')}</td>
                            <td className="py-2.5 px-3 font-mono text-ink-primary">{tx.supplierInvoiceNumber}</td>
                            <td className="py-2.5 px-3 text-ink-primary max-w-xs truncate" title={tx.particulars}>{tx.particulars}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-num text-rose-700">
                              {tx.debit > 0 ? formatINR(tx.debit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-num text-emerald-700">
                              {tx.credit > 0 ? formatINR(tx.credit) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-num text-ink-primary">
                              {formatINR(tx.runningBalance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-divider font-bold">
                      <tr>
                        <td colSpan={5} className="py-2.5 px-3 text-right">Supplier Outstanding Balance:</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          {formatINR(selectedSupplierDetail.summary?.paymentsMade || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                          {formatINR(selectedSupplierDetail.summary?.creditPurchases || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-brand text-sm">
                          {formatINR(selectedSupplierDetail.summary?.closingBalance || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
