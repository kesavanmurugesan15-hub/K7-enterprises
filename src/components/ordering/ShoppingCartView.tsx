import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { dataService } from '../../services/dataService';
import { Retailer } from '../../types/auth';
import { PaymentMethod, SalesOrder } from '../../types/order';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatINR } from '../../utils/currency';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, Plus, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShoppingCartViewProps {
  onOrderPlaced: (orderId: string) => void;
  onContinueShopping: () => void;
}

export const ShoppingCartView: React.FC<ShoppingCartViewProps> = ({ onOrderPlaced, onContinueShopping }) => {
  const { currentUser, isRetailer, isSalesRep, isAdmin } = useAuth();
  const { cart, updateCartQuantity, removeFromCart, clearCart, cartSubtotal, cartGstTotal, cartGrandTotal } = useBusiness();
  const [retailers] = useState<Retailer[]>(dataService.getRetailers());

  // If a retailer is logged in, use their profile, otherwise allow sales rep / admin to pick retailer
  const defaultRetailer = retailers.find(r => r.id === currentUser.retailerId) || retailers[0];
  const [selectedRetailerId, setSelectedRetailerId] = useState(defaultRetailer?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<SalesOrder | null>(null);

  const selectedRetailer = retailers.find(r => r.id === selectedRetailerId) || defaultRetailer;

  // Credit limit calculation
  const wouldExceedCredit = paymentMethod === 'CREDIT' && (
    (selectedRetailer?.currentOutstanding || 0) + cartGrandTotal > (selectedRetailer?.creditLimit || 50000)
  );

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    if (!selectedRetailer) {
      alert('Please select a retail shop.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Execute transaction-safe order placement with backend price re-calculation
      const result = dataService.createSalesOrder({
        retailer: selectedRetailer,
        items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity })),
        paymentMethod,
        notes: orderNotes,
        salesRep: currentUser.role === 'sales_rep' ? currentUser : undefined,
        actor: currentUser
      });

      if (!result.success || !result.order) {
        alert(result.message || 'Order could not be placed.');
        setIsSubmitting(false);
        return;
      }

      // Success
      clearCart();
      setPlacedOrder(result.order);
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Confetti fallback
      }
    } catch (e: any) {
      alert(`Order placement failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-surface p-6 sm:p-8 rounded-xl border border-divider shadow-enterprise-md text-center space-y-4 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-bold text-ink-primary">Order Placed Successfully!</h2>
        <p className="text-xs text-ink-secondary">
          Order reference <span className="font-mono font-bold text-brand">{placedOrder.orderNumber}</span> has been transmitted to K7 Enterprise Thoothukudi distribution desk.
        </p>

        <div className="bg-slate-50 border border-divider rounded-lg p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-ink-secondary">Retail Shop:</span>
            <span className="font-semibold">{placedOrder.retailerShopName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary">Total Payable:</span>
            <span className="font-bold text-brand text-sm">{formatINR(placedOrder.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary">Payment Method:</span>
            <span className="font-medium">{placedOrder.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-secondary">Current Stage:</span>
            <Badge variant={placedOrder.currentStage === 'PENDING_APPROVAL' ? 'warning' : 'brand'}>
              {placedOrder.currentStage.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" size="md" onClick={onContinueShopping}>
            Book Another Order
          </Button>
          <Button variant="primary" size="md" onClick={() => onOrderPlaced(placedOrder.id)}>
            Track Live Delivery Status
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 bg-surface p-8 rounded-lg border border-divider text-center space-y-4 shadow-enterprise">
        <div className="w-14 h-14 bg-slate-100 text-ink-muted rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-base font-bold text-ink-primary">Your Shopping Cart is Empty</h3>
        <p className="text-xs text-ink-secondary">
          Explore the official Aachi Masala product catalogue to add packets and cases to your wholesale order.
        </p>
        <Button variant="primary" size="md" onClick={onContinueShopping}>
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-divider">
        <div>
          <h2 className="text-lg font-bold text-ink-primary">Wholesale Order Checkout</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Review item line totals, applicable GST, delivery terms and confirm booking.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onContinueShopping}>
          + Add More Products
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cart items list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface border border-divider rounded-lg shadow-enterprise overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-divider font-semibold text-xs text-ink-secondary uppercase tracking-wider flex justify-between items-center">
              <span>Cart Items ({cart.length})</span>
              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] text-rose-600 hover:underline lowercase font-medium"
              >
                Clear all
              </button>
            </div>

            <div className="divide-y divide-divider/70">
              {cart.map(item => {
                const lineTotal = item.product.sellingPriceWholesale * item.quantity;
                return (
                  <div key={item.product.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded border border-divider shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-ink-muted shrink-0">
                          <ShoppingBag className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-xs text-ink-primary">{item.product.name}</h4>
                        <div className="text-[11px] text-ink-secondary">
                          <span className="font-mono">{item.product.sku}</span> • {item.product.packSize}
                        </div>
                        <div className="text-[11px] text-brand font-bold text-num mt-0.5">
                          {formatINR(item.product.sellingPriceWholesale)} / pkt
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-divider rounded bg-slate-50 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-white flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-num">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-white flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-bold text-ink-primary text-num">{formatINR(lineTotal)}</p>
                        <p className="text-[10px] text-ink-muted">+{item.product.gstPercent}% GST</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-ink-muted hover:text-rose-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side checkout configuration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-divider rounded-lg p-5 shadow-enterprise space-y-4">
            <h3 className="text-sm font-bold text-ink-primary pb-3 border-b border-divider">
              Retailer & Payment Details
            </h3>

            {/* Retailer Selector for Sales Rep / Admin */}
            {!isRetailer && (
              <div>
                <label className="block text-xs font-semibold text-ink-primary mb-1">Select Ordering Retailer *</label>
                <select
                  value={selectedRetailerId}
                  onChange={e => setSelectedRetailerId(e.target.value)}
                  className="w-full p-2 border border-divider rounded bg-white text-xs"
                >
                  {retailers.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.shopName} ({r.area}) — Limit: {formatINR(r.creditLimit)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selected Retailer Credit Status */}
            {selectedRetailer && (
              <div className="p-3 bg-slate-50 border border-divider rounded text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>{selectedRetailer.shopName}</span>
                  <span className="text-ink-muted">{selectedRetailer.creditDays} Days Credit</span>
                </div>
                <div className="flex justify-between text-[11px] text-ink-secondary">
                  <span>Current Outstanding:</span>
                  <span className="font-bold text-rose-700">{formatINR(selectedRetailer.currentOutstanding)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-ink-secondary">
                  <span>Credit Limit:</span>
                  <span>{formatINR(selectedRetailer.creditLimit)}</span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2 border border-divider rounded bg-white text-xs"
              >
                <option value="CREDIT">Distributor Credit (14/21 Days Terms)</option>
                <option value="UPI">UPI Instant Payment (TMB QR Code)</option>
                <option value="CASH">Cash on Delivery (Van Handover)</option>
                <option value="BANK_TRANSFER">NEFT / RTGS Direct Bank Transfer</option>
              </select>
            </div>

            {/* Credit limit warning if exceeded */}
            {wouldExceedCredit && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Credit Limit Notice:</span> This order exceeds the shop's credit threshold. It will be submitted for Administrator credit approval before dispatch.
                </div>
              </div>
            )}

            {/* Order Notes */}
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1">Delivery Instructions / Remarks</label>
              <input
                type="text"
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full p-2 border border-divider rounded text-xs"
                placeholder="e.g. Deliver before 2:00 PM to Bryant Nagar counter"
              />
            </div>

            {/* Server-recalculated financial totals */}
            <div className="pt-3 border-t border-divider space-y-1.5 text-xs">
              <div className="flex justify-between text-ink-secondary">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold text-ink-primary text-num">{formatINR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Applicable GST (CGST + SGST):</span>
                <span className="font-semibold text-ink-primary text-num">{formatINR(cartGstTotal)}</span>
              </div>
              <div className="flex justify-between text-ink-secondary">
                <span>Delivery / Freight:</span>
                <span className="text-emerald-700 font-medium">Free (Distributor Van)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-divider text-base font-bold text-brand">
                <span>Total Payable:</span>
                <span className="text-num">{formatINR(cartGrandTotal)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handlePlaceOrder}
              isLoading={isSubmitting}
              className="w-full shadow-md"
            >
              Confirm & Book Order ({formatINR(cartGrandTotal)})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
