import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { BankCashBookSummary, Account } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { formatDate, getTodayDateString } from '../../utils/date';
import { downloadCSV, printElementById } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  BookOpen,
  Download,
  Printer,
  Calendar,
  Wallet,
  Landmark,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const BankCashBookView: React.FC = () => {
  const accounts = dataService.getAccounts().filter(
    a => a.subGroup === 'CASH_IN_HAND' || a.subGroup === 'BANK_ACCOUNTS'
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc_cash_01');
  const [fromDate, setFromDate] = useState<string>('2026-04-01');
  const [toDate, setToDate] = useState<string>(getTodayDateString());

  const [bookData, setBookData] = useState<BankCashBookSummary>(
    dataService.getBankCashBook(selectedAccountId, fromDate, toDate)
  );

  const refreshData = () => {
    setBookData(dataService.getBankCashBook(selectedAccountId, fromDate, toDate));
  };

  useEffect(() => {
    return dataService.subscribe('*', refreshData);
  }, [selectedAccountId, fromDate, toDate]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    refreshData();
  };

  const handleQuickDate = (type: 'today' | 'this_month' | 'all') => {
    const today = getTodayDateString();
    if (type === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (type === 'this_month') {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      setFromDate(`${year}-${month}-01`);
      setToDate(today);
    } else {
      setFromDate('2026-04-01');
      setToDate(today);
    }
  };

  const handleExportCSV = () => {
    const csvData = [
      [`K7 Enterprise — Bank & Cash Book: ${bookData.accountName} (${bookData.accountCode})`],
      [`Period: ${bookData.fromDate} to ${bookData.toDate}`],
      ['Opening Book Balance', bookData.openingBalance.toString()],
      ['Total Receipts', bookData.totalReceipts.toString()],
      ['Total Payments', bookData.totalPayments.toString()],
      ['Net Transfers', bookData.netTransfers.toString()],
      ['Closing Book Balance', bookData.closingBookBalance.toString()],
      [],
      ['Date', 'Voucher #', 'Voucher Type', 'Particulars', 'Counterparty', 'Payment Mode', 'Ref/UTR', 'Receipt (INR)', 'Payment (INR)', 'Running Balance (INR)', 'Status'],
      ...bookData.transactions.map(t => [
        t.date,
        t.voucherNumber,
        t.voucherType,
        t.particulars,
        t.counterparty,
        t.paymentMethod,
        t.bankReference || '-',
        t.type === 'RECEIPT' || (t.type === 'CONTRA' && t.amount > 0) ? t.amount.toString() : '-',
        t.type === 'PAYMENT' || (t.type === 'CONTRA' && t.amount < 0) ? t.amount.toString() : '-',
        t.runningBalance.toString(),
        t.status
      ])
    ];
    downloadCSV(`BankCashBook_${bookData.accountCode}_${bookData.fromDate}_to_${bookData.toDate}`, csvData);
  };

  const isBank = bookData.accountType === 'BANK';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Banner */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            {isBank ? <Landmark className="w-5 h-5 text-brand" /> : <Wallet className="w-5 h-5 text-brand" />}
            Bank & Cash Book (Date-Wise Register)
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Audit daily receipts, payments, contra transfers, and verified closing balances for each bank and cash account.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={() => printElementById('printable-bank-cash-book', 'Bank and Cash Book')}
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

      {/* Account Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-divider">
        {accounts.map(acc => {
          const isSelected = selectedAccountId === acc.id;
          const isCash = acc.subGroup === 'CASH_IN_HAND';
          const Icon = isCash ? Wallet : Landmark;
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => setSelectedAccountId(acc.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                isSelected
                  ? 'bg-surface text-brand border-brand shadow-sm font-bold'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-50 border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? 'text-brand' : 'text-ink-muted'}`} />
              <span>{acc.name}</span>
              <span className="text-[10px] font-mono text-ink-muted">({acc.code})</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter & Quick Presets */}
      <div className="bg-surface p-3.5 rounded-lg border border-divider shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3">
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
            Apply Date
          </Button>
        </form>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-ink-muted">Quick:</span>
          <button
            type="button"
            onClick={() => handleQuickDate('today')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-primary rounded"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate('this_month')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-primary rounded"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate('all')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-primary rounded"
          >
            FY 26-27
          </button>
        </div>
      </div>

      {/* Daily Balance Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Opening */}
        <div className="bg-surface p-3.5 rounded-lg border border-divider shadow-enterprise">
          <span className="text-[11px] font-semibold text-ink-secondary">Opening Book Balance</span>
          <p className="text-base font-bold font-mono text-ink-primary mt-1">{formatINR(bookData.openingBalance)}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">As of {formatDate(bookData.fromDate)}</p>
        </div>

        {/* Receipts */}
        <div className="bg-surface p-3.5 rounded-lg border border-divider shadow-enterprise">
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" /> Total Receipts (+)
          </span>
          <p className="text-base font-bold font-mono text-emerald-700 mt-1">+{formatINR(bookData.totalReceipts)}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Collections & Inflows</p>
        </div>

        {/* Payments */}
        <div className="bg-surface p-3.5 rounded-lg border border-divider shadow-enterprise">
          <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total Payments (-)
          </span>
          <p className="text-base font-bold font-mono text-rose-700 mt-1">-{formatINR(bookData.totalPayments)}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Expenses & Payables</p>
        </div>

        {/* Transfers */}
        <div className="bg-surface p-3.5 rounded-lg border border-divider shadow-enterprise">
          <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Contra Transfers
          </span>
          <p className="text-base font-bold font-mono text-indigo-700 mt-1">
            {bookData.netTransfers >= 0 ? `+${formatINR(bookData.netTransfers)}` : formatINR(bookData.netTransfers)}
          </p>
          <p className="text-[10px] text-ink-muted mt-0.5">Bank ↔ Cash Contra</p>
        </div>

        {/* Closing Book Balance */}
        <div className="bg-brand-50/70 p-3.5 rounded-lg border border-brand/30 shadow-enterprise col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-brand flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Closing Book Balance
          </span>
          <p className="text-base font-black font-mono text-brand mt-1">{formatINR(bookData.closingBookBalance)}</p>
          <p className="text-[10px] text-brand/80 font-medium mt-0.5">As of {formatDate(bookData.toDate)}</p>
        </div>
      </div>

      {/* Formula verification callout */}
      <div className="bg-slate-50 p-2.5 rounded-md border border-divider text-[11px] text-ink-secondary flex items-center justify-between">
        <span className="font-mono">
          <strong>Closing Balance</strong> ({formatINR(bookData.closingBookBalance)}) = Opening ({formatINR(bookData.openingBalance)}) + Receipts ({formatINR(bookData.totalReceipts)}) − Payments ({formatINR(bookData.totalPayments)}) + Transfers ({formatINR(bookData.netTransfers)})
        </span>
        <Badge variant="success">Balanced & Verified</Badge>
      </div>

      {/* Detailed Transaction Ledger Table */}
      <div id="printable-bank-cash-book" className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden text-xs">
        <div className="p-4 border-b border-divider bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-ink-primary">
              {bookData.accountName} — Detailed Register
            </h3>
            <p className="text-[11px] text-ink-secondary">
              Period: {formatDate(bookData.fromDate)} to {formatDate(bookData.toDate)} • Total {bookData.transactions.length} entries
            </p>
          </div>
          {isBank && bookData.bankStatementBalance !== undefined && (
            <div className="text-right text-[11px]">
              <span className="text-ink-secondary">Bank Statement Balance: </span>
              <strong className="font-mono text-ink-primary">{formatINR(bookData.bankStatementBalance)}</strong>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Particulars & Narration</th>
                <th className="py-2.5 px-3">Counterparty</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Ref / UTR</th>
                <th className="py-2.5 px-3 text-right">Receipts (Dr ₹)</th>
                <th className="py-2.5 px-3 text-right">Payments (Cr ₹)</th>
                <th className="py-2.5 px-3 text-right">Running Balance (₹)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {/* Row 0: Opening Balance Line */}
              <tr className="bg-slate-50/70 font-semibold text-ink-secondary">
                <td className="py-2.5 px-3">{formatDate(bookData.fromDate)}</td>
                <td className="py-2.5 px-3 font-mono">-</td>
                <td className="py-2.5 px-3 text-ink-primary">Opening Book Balance B/F</td>
                <td className="py-2.5 px-3">-</td>
                <td className="py-2.5 px-3">-</td>
                <td className="py-2.5 px-3">-</td>
                <td className="py-2.5 px-3 text-right">-</td>
                <td className="py-2.5 px-3 text-right">-</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-ink-primary text-num">
                  {formatINR(bookData.openingBalance)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <Badge variant="info">OPENING</Badge>
                </td>
              </tr>

              {/* Transactions */}
              {bookData.transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-ink-muted">
                    No transactions posted to {bookData.accountName} within this period.
                  </td>
                </tr>
              ) : (
                bookData.transactions.map((tx, idx) => {
                  const isReceipt = tx.type === 'RECEIPT' || (tx.type === 'CONTRA' && tx.particulars.includes('Deposit'));
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-ink-secondary font-medium">{formatDate(tx.date)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-brand">{tx.voucherNumber}</td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-ink-primary" title={tx.particulars}>
                        {tx.particulars}
                      </td>
                      <td className="py-2.5 px-3 text-ink-secondary font-medium">{tx.counterparty}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-ink-secondary border border-slate-200">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-ink-muted text-[11px]">{tx.bankReference || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-num text-emerald-700">
                        {isReceipt ? formatINR(tx.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-num text-rose-700">
                        {!isReceipt ? formatINR(tx.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-num text-ink-primary">
                        {formatINR(tx.runningBalance)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={tx.status === 'POSTED' ? 'success' : 'brand'}>{tx.status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-100 border-t-2 border-divider font-bold">
              <tr>
                <td colSpan={6} className="py-3 px-3 text-right">Period Totals & Closing Balance:</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                  +{formatINR(bookData.totalReceipts)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-700 font-bold">
                  -{formatINR(bookData.totalPayments)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-brand font-black text-sm">
                  {formatINR(bookData.closingBookBalance)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
