import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import type { SalesOrder, DeliveryStage } from '../../types/order';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Badge, DeliveryStageBadge, PaymentStatusBadge } from '../common/Badge';
import { DeliveryStepper } from '../common/DeliveryStepper';
import { formatINR } from '../../utils/currency';
import { formatDateTime, formatDate } from '../../utils/date';
import { printElementById } from '../../utils/export';
import { Truck, Check, X, Printer, Search, ShieldAlert, ArrowRight, UserCheck, Package, Download } from 'lucide-react';
import { downloadInvoicePDF } from '../../utils/invoiceGenerator';

export const DeliveryTrackerView: React.FC = () => {
  const { currentUser, isAdmin, isOperations, isDelivery } = useAuth();
  const { settings } = useBusiness();
  const [orders, setOrders] = useState<SalesOrder[]>(dataService.getOrders());
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Transition Modal
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<DeliveryStage>('ACCEPTED');
  const [stageNotes, setStageNotes] = useState('');
  const [signatureName, setSignatureName] = useState('');

  // Invoice Print Modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    return dataService.subscribe('k7_orders', () => {
      const refreshed = dataService.getOrders();
      setOrders(refreshed);
      if (selectedOrder) {
        const found = refreshed.find(o => o.id === selectedOrder.id);
        if (found) setSelectedOrder(found);
      }
    });
  }, [selectedOrder]);

  const handleOpenTransitionModal = (order: SalesOrder, nextStage: DeliveryStage) => {
    setSelectedOrder(order);
    setTargetStage(nextStage);
    setStageNotes('');
    setSignatureName(order.retailerOwnerName);
    setIsTransitionModalOpen(true);
  };

  const handleConfirmTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    const res = dataService.updateDeliveryStage(
      selectedOrder.id,
      targetStage,
      currentUser,
      stageNotes,
      {
        signatureName: targetStage === 'DELIVERED' ? signatureName : undefined
      }
    );

    if (!res.success) {
      alert(res.message);
      return;
    }

    setIsTransitionModalOpen(false);
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = statusFilter === 'ALL' || o.currentStage === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.retailerShopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.invoiceNumber && o.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface p-4 rounded-lg border border-divider shadow-enterprise flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand" /> 11-Stage Distribution & Delivery Management
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Strict lifecycle control: Placed $\rightarrow$ Approval $\rightarrow$ Packing $\rightarrow$ Van Dispatch $\rightarrow$ Delivered Dropoff.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider pb-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-ink-secondary">Stage:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs p-1.5 border border-divider rounded bg-surface focus:outline-none focus:border-brand"
          >
            <option value="ALL">All Stages ({orders.length})</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="ORDER_PLACED">Order Placed</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="STOCK_ALLOCATED">Stock Allocated</option>
            <option value="PACKING_IN_PROGRESS">Packing in Progress</option>
            <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched (Van Route)</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="DELIVERED">Delivered (Complete)</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search order #, shop, area..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-surface border border-divider rounded-md focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {/* Main Layout: Split list & detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Orders List */}
        <div className={selectedOrder ? 'lg:col-span-5' : 'lg:col-span-12'}>
          <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
            <div className="divide-y divide-divider/70">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-muted">No matching orders found.</div>
              ) : (
                filteredOrders.map(order => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-brand-50/50 border-l-4 border-l-brand' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-brand text-xs">{order.orderNumber}</span>
                          <h4 className="font-semibold text-ink-primary text-xs mt-0.5">{order.retailerShopName}</h4>
                          <p className="text-[11px] text-ink-secondary">{order.area}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-ink-primary text-num text-xs">{formatINR(order.grandTotal)}</p>
                          <div className="mt-1">
                            <DeliveryStageBadge stage={order.currentStage} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-divider/60 flex items-center justify-between text-[11px] text-ink-secondary">
                        <span>{order.items.length} items ({order.items.reduce((s, i) => s + i.quantity, 0)} pkts)</span>
                        <span>{formatDateTime(order.orderDate).split(',')[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Order Detail & Transition Action */}
        {selectedOrder && (
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise space-y-5">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-divider">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink-primary font-mono">{selectedOrder.orderNumber}</h3>
                    <DeliveryStageBadge stage={selectedOrder.currentStage} />
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Retailer: <span className="font-semibold text-ink-primary">{selectedOrder.retailerShopName}</span> ({selectedOrder.retailerOwnerName})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => downloadInvoicePDF(selectedOrder, settings)}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Printer}
                    onClick={() => setIsInvoiceModalOpen(true)}
                  >
                    Tax Invoice
                  </Button>
                </div>
              </div>

              {/* 11-Stage Interactive Stepper */}
              <DeliveryStepper currentStage={selectedOrder.currentStage} history={selectedOrder.stageHistory} />

              {/* Lifecycle Transition Action Bar */}
              <div className="p-4 bg-slate-50 border border-divider rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-primary">Permitted Next Actions:</span>
                  <span className="text-[11px] text-ink-secondary">Requires Authorized Role</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* PENDING APPROVAL -> ACCEPTED */}
                  {selectedOrder.currentStage === 'PENDING_APPROVAL' && (isAdmin || isOperations) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'ACCEPTED')}
                    >
                      Approve Credit & Accept Order
                    </Button>
                  )}

                  {/* ORDER_PLACED -> ACCEPTED */}
                  {selectedOrder.currentStage === 'ORDER_PLACED' && (isAdmin || isOperations) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'ACCEPTED')}
                    >
                      Accept Order
                    </Button>
                  )}

                  {/* ACCEPTED -> STOCK_ALLOCATED */}
                  {selectedOrder.currentStage === 'ACCEPTED' && (isAdmin || isOperations) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'STOCK_ALLOCATED')}
                    >
                      Allocate Godown Stock
                    </Button>
                  )}

                  {/* STOCK_ALLOCATED -> PACKING_IN_PROGRESS */}
                  {selectedOrder.currentStage === 'STOCK_ALLOCATED' && (isAdmin || isOperations) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'PACKING_IN_PROGRESS')}
                    >
                      Start Packing Cartons
                    </Button>
                  )}

                  {/* PACKING_IN_PROGRESS -> READY_FOR_DISPATCH */}
                  {selectedOrder.currentStage === 'PACKING_IN_PROGRESS' && (isAdmin || isOperations) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'READY_FOR_DISPATCH')}
                    >
                      Mark Ready for Dispatch
                    </Button>
                  )}

                  {/* READY_FOR_DISPATCH -> DISPATCHED */}
                  {selectedOrder.currentStage === 'READY_FOR_DISPATCH' && (isAdmin || isOperations) && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Truck}
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'DISPATCHED')}
                    >
                      Dispatch on Van (Deduct Physical Stock)
                    </Button>
                  )}

                  {/* DISPATCHED -> OUT_FOR_DELIVERY */}
                  {selectedOrder.currentStage === 'DISPATCHED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Truck}
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'OUT_FOR_DELIVERY')}
                    >
                      Out for Delivery
                    </Button>
                  )}

                  {/* OUT_FOR_DELIVERY -> DELIVERED */}
                  {(selectedOrder.currentStage === 'OUT_FOR_DELIVERY' || selectedOrder.currentStage === 'DISPATCHED') && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleOpenTransitionModal(selectedOrder, 'DELIVERED')}
                    >
                      Confirm Delivery Dropoff
                    </Button>
                  )}

                  {/* Cancel option (only if not already dispatched or delivered) */}
                  {selectedOrder.currentStage !== 'DELIVERED' &&
                    selectedOrder.currentStage !== 'DISPATCHED' &&
                    selectedOrder.currentStage !== 'CANCELLED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTransitionModal(selectedOrder, 'CANCELLED')}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        Cancel Order
                      </Button>
                    )}
                </div>
              </div>

              {/* Order Items Summary */}
              <div>
                <h4 className="text-xs font-semibold text-ink-primary uppercase tracking-wider mb-2">
                  Order Line Items
                </h4>
                <div className="border border-divider rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-divider text-ink-secondary text-[11px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">GST %</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-divider/70">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3 font-semibold text-ink-primary">
                            {it.productName}
                            <div className="text-[10px] text-ink-muted">{it.sku} ({it.packSize})</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">{it.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-num">{formatINR(it.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right">{it.gstPercent}%</td>
                          <td className="py-2.5 px-3 text-right font-bold text-num text-brand">{formatINR(it.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-divider text-xs font-semibold">
                      <tr>
                        <td colSpan={4} className="py-2.5 px-3 text-right">Grand Total:</td>
                        <td className="py-2.5 px-3 text-right font-bold text-brand text-sm">{formatINR(selectedOrder.grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Transition Modal */}
      <Modal
        isOpen={isTransitionModalOpen}
        onClose={() => setIsTransitionModalOpen(false)}
        title={`Advance Order to: ${targetStage.replace(/_/g, ' ')}`}
        subtitle={`Order #${selectedOrder?.orderNumber} for ${selectedOrder?.retailerShopName}`}
      >
        <form onSubmit={handleConfirmTransition} className="space-y-4 text-xs">
          {targetStage === 'DISPATCHED' && (
            <div className="p-3 bg-brand-50 border border-brand-200 rounded text-brand-900">
              <span className="font-bold">Important Audit Step:</span> Moving this order to DISPATCHED will deduct physical stock on hand and post an auditable double-entry sales voucher to the general ledger.
            </div>
          )}

          {targetStage === 'DELIVERED' && (
            <div>
              <label className="block font-semibold text-ink-primary mb-1">Recipient Name / Signature *</label>
              <input
                type="text"
                required
                value={signatureName}
                onChange={e => setSignatureName(e.target.value)}
                className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
                placeholder="Person receiving goods at shop counter"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-ink-primary mb-1">Operational Notes / Reason</label>
            <textarea
              rows={3}
              value={stageNotes}
              onChange={e => setStageNotes(e.target.value)}
              className="w-full p-2 border border-divider rounded focus:border-brand focus:outline-none"
              placeholder="e.g. Loaded onto Van TN-69-AA-2341 by driver Murugan"
            />
          </div>

          <div className="pt-3 border-t border-divider flex justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsTransitionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Status Update
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Tax Invoice Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          title="Tax Invoice"
          subtitle={`Invoice #${selectedOrder.invoiceNumber || 'INV-DRAFT'}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsInvoiceModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => downloadInvoicePDF(selectedOrder, settings)}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => printElementById('printable-tax-invoice', `Tax-Invoice-${selectedOrder.orderNumber}`)}
              >
                Print Invoice
              </Button>
            </div>
          }
        >
          <div id="printable-tax-invoice" className="p-4 bg-white text-ink-primary text-xs">
            {/* Invoice Header */}
            <div className="header-box pb-3 border-b-2 border-brand mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-brand tracking-tight">{settings.businessName}</h1>
                <p className="text-xs font-semibold text-ink-primary">{settings.subTitle}</p>
                <p className="text-[11px] text-ink-secondary mt-0.5">{settings.address}, {settings.city} - {settings.pincode}</p>
                <p className="text-[11px] text-ink-secondary">GSTIN: <span className="font-mono font-bold text-ink-primary">{settings.gstin}</span> | FSSAI: {settings.fssaiNumber}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded bg-brand text-white font-bold text-[11px] mb-1">
                  TAX INVOICE
                </span>
                <p className="font-mono font-bold text-sm text-ink-primary">{selectedOrder.invoiceNumber}</p>
                <p className="text-[11px] text-ink-secondary">Date: {formatDate(selectedOrder.orderDate)}</p>
                <p className="text-[11px] text-ink-secondary">Order Ref: {selectedOrder.orderNumber}</p>
              </div>
            </div>

            {/* Billed To / Shipped To */}
            <div className="grid grid-cols-2 gap-4 pb-3 border-b border-divider mb-4 text-[11px]">
              <div>
                <p className="font-bold text-ink-secondary uppercase tracking-wider text-[10px]">Billed & Shipped To:</p>
                <p className="font-bold text-sm text-ink-primary mt-0.5">{selectedOrder.retailerShopName}</p>
                <p className="text-ink-secondary">Proprietor: {selectedOrder.retailerOwnerName}</p>
                <p className="text-ink-secondary">{selectedOrder.deliveryAddress}</p>
                <p className="text-ink-secondary">Phone: {selectedOrder.retailerPhone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink-secondary uppercase tracking-wider text-[10px]">Payment Details:</p>
                <p className="font-semibold text-ink-primary mt-0.5">Terms: {selectedOrder.paymentMethod}</p>
                <p className="text-ink-secondary">Bank: {settings.bankDetails.bankName}</p>
                <p className="text-ink-secondary font-mono">A/c: {settings.bankDetails.accountNumber}</p>
                <p className="text-ink-secondary font-mono">IFSC: {settings.bankDetails.ifscCode}</p>
                <p className="text-ink-secondary font-mono">UPI: {settings.bankDetails.upiId}</p>
              </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse mb-4 text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-y border-divider font-semibold text-ink-primary">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Description of Goods</th>
                  <th className="py-2 px-2 text-left">HSN</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Rate (₹)</th>
                  <th className="py-2 px-2 text-right">Taxable (₹)</th>
                  <th className="py-2 px-2 text-right">GST %</th>
                  <th className="py-2 px-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {selectedOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-2">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium">{it.productName} ({it.packSize})</td>
                    <td className="py-2 px-2 font-mono text-ink-secondary">2103</td>
                    <td className="py-2 px-2 text-right font-bold">{it.quantity}</td>
                    <td className="py-2 px-2 text-right text-num">{it.unitPrice.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-num">{it.taxableAmount.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right">{it.gstPercent}%</td>
                    <td className="py-2 px-2 text-right font-bold text-num">{it.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-between items-start pt-2 border-t border-divider">
              <div className="text-[11px] text-ink-secondary max-w-xs">
                <p className="font-bold text-ink-primary">Declaration:</p>
                <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
              </div>
              <div className="w-64 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Taxable Amount:</span>
                  <span className="font-semibold text-num">{formatINR(selectedOrder.taxableSubtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">CGST:</span>
                  <span className="font-semibold text-num">{formatINR(selectedOrder.totalGst / 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">SGST:</span>
                  <span className="font-semibold text-num">{formatINR(selectedOrder.totalGst / 2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-divider text-sm font-bold text-brand">
                  <span>Grand Total:</span>
                  <span className="text-num">{formatINR(selectedOrder.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 flex justify-between items-end text-[11px] text-ink-secondary">
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-300 w-36 mb-1"></div>
                <p>Receiver's Counter Signature</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-300 w-44 mb-1"></div>
                <p className="font-semibold text-ink-primary">For {settings.distributorName}</p>
                <p className="text-[10px]">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
