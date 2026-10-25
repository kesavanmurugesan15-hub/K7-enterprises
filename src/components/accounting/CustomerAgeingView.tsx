import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { CustomerCreditProfile } from '../../types/credit';
import { formatINR } from '../../utils/currency';
import { downloadCSV } from '../../utils/export';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Clock, Download, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

export const CustomerAgeingView: React.FC = () => {
  const [profiles, setProfiles] = useState<CustomerCreditProfile[]>(dataService.getCustomerCreditProfiles());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return dataService.subscribe('*', () => {
      setProfiles(dataService.getCustomerCreditProfiles());
    });
  }, []);

  const totalOutstanding = profiles.reduce((sum, p) => sum + p.currentOutstanding, 0);
  const totalOverdue = profiles.reduce((sum, p) => sum + p.ageing.days_31_60 + p.ageing.days_61_90 + p.ageing.days_90_plus, 0);

  const handleExportCSV = () => {
    const csvData = [
      ['K7 Enterprise — Receivables Ageing & Credit Analysis'],
      ['Retailer Shop', 'Credit Limit (INR)', 'Current Outstanding (INR)', 'Available Credit (INR)', '0-30 Days (INR)', '31-60 Days (INR)', '61-90 Days (INR)', '90+ Days (INR)'],
      ...profiles.map(p => [
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
    downloadCSV('Customer_Receivables_Ageing', csvData);
  };

  const filtered = profiles.filter(p =>
    p.retailerShopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand" /> Receivables Ageing & Retailer Credit Limits
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time ageing buckets (0-30, 31-60, 61-90, 90+ days) and credit limit enforcement.
          </p>
        </div>

        <Button variant="outline" size="sm" icon={Download} onClick={handleExportCSV}>
          Export Ageing Report (CSV)
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Total Receivables</p>
          <p className="text-xl font-bold text-ink-primary font-mono mt-1">{formatINR(totalOutstanding)}</p>
          <p className="text-[11px] text-ink-muted mt-1">Across all retail accounts</p>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Current (0-30 Days)</p>
          <p className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {formatINR(profiles.reduce((s, p) => s + p.ageing.current_0_30, 0))}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Within standard credit terms</p>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Overdue (31-60 Days)</p>
          <p className="text-xl font-bold text-amber-700 font-mono mt-1">
            {formatINR(profiles.reduce((s, p) => s + p.ageing.days_31_60, 0))}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">Requires follow-up</p>
        </div>

        <div className="bg-surface border border-divider rounded-lg p-4 shadow-enterprise">
          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">Critical Overdue (60+ Days)</p>
          <p className="text-xl font-bold text-rose-700 font-mono mt-1">
            {formatINR(profiles.reduce((s, p) => s + p.ageing.days_61_90 + p.ageing.days_90_plus, 0))}
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
            placeholder="Search retail outlet..."
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
                <th className="py-3 px-4">Retail Shop</th>
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
              {filtered.map(p => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
