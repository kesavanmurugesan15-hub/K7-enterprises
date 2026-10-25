import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import type { AuditLog } from '../../types/notification';
import { formatDateTime } from '../../utils/date';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { Badge } from '../common/Badge';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(dataService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  useEffect(() => {
    return dataService.subscribe('k7_audit_logs', () => {
      setLogs(dataService.getAuditLogs());
    });
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand" /> Immutable System Audit Logs
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Cryptographically timestamped audit trail of sensitive financial, inventory, pricing and user operations.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-secondary">Module Filter:</span>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="text-xs p-1.5 border border-divider rounded bg-surface focus:outline-none focus:border-brand"
          >
            <option value="ALL">All Modules ({logs.length})</option>
            <option value="ORDERS">Sales & Orders</option>
            <option value="INVENTORY">Inventory & Movements</option>
            <option value="PURCHASE">Purchases & GRN</option>
            <option value="ACCOUNTING">Accounting & Vouchers</option>
            <option value="USERS">Users & Retailers</option>
            <option value="BANK_REC">Bank Reconciliation</option>
            <option value="CREDIT">Customer Credit & Receipts</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search action, actor, entity..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Affected Entity</th>
                <th className="py-3 px-4">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider/70 text-ink-primary font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-muted font-sans text-xs">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-ink-secondary whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-ink-primary">{log.userName}</div>
                      <div className="text-[10px] text-ink-muted capitalize">{log.userRole.replace('_', ' ')}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <Badge variant="brand">{log.module}</Badge>
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-ink-primary">{log.entityName}</div>
                      <div className="text-[10px] text-ink-muted">{log.entityId}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-ink-secondary leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
