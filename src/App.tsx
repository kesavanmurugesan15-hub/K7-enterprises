import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BusinessProvider, useBusiness } from './context/BusinessContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagement } from './components/admin/UserManagement';
import { ProductCatalogManager } from './components/admin/ProductCatalogManager';
import { BusinessSettingsView } from './components/admin/BusinessSettingsView';
import { AuditLogViewer } from './components/admin/AuditLogViewer';

import { PurchasesManager } from './components/operations/PurchasesManager';
import { InventoryLedgerView } from './components/operations/InventoryLedgerView';
import { DeliveryTrackerView } from './components/operations/DeliveryTrackerView';
import { CollectionsExpensesView } from './components/operations/CollectionsExpensesView';

import { RetailerCatalog } from './components/ordering/RetailerCatalog';
import { ShoppingCartView } from './components/ordering/ShoppingCartView';
import { OrderHistoryView } from './components/ordering/OrderHistoryView';

import { ChartOfAccountsView } from './components/accounting/ChartOfAccountsView';
import { VoucherEntryView } from './components/accounting/VoucherEntryView';
import { DayBookView } from './components/accounting/DayBookView';
import { GeneralLedgerView } from './components/accounting/GeneralLedgerView';
import { TrialBalanceView } from './components/accounting/TrialBalanceView';
import { ProfitLossView } from './components/accounting/ProfitLossView';
import { BalanceSheetView } from './components/accounting/BalanceSheetView';
import { CustomerAgeingView } from './components/accounting/CustomerAgeingView';
import { BankReconciliationView } from './components/bank/BankReconciliationView';
import { dataService } from './services/dataService';

const AppContent: React.FC = () => {
  const { activeRole } = useAuth();
  const { addToCart } = useBusiness();

  // Initial active tab based on role
  const getDefaultTab = () => {
    if (activeRole === 'admin') return 'admin_dashboard';
    if (activeRole === 'distributor') return 'orders';
    if (activeRole === 'sales_rep' || activeRole === 'retailer') return 'retailer_catalog';
    return 'orders';
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);

  // Sync tab when switching roles if unauthorized
  React.useEffect(() => {
    if (activeRole === 'retailer' && (activeTab.startsWith('admin_') || activeTab.startsWith('accounting_') || activeTab === 'purchases')) {
      setActiveTab('retailer_catalog');
    }
  }, [activeRole, activeTab]);

  const handleReorder = (order: any) => {
    for (const it of order.items) {
      const prod = dataService.getProductById(it.productId);
      if (prod) {
        addToCart(prod, it.quantity);
      }
    }
    setActiveTab('cart');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      // Panel A: Administrator
      case 'admin_dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'users':
        return <UserManagement />;
      case 'products':
        return <ProductCatalogManager />;
      case 'settings':
        return <BusinessSettingsView />;
      case 'audit':
        return <AuditLogViewer />;

      // Panel B: Distributor Operations
      case 'operations_dashboard':
        return <AdminDashboard onNavigate={setActiveTab} />;
      case 'purchases':
        return <PurchasesManager />;
      case 'inventory':
        return <InventoryLedgerView />;
      case 'orders':
        return <DeliveryTrackerView />;
      case 'collections':
        return <CollectionsExpensesView />;

      // Panel C: Ordering Portal
      case 'retailer_catalog':
        return <RetailerCatalog onGoToCart={() => setActiveTab('cart')} />;
      case 'cart':
        return (
          <ShoppingCartView
            onOrderPlaced={orderId => {
              setSelectedOrderId(orderId);
              setActiveTab('order_history');
            }}
            onContinueShopping={() => setActiveTab('retailer_catalog')}
          />
        );
      case 'order_history':
        return <OrderHistoryView selectedOrderId={selectedOrderId} onReorder={handleReorder} />;

      // Module 4 & 5: Accounting & Bank Reconciliation
      case 'accounting_coa':
        return <ChartOfAccountsView />;
      case 'accounting_vouchers':
        return <VoucherEntryView />;
      case 'accounting_daybook':
        return <DayBookView />;
      case 'accounting_ledger':
        return <GeneralLedgerView />;
      case 'accounting_trial_balance':
        return <TrialBalanceView />;
      case 'accounting_pnl':
        return <ProfitLossView />;
      case 'accounting_balance_sheet':
        return <BalanceSheetView />;
      case 'accounting_ageing':
        return <CustomerAgeingView />;
      case 'bank_reconciliation':
        return <BankReconciliationView />;

      default:
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-page">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main App Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <AppContent />
      </BusinessProvider>
    </AuthProvider>
  );
}
