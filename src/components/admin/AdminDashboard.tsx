import React, { useState, useEffect } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import { StatCard } from '../common/StatCard';
import { formatINR } from '../../utils/currency';
import {
  TrendingUp,
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Package,
  Landmark,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDateTime } from '../../utils/date';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { settings } = useBusiness();
  const [orders, setOrders] = useState(dataService.getOrders());
  const [valuation, setValuation] = useState(dataService.getStockValuation());
  const [accounts, setAccounts] = useState(dataService.getAccounts());
  const [retailers, setRetailers] = useState(dataService.getRetailers());
  const [suppliers, setSuppliers] = useState(dataService.getSuppliers());

  useEffect(() => {
    const unsub = dataService.subscribe('*', () => {
      setOrders(dataService.getOrders());
      setValuation(dataService.getStockValuation());
      setAccounts(dataService.getAccounts());
      setRetailers(dataService.getRetailers());
      setSuppliers(dataService.getSuppliers());
    });
    return () => unsub();
  }, []);

  // Compute live real metrics from database
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.orderDate.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  const pendingApprovalCount = orders.filter(o => o.currentStage === 'PENDING_APPROVAL').length;
  const packingCount = orders.filter(o => o.currentStage === 'PACKING_IN_PROGRESS').length;
  const dispatchedCount = orders.filter(o => o.currentStage === 'DISPATCHED' || o.currentStage === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = orders.filter(o => o.currentStage === 'DELIVERED').length;

  const totalRetailerReceivables = retailers.reduce((sum, r) => sum + r.currentOutstanding, 0);
  const totalSupplierPayables = suppliers.reduce((sum, s) => sum + s.currentOutstandingBalance, 0);

  const getAccountBal = (id: string) => accounts.find(a => a.id === id)?.currentBalance || 0;
  const cashBalance = getAccountBal('acc_cash_01') + getAccountBal('acc_cash_petty');
  const bankBalance = getAccountBal('acc_bank_tmb') + getAccountBal('acc_bank_sbi');

  return (
    <div className="space-y-6">
      {/* First-Time Business Setup Banner */}
      {(!settings.isConfigured || !settings.businessName) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-lg p-5 shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <h3 className="text-base font-bold text-amber-900">First-Time Setup: Configure Your Business Master Details</h3>
            </div>
            <p className="text-xs text-amber-800">
              Welcome to K7 Enterprise. Configure your company name, GSTIN, bank accounts, and opening balance reconciliation to begin operations.
            </p>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="flex-shrink-0 text-xs font-semibold px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Configure Business Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-ink-primary">
              {settings.businessName || 'K7 Enterprise'} Executive Command Centre
            </h2>
            <Badge variant="brand">{settings.subTitle || 'FMCG Distribution'}</Badge>
          </div>
          <p className="text-xs text-ink-secondary mt-1">
            Real-time FMCG distribution, inventory valuation, and double-entry accounting overview for {settings.city || settings.district || 'business operations'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold px-3 py-1.5 bg-brand text-white rounded hover:bg-brand-hover shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Manage Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('accounting_trial_balance')}
            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-800 rounded hover:bg-slate-200 transition-colors"
          >
            Trial Balance
          </button>
        </div>
      </div>

      {/* Row 1: High-Priority Live Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={formatINR(todaySales)}
          subtitle={`${todayOrders.length} orders booked today`}
          icon={TrendingUp}
          accentColor="brand"
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="Retailer Receivables"
          value={formatINR(totalRetailerReceivables)}
          subtitle="Sundry Debtors Outstanding"
          icon={DollarSign}
          accentColor="warning"
          onClick={() => onNavigate('accounting_ageing')}
        />
        <StatCard
          title="Supplier Payables"
          value={formatINR(totalSupplierPayables)}
          subtitle="Sundry Creditors (Suppliers)"
          icon={Building}
          accentColor="info"
          onClick={() => onNavigate('creditor_management')}
        />
        <StatCard
          title="Inventory Valuation"
          value={formatINR(valuation.totalInventoryValue)}
          subtitle={`${valuation.totalQuantity} units on hand`}
          icon={Package}
          accentColor="success"
          onClick={() => onNavigate('inventory')}
        />
      </div>

      {/* Row 2: Operational Order Pipeline Stepper Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Orders Awaiting Approval"
          value={pendingApprovalCount}
          subtitle="Orders exceeding credit limits"
          icon={Clock}
          accentColor={pendingApprovalCount > 0 ? 'warning' : 'info'}
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="Packing in Progress"
          value={packingCount}
          subtitle="Godown carton allocation"
          icon={ShoppingCart}
          accentColor="brand"
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="In Transit / Dispatched"
          value={dispatchedCount}
          subtitle="Delivery van route active"
          icon={Truck}
          accentColor="brand"
          onClick={() => onNavigate('orders')}
        />
        <StatCard
          title="Delivered Orders"
          value={deliveredCount}
          subtitle="Completed full lifecycle"
          icon={CheckCircle2}
          accentColor="success"
          onClick={() => onNavigate('orders')}
        />
      </div>

      {/* Row 3: Cash & Bank Liquidity + Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Treasury Balances */}
        <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise">
          <div className="flex items-center justify-between pb-3 border-b border-divider">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <Landmark className="w-4 h-4 text-brand" /> Treasury & Liquidity Balances
            </h3>
            <span className="text-[11px] text-ink-muted">GL Ledger</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-divider">
              <div>
                <p className="text-xs font-semibold text-ink-primary">Cash in Hand</p>
                <p className="text-[11px] text-ink-secondary">Counter Cash + Petty Imprest</p>
              </div>
              <p className="text-sm font-bold text-ink-primary text-num">{formatINR(cashBalance)}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-divider">
              <div>
                <p className="text-xs font-semibold text-ink-primary">Tamilnad Mercantile Bank (TMB)</p>
                <p className="text-[11px] text-ink-secondary">A/c 5081920 • Beach Road</p>
              </div>
              <p className="text-sm font-bold text-ink-primary text-num">{formatINR(getAccountBal('acc_bank_tmb'))}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-divider">
              <div>
                <p className="text-xs font-semibold text-ink-primary">State Bank of India (SBI)</p>
                <p className="text-[11px] text-ink-secondary">A/c 398112 • Millerpuram</p>
              </div>
              <p className="text-sm font-bold text-ink-primary text-num">{formatINR(getAccountBal('acc_bank_sbi'))}</p>
            </div>
          </div>
        </div>

        {/* Stock & Expiry Alerts */}
        <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise">
          <div className="flex items-center justify-between pb-3 border-b border-divider">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Inventory & FEFO Alerts
            </h3>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[11px] text-brand hover:underline font-medium"
            >
              View Stock
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="p-3 rounded-md bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Low Stock Alert</p>
                <p className="text-[11px] text-amber-800">{valuation.lowStockItemsCount} items below minimum reorder point</p>
              </div>
              <Badge variant="warning">{valuation.lowStockItemsCount} SKUs</Badge>
            </div>

            <div className="p-3 rounded-md bg-rose-50/70 border border-rose-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-rose-900">FEFO Expiry Alert</p>
                <p className="text-[11px] text-rose-800">{valuation.nearExpiryItemsCount} batches expiring within 90 days</p>
              </div>
              <Badge variant="error">{valuation.nearExpiryItemsCount} Batches</Badge>
            </div>

            <div className="p-3 rounded-md bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-900">Active Catalogue</p>
                <p className="text-[11px] text-emerald-800">{valuation.totalItems} active catalogue items</p>
              </div>
              <Badge variant={valuation.totalItems > 0 ? 'success' : 'neutral'}>
                {valuation.totalItems > 0 ? 'In Stock' : 'Empty'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Operations Actions */}
        <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise">
          <div className="flex items-center justify-between pb-3 border-b border-divider">
            <h3 className="text-sm font-semibold text-ink-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand" /> Quick Workflow Execution
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5">
            <button
              onClick={() => onNavigate('products')}
              className="w-full text-left p-3 rounded-md border border-divider hover:border-brand-border hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-ink-primary"
            >
              <span>+ Add / Update Product & Images</span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
            </button>
            <button
              onClick={() => onNavigate('purchases')}
              className="w-full text-left p-3 rounded-md border border-divider hover:border-brand-border hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-ink-primary"
            >
              <span>+ Post Inward Goods Receipt (GRN)</span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
            </button>
            <button
              onClick={() => onNavigate('accounting_vouchers')}
              className="w-full text-left p-3 rounded-md border border-divider hover:border-brand-border hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-ink-primary"
            >
              <span>+ Post Double-Entry Accounting Voucher</span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
            </button>
            <button
              onClick={() => onNavigate('bank_reconciliation')}
              className="w-full text-left p-3 rounded-md border border-divider hover:border-brand-border hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold text-ink-primary"
            >
              <span>+ Reconcile Bank Statements</span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Live Sales Orders Table */}
      <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
        <div className="px-5 py-4 border-b border-divider flex items-center justify-between bg-surface">
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">Live Distribution Orders</h3>
            <p className="text-xs text-ink-secondary mt-0.5">Real-time orders across {settings.city || settings.district || 'commercial'} retail network</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-brand font-semibold hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-ink-muted bg-slate-50/50">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-ink-primary text-xs">No sales orders placed yet</p>
            <p className="text-ink-secondary text-[11px] mt-1 mb-4">
              Orders booked via the Wholesale Retailer Portal or Field Desk will appear here live.
            </p>
            <button
              onClick={() => onNavigate('orders')}
              className="px-3.5 py-1.5 bg-brand text-white rounded text-xs font-semibold hover:bg-brand-hover shadow-sm"
            >
              Open Orders Desk
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-divider text-ink-secondary uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Retailer Shop</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Delivery Stage</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider/70 text-ink-primary">
                {orders.slice(0, 6).map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-brand">{order.orderNumber}</td>
                    <td className="py-3 px-4 text-ink-secondary">{formatDateTime(order.orderDate)}</td>
                    <td className="py-3 px-4 font-semibold">{order.retailerShopName}</td>
                    <td className="py-3 px-4 text-ink-secondary">{order.area}</td>
                    <td className="py-3 px-4 text-right font-bold text-num">{formatINR(order.grandTotal)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {order.currentStage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium">{order.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate('orders')}
                        className="text-brand hover:underline font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
