import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { CustomerCreditProfile, SupplierCreditorProfile } from '../../types/credit';
import { formatINR } from '../../utils/currency';
import { downloadCSV } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Clock, Download, Store, Building, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import clsx from 'clsx';

export const CustomerAgeingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'debtors' | 'creditors'>('debtors');
  const [debtorProfiles, setDebtorProfiles] = useState<CustomerCreditProfile[]>(dataService.getCustomerCreditProfiles());
  const [creditorProfiles, setCreditorProfiles] = useState<SupplierCreditorProfile[]>(dataService.getSupplierCreditorProfiles());
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    setDebtorProfiles(dataService.getCustomerCreditProfiles());
    setCreditorProfiles(dataService.getSupplierCreditorProfiles());
  };

  useEffect(() => {
    const unsub = dataService.subscribe('*', refreshData);
    return () => unsub();
  }, []);

  // Debtors Summary
  const totalDebtorReceivables = debtorProfiles.reduce((sum, p) => sum + p.currentOutstanding, 0);
  const debtorCurrent = debtorProfiles.reduce((s, p) => s + p.ageing.current_0_30, 0);
  const debtor30to60 = debtorProfiles.reduce((s, p) => s + p.ageing.days_31_60, 0);
  const debtor60plus = debtorProfiles.reduce((s, p) => s + p.ageing.days_61_90 + p.ageing.days_90_plus, 0);

  // Creditors Summary
  const totalCreditorPayables = creditorProfiles.reduce((sum, p) => sum + p.currentPayable, 0);
  const creditorCurrent = creditorProfiles.reduce((s, p) => s + p.ageing.current_0_30, 0);
  const creditor30to60 = creditorProfiles.reduce((s, p) => s + p.ageing.days_31_60, 0);
  const creditor60plus = creditorProfiles.reduce((s, p) => s + p.ageing.days_61_90 + p.ageing.days_90_plus, 0);

  const filteredDebtors = debtorProfiles.filter(p =>
    p.retailerShopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCreditors = creditorProfiles.filter(p =>
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.supplierCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const handleExportCSV = () => {
    if (activeTab === 'debtors') {
      const csvData = [
        ['K7 Enterprise — Sundry Debtors (Receivables) Ageing & Credit Analysis'],
        ['Retailer Shop', 'Credit Limit (INR)', 'Current Outstanding (INR)', 'Available Credit (INR)', '0-30 Days (INR)', '31-60 Days (INR)', '61-90 Days (INR)', '90+ Days (INR)'],
        ...debtorProfiles.map(p => [
          p.retailerShopName,
          p.creditLimit.toString(),
          p.currentOutstanding.toString(),
          p.availableCredit.toString(),
          p.ageing.current_0_30.toString(),
          p.ageing.days_31_60.toString(),
          p.ageing.days_61_90.toString(),
          p.ageing.days_90_plus.toString()
        ])
      ];
      downloadCSV('Sundry_Debtors_Receivables_Ageing', csvData);
    } else {
      const csvData = [
        ['K7 Enterprise — Sundry Creditors (Payables) Ageing & Bills Analysis'],
        ['Supplier Name', 'Supplier Code', 'City', 'Phone', 'GSTIN', 'Total Purchases (INR)', 'Total Paid (INR)', 'Current Payable (INR)', '0-30 Days (INR)', '31-60 Days (INR)', '61-90 Days (INR)', '90+ Days (INR)'],
        ...creditorProfiles.map(p => [
          p.supplierName,
          p.supplierCode,
          p.city,
          p.phone,
          p.gstin,
          p.totalPurchased.toString(),
          p.totalPaid.toString(),
          p.currentPayable.toString(),
          p.ageing.current_0_30.toString(),
          p.ageing.days_31_60.toString(),
          p.ageing.days_61_90.toString(),
          p.ageing.days_90_plus.toString()
        ])
      ];
      downloadCSV('Sundry_Creditors_Payables_Ageing', csvData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand" /> Debtors & Creditors Ageing Analysis
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time ageing schedules (0-30, 31-60, 61-90, 90+ days) for both trade receivables (debtors) and bills payable (creditors).
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export {activeTab === 'debtors' ? 'Receivables' : 'Payables'} Ageing (CSV)
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-divider">
        <button
          type="button"
          onClick={() => {
            setActiveTab('debtors');
            setSearchQuery('');
          }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px',
            activeTab === 'debtors'
              ? 'border-brand text-brand bg-brand/5'
              : 'border-transparent text-ink-secondary hover:text-ink-primary'
          )}
        >
          <Store className="w-4 h-4" />
          <span>Debtors Ageing (Receivables)</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-ink-secondary rounded-full text-[10px]">
            {debtorProfiles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('creditors');
            setSearchQuery('');
          }}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px',
            activeTab === 'creditors'
              ? 'border-brand text-brand bg-brand/5'
              : 'border-transparent text-ink-secondary hover:text-ink-primary'
          )}
        >
          <Building className="w-4 h-4" />
          <span>Creditors Ageing (Payables)</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-ink-secondary rounded-full text-[10px]">
            {creditorProfiles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DEBTORS AGEING */}
      {activeTab === 'debtors' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Total Receivables</p>
              <p className="text-xl font-bold text-ink-primary font-mono mt-1">{formatINR(totalDebtorReceivables)}</p>
              <p className="text-[11px] text-ink-muted mt-1">Across all retail accounts</p>
            </div>

            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Current (0-30 Days)</p>
              <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
                {formatINR(debtorCurrent)}
              </p>
              <p className="text-[11px] text-ink-muted mt-1">Within standard credit terms</p>
            </div>

            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Overdue (31-60 Days)</p>
              <p className="text-xl font-bold text-amber-700 font-mono mt-1">
                {formatINR(debtor30to60)}
              </p>
              <p className="text-[11px] text-ink-muted mt-1">Requires follow-up</p>
            </div>

            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Critical Overdue (60+ Days)</p>
              <p className="text-xl font-bold text-rose-700 font-mono mt-1">
                {formatINR(debtor60plus)}
              </p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">Hold further dispatches</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search debtor / retailer name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Ageing Table */}
          <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Debtor / Retailer Shop</th>
                    <th className="py-3 px-4 text-right">Credit Limit</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                    <th className="py-3 px-4 text-right">Available Credit</th>
                    <th className="py-3 px-4 text-right">0–30 Days (Current)</th>
                    <th className="py-3 px-4 text-right">31–60 Days</th>
                    <th className="py-3 px-4 text-right">61–90 Days</th>
                    <th className="py-3 px-4 text-right">90+ Days</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider/70 text-ink-primary font-mono text-[11px]">
                  {filteredDebtors.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-ink-muted font-sans text-xs">
                        No debtor records found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredDebtors.map(p => (
                      <tr key={p.retailerId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-ink-primary text-xs">
                          {p.retailerShopName}
                          <div className="text-[10px] text-ink-muted">{p.creditDays} Days Term</div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-num">
                          {formatINR(p.creditLimit)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-num text-rose-700">
                          {formatINR(p.currentOutstanding)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-num text-emerald-700">
                          {formatINR(p.availableCredit)}
                        </td>
                        <td className="py-3 px-4 text-right text-num">
                          {p.ageing.current_0_30 > 0 ? formatINR(p.ageing.current_0_30) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-num text-amber-700">
                          {p.ageing.days_31_60 > 0 ? formatINR(p.ageing.days_31_60) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-num text-rose-600">
                          {p.ageing.days_61_90 > 0 ? formatINR(p.ageing.days_61_90) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-num text-rose-800">
                          {p.ageing.days_90_plus > 0 ? formatINR(p.ageing.days_90_plus) : '-'}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {p.isCreditExceeded ? (
                            <Badge variant="error">Credit Limit Exceeded</Badge>
                          ) : (
                            <Badge variant="success">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREDITORS AGEING */}
      {activeTab === 'creditors' && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Total Bills Payable</p>
              <p className="text-xl font-bold text-ink-primary font-mono mt-1">{formatINR(totalCreditorPayables)}</p>
              <p className="text-[11px] text-ink-muted mt-1">Across all supplier vendor accounts</p>
            </div>

            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Current (0-30 Days)</p>
              <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
                {formatINR(creditorCurrent)}
              </p>
              <p className="text-[11px] text-ink-muted mt-1">Within standard payment terms</p>
            </div>

            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Overdue (31-60 Days)</p>
              <p className="text-xl font-bold text-amber-700 font-mono mt-1">
                {formatINR(creditor30to60)}
              </p>
              <p className="text-[11px] text-ink-muted mt-1">Pending disbursement</p>
            </div>

            <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
              <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Critical Overdue (60+ Days)</p>
              <p className="text-xl font-bold text-rose-700 font-mono mt-1">
                {formatINR(creditor60plus)}
              </p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">Prioritise settlement</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex justify-end">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search creditor / supplier name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* Ageing Table */}
          <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Creditor / Supplier Name</th>
                    <th className="py-3 px-4">Contact & Phone</th>
                    <th className="py-3 px-4 text-right">Total Purchases</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4 text-right">0–30 Days (Current)</th>
                    <th className="py-3 px-4 text-right">31–60 Days</th>
                    <th className="py-3 px-4 text-right">61–90 Days</th>
                    <th className="py-3 px-4 text-right">90+ Days</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider/70 text-ink-primary font-mono text-[11px]">
                  {filteredCreditors.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-ink-muted font-sans text-xs">
                        No creditor records found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredCreditors.map(p => (
                      <tr key={p.supplierId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-sans font-semibold text-ink-primary text-xs">
                          {p.supplierName}
                          <div className="text-[10px] text-ink-muted font-mono">{p.supplierCode} | {p.city}</div>
                        </td>
                        <td className="py-3 px-4 font-sans text-ink-secondary text-xs">
                          {p.contactPerson}
                          <div className="text-[10px] text-ink-muted font-mono">{p.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-num text-blue-700">
                          {formatINR(p.totalPurchased)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-num text-emerald-700">
                          {formatINR(p.totalPaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-num text-rose-700">
                          {formatINR(p.currentPayable)}
                        </td>
                        <td className="py-3 px-4 text-right text-num">
                          {p.ageing.current_0_30 > 0 ? formatINR(p.ageing.current_0_30) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-num text-amber-700">
                          {p.ageing.days_31_60 > 0 ? formatINR(p.ageing.days_31_60) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-num text-rose-600">
                          {p.ageing.days_61_90 > 0 ? formatINR(p.ageing.days_61_90) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-num text-rose-800">
                          {p.ageing.days_90_plus > 0 ? formatINR(p.ageing.days_90_plus) : '-'}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {p.currentPayable > 0 ? (
                            <Badge variant={p.ageing.days_61_90 + p.ageing.days_90_plus > 0 ? 'error' : 'warning'}>
                              {p.ageing.days_61_90 + p.ageing.days_90_plus > 0 ? 'Overdue' : 'Due'}
                            </Badge>
                          ) : (
                            <Badge variant="success">Settled</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
