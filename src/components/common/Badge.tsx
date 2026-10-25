import React from 'react';
import clsx from 'clsx';
import { DeliveryStage, PaymentStatus } from '../../types/order';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className
}) => {
  const variantStyles = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200 border',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 border',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 border',
    error: 'bg-rose-50 text-rose-700 border-rose-200 border',
    info: 'bg-sky-50 text-sky-700 border-sky-200 border',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 border'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium'
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 leading-none text-nowrap', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
};

export const DeliveryStageBadge: React.FC<{ stage: DeliveryStage }> = ({ stage }) => {
  const map: Record<DeliveryStage, { label: string; variant: BadgeProps['variant'] }> = {
    ORDER_PLACED: { label: 'Order Placed', variant: 'neutral' },
    PENDING_APPROVAL: { label: 'Approval Required', variant: 'warning' },
    ACCEPTED: { label: 'Accepted', variant: 'info' },
    STOCK_ALLOCATED: { label: 'Stock Allocated', variant: 'info' },
    PACKING_IN_PROGRESS: { label: 'Packing', variant: 'brand' },
    READY_FOR_DISPATCH: { label: 'Ready for Dispatch', variant: 'brand' },
    DISPATCHED: { label: 'Dispatched', variant: 'brand' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', variant: 'warning' },
    DELIVERED: { label: 'Delivered', variant: 'success' },
    FAILED_DELIVERY: { label: 'Delivery Exception', variant: 'error' },
    CANCELLED: { label: 'Cancelled', variant: 'error' }
  };

  const item = map[stage] || { label: stage, variant: 'neutral' };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const map: Record<PaymentStatus, { label: string; variant: BadgeProps['variant'] }> = {
    PAID: { label: 'Paid', variant: 'success' },
    PARTIALLY_PAID: { label: 'Partially Paid', variant: 'warning' },
    PENDING: { label: 'Pending', variant: 'neutral' },
    VERIFICATION_REQUIRED: { label: 'Verify Payment', variant: 'warning' },
    FAILED: { label: 'Failed', variant: 'error' }
  };

  const item = map[status] || { label: status, variant: 'neutral' };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};
