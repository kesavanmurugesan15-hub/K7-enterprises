import React from 'react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
  accentColor?: 'brand' | 'success' | 'warning' | 'info';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  accentColor = 'brand',
  className
}) => {
  const iconColorMap = {
    brand: 'text-brand bg-brand-50 border-brand-200',
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    info: 'text-sky-700 bg-sky-50 border-sky-200'
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface border border-divider rounded-lg p-5 shadow-enterprise transition-all',
        onClick && 'cursor-pointer hover:border-brand-border hover:shadow-enterprise-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-ink-secondary uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-ink-primary text-num tracking-tight">{value}</p>
        </div>
        <div className={clsx('p-2.5 rounded-lg border', iconColorMap[accentColor])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-divider/60 flex items-center justify-between text-xs">
          {subtitle && <span className="text-ink-secondary">{subtitle}</span>}
          {trend && (
            <span className={clsx('font-medium', trend.isPositive ? 'text-emerald-600' : 'text-rose-600')}>
              {trend.value} <span className="text-ink-secondary font-normal">{trend.label}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
