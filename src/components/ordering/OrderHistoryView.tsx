import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import type { SalesOrder } from '../../types/order';
import { Button } from '../common/Button';
import { Badge, DeliveryStageBadge, PaymentStatusBadge } from '../common/Badge';
import { DeliveryStepper } from '../common/DeliveryStepper';
import { formatINR } from '../../utils/currency';
import { formatDateTime, formatDate } from '../../utils/date';
import { printElementById } from '../../utils/export';
import { Search, RotateCcw, Printer, ChevronRight, Clock } from 'lucide-react';

interface OrderHistoryViewProps {
  onReorder: (order: SalesOrder) => void;
  selectedOrderId?: string;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({ onReorder, selectedOrderId }) => {
  const { currentUser, isRetailer } = useAuth();
  const [orders, setOrders] = useState<SalesOrder[]>(dataService.getOrders());
  const [activeOrder, setActiveOrder] = useState<SalesOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribe('k7_orders', () => {
      const all = dataService.getOrders();
      setOrders(all);
      if (activeOrder) {
        const found = all.find(o => o.id === activeOrder.id);
        if (found) setActiveOrder(found);
      }
    });
    return () => unsub();
  }, [activeOrder]);

  useEffect(() => {
    if (selectedOrderId) {
      const found = orders.find(o => o.id === selectedOrderId);
      if (found) setActiveOrder(found);
    } else if (orders.length > 0 && !activeOrder) {
      setActiveOrder(orders[0]);
    }
  }, [selectedOrderId, orders]);

  // Filter orders by role: if retailer, only show their orders; if sales officer, show their assigned area
  const userOrders = orders.filter(o => {
    if (isRetailer && currentUser.retailerId) {
      return o.retailerId === currentUser.retailerId;
    }
    return true;
  });

  const filteredOrders = userOrders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.retailerShopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.currentStage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-divider shadow-enterprise">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Orders & Live Status Tracking</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Real-time Firestore sync of order lifecycle, expected delivery drop-offs and invoices.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, shop name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Order List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden divide-y divide-divider/70">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted">No orders found.</div>
            ) : (
              filteredOrders.map(order => {
                const isSelected = activeOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setActiveOrder(order)}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      isSelected ? 'bg-brand-50/50 border-l-4 border-l-brand' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-brand text-xs">{order.orderNumber}</span>
                        <h4 className="font-semibold text-xs text-ink-primary mt-0.5">{order.retailerShopName}</h4>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-ink-primary text-num text-xs">{formatINR(order.grandTotal)}</p>
                        <div className="mt-1">
                          <DeliveryStageBadge stage={order.currentStage} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-divider/60 flex items-center justify-between text-[11px] text-ink-secondary">
                      <span>{order.items.reduce((s, i) => s + i.quantity, 0)} items ({order.paymentMethod})</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-muted" />
                        {formatDateTime(order.orderDate).split(',')[0]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Tracking & Details */}
        {activeOrder ? (
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-divider">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink-primary font-mono">{activeOrder.orderNumber}</h3>
                    <DeliveryStageBadge stage={activeOrder.currentStage} />
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Order Date: <span className="font-medium text-ink-primary">{formatDateTime(activeOrder.orderDate)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => onReorder(activeOrder)}
                  >
                    Reorder Items
                  </Button>
                </div>
              </div>

              {/* Real-time 11-Stage Stepper */}
              <DeliveryStepper currentStage={activeOrder.currentStage} history={activeOrder.stageHistory} />

              {/* Items List */}
              <div>
                <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-2">
                  Ordered Products ({activeOrder.items.length})
                </h4>
                <div className="border border-divider rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-divider text-ink-secondary text-[11px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider/70">
                      {activeOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-ink-primary">
                            {it.productName}
                            <div className="text-[10px] text-ink-muted">{it.sku} ({it.packSize})</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-num">{formatINR(it.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-brand text-num">{formatINR(it.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-divider text-xs font-semibold">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-right">Grand Total:</td>
                        <td className="py-2.5 px-3 text-right font-bold text-brand text-sm">{formatINR(activeOrder.grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Delivery and Billing info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-divider">
                <div className="p-3 bg-slate-50 rounded border border-divider">
                  <p className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider mb-1">Delivery Destination</p>
                  <p className="font-bold text-ink-primary">{activeOrder.retailerShopName}</p>
                  <p className="text-ink-secondary mt-0.5">{activeOrder.deliveryAddress}</p>
                  <p className="text-ink-secondary">Contact: {activeOrder.retailerPhone}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded border border-divider">
                  <p className="font-semibold text-ink-secondary uppercase text-[10px] tracking-wider mb-1">Payment & Invoice</p>
                  <p className="font-bold text-ink-primary">Payment Mode: {activeOrder.paymentMethod}</p>
                  <p className="text-ink-secondary mt-0.5">Payment Status: {activeOrder.paymentStatus}</p>
                  <p className="text-ink-secondary font-mono">Invoice #: {activeOrder.invoiceNumber || 'Pending Generation'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 p-12 bg-surface rounded-lg border border-divider text-center text-xs text-ink-muted">
            Select an order to view its real-time timeline and delivery progress.
          </div>
        )}
      </div>
    </div>
  );
};
