import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import type { BankAccount, BankStatement, BankStatementTransaction } from '../../types/bank';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { formatDate, formatDateTime, getTodayDateString } from '../../utils/date';
import { Landmark, Upload, Check, AlertTriangle, ArrowRight, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export const BankReconciliationView: React.FC = () => {
  const { currentUser } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(dataService.getBankAccounts());
  const [statements, setStatements] = useState<BankStatement[]>(dataService.getBankStatements());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sample CSV statement generator/importer state
  const [importFileName, setImportFileName] = useState('Bank_Statement_Import.csv');
  const [sampleTxLines, setSampleTxLines] = useState<string>(
`2026-04-05,UPI/33819201827/RETAIL_STORE,CR,3360.00,UTR-33819201827
2026-04-06,UPI/33991209384/SUPER_MARKET,CR,2016.00,UTR-33991209384
2026-04-07,NEFT/491021/SUPPLIER_DEPOT,DR,85400.00,CHQ-491021
2026-04-08,NEFT/VEHICLE_FUEL_EXPENSE,DR,1200.00,UTR-IOC-9912
2026-04-09,BANK_CHARGES_Q1,DR,29.50,BNK-CHG-01`
  );

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setBankAccounts(dataService.getBankAccounts());
      setStatements(dataService.getBankStatements());
    });
  }, []);

  const selectedBank = bankAccounts.find(b => b.id === selectedAccountId) || bankAccounts[0];

  const handleProcessImport = (e: React.FormEvent) => {
    e.preventDefault();
    const rows = sampleTxLines.trim().split('\n');
    const parsedTxs: Omit<BankStatementTransaction, 'id' | 'statementId' | 'matchStatus'>[] = [];

    for (const r of rows) {
      const parts = r.split(',');
      if (parts.length >= 5) {
        parsedTxs.push({
          transactionDate: parts[0].trim(),
          valueDate: parts[0].trim(),
          description: parts[1].trim(),
          type: parts[2].trim().toUpperCase() as 'CR' | 'DR',
          amount: parseFloat(parts[3].trim()),
          referenceNumber: parts[4].trim()
        });
      }
    }

    if (parsedTxs.length === 0) {
      alert('Could not parse transactions from CSV.');
      return;
    }

    dataService.importBankStatement(selectedBank.id, importFileName, parsedTxs, currentUser);
    setIsImportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Landmark className="w-5 h-5 text-brand" /> Bank Statement Reconciliation Workspace
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Import CSV bank statements, match against posted general ledger vouchers, and flag discrepancies.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Upload}
          onClick={() => setIsImportModalOpen(true)}
        >
          Import Bank Statement (CSV)
        </Button>
      </div>

      {/* Bank Account Selector Card */}
      {bankAccounts.length === 0 ? (
        <div className="py-10 text-center bg-surface rounded-lg border border-dashed border-divider">
          <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-ink-primary text-xs">No bank accounts configured yet</p>
          <p className="text-[11px] text-ink-secondary mt-1">
            Configure your commercial bank accounts in Business Settings to import statements and auto-reconcile transactions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bankAccounts.map(bank => {
            const isSelected = bank.id === selectedAccountId;
            return (
              <div
                key={bank.id}
                onClick={() => setSelectedAccountId(bank.id)}
                className={`p-4 rounded-lg border bg-surface transition-all cursor-pointer shadow-enterprise ${
                  isSelected ? 'border-brand ring-2 ring-brand-100 bg-brand-50/20' : 'border-divider hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-ink-primary">{bank.bankName}</h3>
                    <p className="text-xs text-ink-secondary">{bank.branch}</p>
                    <p className="text-xs font-mono text-ink-muted mt-1">A/c: {bank.accountNumber} • IFSC: {bank.ifscCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ink-secondary">Book Balance</p>
                    <p className="text-lg font-bold font-mono text-brand">{formatINR(bank.currentBookBalance || bank.currentBalance || 0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Imported Statements & Reconciliation Status */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="p-4 border-b border-divider bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-ink-primary uppercase tracking-wider">
            Statement Reconciliation History ({selectedBank?.bankName})
          </h3>
          <span className="text-xs text-ink-muted">GL Linked Account</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Statement File</th>
                <th className="py-3 px-4">Imported At</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Total Credits</th>
                <th className="py-3 px-4 text-right">Total Debits</th>
                <th className="py-3 px-4 text-center">Transactions</th>
                <th className="py-3 px-4 text-center">Auto-Matched</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {statements.filter(s => s.bankAccountId === selectedBank.id).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-ink-muted">
                    No bank statements imported for this account. Click "Import Bank Statement" to test automated reconciliation.
                  </td>
                </tr>
              ) : (
                statements.filter(s => s.bankAccountId === selectedBank.id).map(stmt => (
                  <tr key={stmt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink-primary flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-brand" />
                        <span>{stmt.fileName}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">By: {stmt.importedBy}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-ink-secondary">
                      {formatDateTime(stmt.importedAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-ink-secondary">
                      {formatDate(stmt.periodStart)} to {formatDate(stmt.periodEnd)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatINR(stmt.totalCredits)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatINR(stmt.totalDebits)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {stmt.totalTransactions}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-emerald-700 font-mono">
                        {stmt.matchedTransactions} / {stmt.totalTransactions}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={stmt.status === 'RECONCILED' ? 'success' : 'warning'}>
                        {stmt.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Statement Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Bank Statement CSV"
        subtitle={`Upload electronic statement for ${selectedBank?.bankName}`}
        maxWidth="xl"
      >
        <form onSubmit={handleProcessImport} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-ink-primary mb-1">Target Bank Account *</label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full p-2 border border-divider rounded bg-white text-xs font-semibold"
            >
              {bankAccounts.map(b => (
                <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} ({b.branch})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Statement File Name</label>
            <input
              type="text"
              required
              value={importFileName}
              onChange={e => setImportFileName(e.target.value)}
              className="w-full p-2 border border-divider rounded text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-ink-primary mb-1">
              Statement Data (CSV Format: Date, Particulars, CR/DR, Amount, Reference)
            </label>
            <textarea
              rows={6}
              required
              value={sampleTxLines}
              onChange={e => setSampleTxLines(e.target.value)}
              className="w-full p-2 border border-divider rounded font-mono text-xs"
            />
            <p className="text-[11px] text-ink-secondary mt-1">
              Supports standard bank export format. The reconciliation engine will cross-verify transactions against posted Receipts, Payments, and Invoices.
            </p>
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsImportModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Import & Auto-Reconcile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
