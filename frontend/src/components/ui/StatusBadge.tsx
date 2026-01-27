'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { Clock, CheckCircle, XCircle, Play, AlertCircle } from 'lucide-react';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'CANCELLED';

export interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: BookingStatus;
  showIcon?: boolean;
}

const statusConfig: Record<
  BookingStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    icon: typeof Clock;
  }
> = {
  PENDING: {
    label: 'Pending',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-800 dark:text-yellow-400',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmed',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-800 dark:text-blue-400',
    icon: CheckCircle,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-800 dark:text-purple-400',
    icon: Play,
  },
  AWAITING_CONFIRMATION: {
    label: 'Awaiting Confirmation',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-800 dark:text-orange-400',
    icon: AlertCircle,
  },
  COMPLETED: {
    label: 'Completed',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-800 dark:text-green-400',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelled',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-800 dark:text-red-400',
    icon: XCircle,
  },
};

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showIcon = true, className = '', ...props }, ref) => {
    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

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
        {config.label}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
