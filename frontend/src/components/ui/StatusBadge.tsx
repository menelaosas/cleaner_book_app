'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';

export interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: BookingStatus;
  showIcon?: boolean;
}

const statusConfig: Record<
  BookingStatus,
  {
    bgColor: string;
    textColor: string;
    icon: typeof Clock;
  }
> = {
  PENDING: {
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-400',
    icon: Clock,
  },
  CONFIRMED: {
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-400',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-400',
    icon: Play,
  },
  AWAITING_CONFIRMATION: {
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-400',
    icon: AlertCircle,
  },
  COMPLETED: {
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-400',
    icon: CheckCircle,
  },
  CANCELLED: {
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-400',
    icon: XCircle,
  },
};

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showIcon = true, className = '', ...props }, ref) => {
    const { t } = useLanguage();
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;
    const label = t('statusLabels', status);

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
          ${config.bgColor}
          ${config.textColor}
          ${className}
        `}
        {...props}
      >
        {showIcon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
