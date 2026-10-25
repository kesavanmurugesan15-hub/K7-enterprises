import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Settings,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Receipt,
  BookOpen,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Scale,
  TrendingUp,
  Landmark,
  Clock,
  ClipboardList
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose
}) => {
  const { activeRole } = useAuth();
  const { cartCount, settings } = useBusiness();

  // Role access conditions
  const showAdmin = activeRole === 'admin';
  const showOperations = activeRole === 'admin' || activeRole === 'distributor';
  const showOrdering = activeRole === 'retailer' || activeRole === 'sales_rep' || activeRole === 'admin';
  const showAccounting = activeRole === 'admin' || activeRole === 'distributor';

  const NavItem = ({ id, label, icon: Icon, badge }: { id: string; label: string; icon: React.ElementType; badge?: string | number }) => {
    const isActive = activeTab === id;
    return (
      <button
        type="button"
        onClick={() => {
          onSelectTab(id);
          onClose();
        }}
        className={clsx(
          'w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left group',
          isActive
            ? 'bg-brand text-white font-semibold shadow-sm'
            : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-100'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon className={clsx('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-ink-muted group-hover:text-ink-secondary')} />
          <span className="truncate">{label}</span>
        </div>
        {badge !== undefined && (
          <span
            className={clsx(
              'px-1.5 py-0.5 rounded text-[10px] font-bold',
              isActive ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand'
            )}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-ink-muted uppercase tracking-wider">
      {label}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface border-r border-divider transition-transform duration-200 md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center gap-3 border-b border-divider px-4 bg-surface">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-black text-sm tracking-wider shadow-sm">
            K7
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-ink-primary flex items-center gap-1.5">
              <span>K7 ENTERPRISE</span>
            </h1>
            <p className="text-[10px] text-ink-secondary font-medium truncate">
              Aachi Masala Distributor • Thoothukudi
            </p>
          </div>
        </div>

        {/* Navigation scrollable area */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {/* PANEL A: ADMINISTRATOR */}
          {showAdmin && (
            <div>
              <SectionHeader label="Panel A: Administration" />
              <NavItem id="admin_dashboard" label="Executive Dashboard" icon={LayoutDashboard} />
              <NavItem id="users" label="Users & Retailers" icon={Users} />
              <NavItem id="products" label="Product Catalogue & Pricing" icon={Package} />
              <NavItem id="settings" label="Business Settings" icon={Settings} />
              <NavItem id="audit" label="Audit Logs" icon={ShieldAlert} />
            </div>
          )}

          {/* PANEL B: DISTRIBUTOR OPERATIONS */}
          {showOperations && (
            <div>
              <SectionHeader label="Panel B: Operations" />
              {!showAdmin && <NavItem id="operations_dashboard" label="Operations Overview" icon={LayoutDashboard} />}
              <NavItem id="purchases" label="Purchases & GRN" icon={ClipboardList} />
              <NavItem id="inventory" label="Inventory Ledger & FEFO" icon={Package} />
              <NavItem id="orders" label="Sales Orders & Delivery" icon={Truck} />
              <NavItem id="collections" label="Collections & Expenses" icon={DollarSign} />
            </div>
          )}

          {/* PANEL C: EMPLOYEE & RETAILER ORDERING */}
          {showOrdering && (
            <div>
              <SectionHeader label="Panel C: Ordering Portal" />
              <NavItem id="retailer_catalog" label="Order Products" icon={ShoppingCart} />
              <NavItem id="cart" label="Shopping Cart" icon={ShoppingCart} badge={cartCount > 0 ? cartCount : undefined} />
              <NavItem id="order_history" label="My Orders & Invoices" icon={Receipt} />
            </div>
          )}

          {/* MODULE 4 & 5: TALLY-STYLE DOUBLE ENTRY ACCOUNTING */}
          {showAccounting && (
            <div>
              <SectionHeader label="Financial Accounting" />
              <NavItem id="accounting_coa" label="Chart of Accounts" icon={BookOpen} />
              <NavItem id="accounting_vouchers" label="Voucher Entry" icon={FileSpreadsheet} />
              <NavItem id="accounting_daybook" label="Day Book" icon={ClipboardList} />
              <NavItem id="accounting_ledger" label="General Ledger" icon={BookOpen} />
              <NavItem id="accounting_trial_balance" label="Trial Balance" icon={Scale} />
              <NavItem id="accounting_pnl" label="Profit & Loss" icon={TrendingUp} />
              <NavItem id="accounting_balance_sheet" label="Balance Sheet" icon={Building2} />
              <NavItem id="accounting_ageing" label="Credit & Ageing" icon={Clock} />
              <NavItem id="bank_reconciliation" label="Bank Reconciliation" icon={Landmark} />
            </div>
          )}
        </div>

        {/* Business Info Footer */}
        <div className="p-3 border-t border-divider bg-slate-50 text-[11px] text-ink-secondary">
          <div className="font-semibold text-ink-primary truncate">{settings.distributorName}</div>
          <div className="text-[10px] text-ink-muted truncate">GST: {settings.gstin}</div>
          <div className="text-[10px] text-ink-muted truncate">FY: {settings.financialYear}</div>
        </div>
      </aside>
    </>
  );
};
