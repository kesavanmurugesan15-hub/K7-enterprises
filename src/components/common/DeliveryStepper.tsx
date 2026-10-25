import React from 'react';
import { DeliveryStage, DeliveryStageHistory } from '../../types/order';
import { Check, Clock, AlertTriangle, XCircle, Truck, Package, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';
import { formatDateTime } from '../../utils/date';

interface DeliveryStepperProps {
  currentStage: DeliveryStage;
  history: DeliveryStageHistory[];
}

const ORDER_STAGES: { stage: DeliveryStage; label: string; icon: React.ElementType }[] = [
  { stage: 'ORDER_PLACED', label: 'Order Placed', icon: ShoppingCart },
  { stage: 'ACCEPTED', label: 'Accepted', icon: Check },
  { stage: 'STOCK_ALLOCATED', label: 'Stock Allocated', icon: Package },
  { stage: 'PACKING_IN_PROGRESS', label: 'Packing', icon: Package },
  { stage: 'READY_FOR_DISPATCH', label: 'Ready', icon: Check },
  { stage: 'DISPATCHED', label: 'Dispatched', icon: Truck },
  { stage: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
  { stage: 'DELIVERED', label: 'Delivered', icon: Check }
];

export const DeliveryStepper: React.FC<DeliveryStepperProps> = ({ currentStage, history }) => {
  const isFailed = currentStage === 'FAILED_DELIVERY';
  const isCancelled = currentStage === 'CANCELLED';
  const isPendingApproval = currentStage === 'PENDING_APPROVAL';

  // Get current active index
  const currentIndex = ORDER_STAGES.findIndex(s => s.stage === currentStage);

  return (
    <div className="py-3">
      {/* Special status banners */}
      {isPendingApproval && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-900">
            <span className="font-semibold">Pending Credit Approval:</span> This order exceeds the retailer's allocated credit limit and requires administrative authorization before packing.
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs text-rose-900">
            <span className="font-semibold">Order Cancelled:</span> Stock reservations have been restored to available inventory.
          </div>
        </div>
      )}

      {isFailed && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3.5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs text-rose-900">
            <span className="font-semibold">Delivery Exception:</span> Delivery attempt failed. Review driver notes below.
          </div>
        </div>
      )}

      {/* Stepper bar for standard progression */}
      {!isCancelled && (
        <div className="relative">
          <div className="hidden md:flex items-center justify-between relative z-10">
            {ORDER_STAGES.map((s, idx) => {
              const isPast = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const Icon = s.icon;
              const historyItem = history.find(h => h.stage === s.stage);

              return (
                <div key={s.stage} className="flex flex-col items-center flex-1 text-center group">
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors border-2 bg-surface',
                      isCurrent ? 'border-brand text-brand bg-brand-50 shadow-sm ring-4 ring-brand-100' :
                      isPast ? 'border-emerald-600 bg-emerald-600 text-white' :
                      'border-slate-300 text-slate-400'
                    )}
                  >
                    {isPast && !isCurrent ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
                  </div>

                  <span
                    className={clsx(
                      'text-xs mt-2 font-medium leading-tight max-w-[80px]',
                      isCurrent ? 'text-brand font-semibold' :
                      isPast ? 'text-ink-primary' : 'text-slate-400'
                    )}
                  >
                    {s.label}
                  </span>

                  {historyItem && (
                    <span className="text-[10px] text-ink-muted mt-0.5 whitespace-nowrap">
                      {formatDateTime(historyItem.timestamp).split(',')[1]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Background Connecting line */}
          <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{
                width: `${currentIndex >= 0 ? (currentIndex / (ORDER_STAGES.length - 1)) * 100 : 0}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Detailed Stage History Trail */}
      <div className="mt-6 pt-5 border-t border-divider">
        <h4 className="text-xs font-semibold uppercase text-ink-secondary tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Stage Transition Audit Trail
        </h4>
        <div className="space-y-3">
          {history.map((h, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-primary">{h.stage.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-ink-muted">{formatDateTime(h.timestamp)}</span>
                </div>
                <div className="text-ink-secondary mt-0.5">
                  Updated by: <span className="font-medium text-ink-primary">{h.updatedByUserName}</span>
                  {h.notes && <span className="italic ml-2">"{h.notes}"</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
