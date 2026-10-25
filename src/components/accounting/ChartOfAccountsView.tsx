import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { Account, AccountType } from '../../types/accounting';
import { formatINR } from '../../utils/currency';
import { BookOpen, Search, ArrowRight, ShieldCheck } from 'lucide-react';
import { Badge } from '../common/Badge';

export const ChartOfAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>(dataService.getAccounts());
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    return dataService.subscribe('k7_accounts', () => {
      setAccounts(dataService.getAccounts());
    });
  }, []);

  const filteredAccounts = accounts.filter(acc => {
    const matchesType = typeFilter === 'ALL' || acc.type === typeFilter;
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery) ||
      acc.subGroup.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const typeColorMap: Record<AccountType, 'brand' | 'success' | 'warning' | 'info' | 'neutral'> = {
    ASSET: 'info',
    LIABILITY: 'warning',
    EQUITY: 'brand',
    INCOME: 'success',
    EXPENSE: 'neutral'
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand" /> Standard Chart of Accounts (COA)
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Tally-compliant multi-tier general ledger structure reviewed for FMCG distributor accounting.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              typeFilter === 'ALL' ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
            }`}
          >
            All Accounts ({accounts.length})
          </button>
          {(['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'] as AccountType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === t ? 'bg-brand text-white shadow-sm' : 'bg-surface text-ink-secondary hover:bg-slate-100'
              }`}
            >
              {t} ({accounts.filter(a => a.type === t).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search GL code or account name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">GL Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4">Primary Type</th>
                <th className="py-3 px-4">Sub-Group</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                <th className="py-3 px-4">System Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary">
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-brand">{acc.code}</td>
                  <td className="py-3 px-4 font-semibold text-ink-primary">{acc.name}</td>
                  <td className="py-3 px-4">
                    <Badge variant={typeColorMap[acc.type]}>{acc.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-ink-secondary font-medium">
                    {acc.subGroup.replace(/_/g, ' ')}
                  </td>
                  <td className="py-3 px-4 text-right text-num font-mono">
                    {formatINR(acc.openingBalance)} {acc.openingBalanceType}
                  </td>
                  <td className="py-3 px-4 text-right text-num font-bold font-mono text-brand">
                    {formatINR(acc.currentBalance)} {acc.currentBalanceType}
                  </td>
                  <td className="py-3 px-4">
                    {acc.isSystem ? (
                      <span className="text-[10px] font-semibold text-ink-muted bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Core System A/c
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-brand bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        Custom Ledger
                      </span>
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
