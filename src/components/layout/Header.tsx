import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { Bell, Search, ShieldCheck, Store, Truck, UserCheck, Menu, X, CheckCheck } from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { formatDateTime } from '../../utils/date';

interface HeaderProps {
  onToggleSidebar: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeTab }) => {
  const { currentUser, activeRole, switchRole } = useAuth();
  const { settings, notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useBusiness();
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const roleLabels: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
    admin: { label: 'Administrator', icon: ShieldCheck, color: 'text-brand' },
    distributor: { label: 'Operations Manager', icon: UserCheck, color: 'text-indigo-600' },
    sales_rep: { label: 'Sales Officer (Field)', icon: Store, color: 'text-emerald-600' },
    retailer: { label: 'Retailer (Selvam Store)', icon: Store, color: 'text-amber-600' },
    delivery: { label: 'Delivery Staff (Van)', icon: Truck, color: 'text-sky-600' }
  };

  const currentRoleInfo = roleLabels[activeRole];
  const RoleIcon = currentRoleInfo.icon;

  const getBreadcrumbTitle = (tab: string) => {
    const titles: Record<string, string> = {
      admin_dashboard: 'Admin Executive Dashboard',
      users: 'User & Retailer Management',
      products: 'Product Catalogue & Price Lists',
      settings: 'Business Settings & Preferences',
      audit: 'Audit Log & History',
      operations_dashboard: 'Distribution Operations Overview',
      purchases: 'Purchase Orders & Goods Receipt (GRN)',
      inventory: 'Auditable Inventory Ledger & FEFO',
      orders: 'Sales Orders & 11-Stage Delivery Tracker',
      collections: 'Collections, Expenses & Daily Cash',
      retailer_catalog: 'Wholesale Ordering Catalogue',
      cart: 'Order Cart & Checkout',
      order_history: 'Order History & Invoices',
      accounting_coa: 'Chart of Accounts (COA)',
      accounting_vouchers: 'Double-Entry Vouchers Entry',
      accounting_daybook: 'Day Book (Daily Registers)',
      accounting_ledger: 'General & Customer/Supplier Ledger',
      accounting_trial_balance: 'Trial Balance Verification',
      accounting_pnl: 'Profit & Loss Statement',
      accounting_balance_sheet: 'Balance Sheet',
      accounting_ageing: 'Receivables & Payables Ageing',
      bank_reconciliation: 'Bank Reconciliation & Statement Import'
    };
    return titles[tab] || 'Overview';
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-divider bg-surface px-4 md:px-6 shadow-sm">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-ink-secondary hover:bg-slate-100 hover:text-ink-primary md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="font-semibold text-brand tracking-wide">K7 Enterprise</span>
          <span className="text-divider font-light">/</span>
          <span className="text-ink-secondary font-medium">{settings.city} Hub</span>
          <span className="text-divider font-light hidden sm:inline">/</span>
          <span className="text-ink-primary font-semibold hidden sm:inline">{getBreadcrumbTitle(activeTab)}</span>
        </div>
      </div>

      {/* Right Controls: Role Switcher & Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar (compact enterprise style) */}
        <div className="hidden lg:flex items-center relative w-64">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search SKU, invoice, retailer..."
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-divider rounded-md focus:bg-white focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-ink-primary"
          />
        </div>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border border-divider bg-slate-50 hover:bg-slate-100 text-ink-primary transition-colors"
            title="Switch role for testing multi-role panels"
          >
            <RoleIcon className={`w-3.5 h-3.5 ${currentRoleInfo.color}`} />
            <span className="hidden sm:inline">{currentRoleInfo.label}</span>
            <span className="sm:hidden">{activeRole.toUpperCase()}</span>
            <span className="text-[10px] text-ink-muted">▼</span>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-md bg-white border border-divider shadow-enterprise-md py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-divider font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                Switch Active Role Experience
              </div>
              {(Object.keys(roleLabels) as UserRole[]).map(r => {
                const item = roleLabels[r];
                const ItemIcon = item.icon;
                const isSelected = activeRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      switchRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 ${isSelected ? 'bg-brand-50/60 font-semibold text-brand' : 'text-ink-primary'}`}
                  >
                    <div className="flex items-center gap-2">
                      <ItemIcon className={`w-4 h-4 ${item.color}`} />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <span className="text-brand text-xs font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifDrawer(!showNotifDrawer)}
            className="relative p-1.5 rounded-md text-ink-secondary hover:bg-slate-100 hover:text-ink-primary transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white leading-none">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifDrawer && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-white border border-divider shadow-enterprise-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-ink-primary">Live Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand text-white">
                      {unreadNotificationCount} new
                    </span>
                  )}
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-medium text-brand hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-divider/70">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-ink-muted">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-brand-50/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${!n.isRead ? 'text-brand' : 'text-ink-primary'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-ink-muted whitespace-nowrap">
                          {formatDateTime(n.timestamp).split(',')[1]}
                        </span>
                      </div>
                      <p className="text-ink-secondary mt-1 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-divider">
          <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold uppercase shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-ink-primary leading-none truncate max-w-[120px]">{currentUser.name}</p>
            <p className="text-[10px] text-ink-secondary capitalize mt-0.5">{activeRole.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
