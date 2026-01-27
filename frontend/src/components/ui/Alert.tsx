'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  icon?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantConfig = {
  info: {
    containerClass: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    iconClass: 'text-blue-500 dark:text-blue-400',
    titleClass: 'text-blue-900 dark:text-blue-100',
    textClass: 'text-blue-800 dark:text-blue-200',
    icon: Info,
  },
  success: {
    containerClass: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    iconClass: 'text-green-500 dark:text-green-400',
    titleClass: 'text-green-900 dark:text-green-100',
    textClass: 'text-green-800 dark:text-green-200',
    icon: CheckCircle,
  },
  warning: {
    containerClass: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    iconClass: 'text-yellow-500 dark:text-yellow-400',
    titleClass: 'text-yellow-900 dark:text-yellow-100',
    textClass: 'text-yellow-800 dark:text-yellow-200',
    icon: AlertTriangle,
  },
  error: {
    containerClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    iconClass: 'text-red-500 dark:text-red-400',
    titleClass: 'text-red-900 dark:text-red-100',
    textClass: 'text-red-800 dark:text-red-200',
    icon: XCircle,
  },
};

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      icon,
      dismissible = false,
      onDismiss,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
      <div
        ref={ref}
        className={`
          p-4 rounded-xl border flex items-start gap-3
          ${config.containerClass}
          ${className}
        `}
        role="alert"
        {...props}
      >
        <div className={`flex-shrink-0 ${config.iconClass}`}>
          {icon || <Icon className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-medium ${config.titleClass}`}>{title}</p>
          )}
          <div className={`text-sm ${config.textClass}`}>{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${config.iconClass} hover:opacity-70 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export { Alert };
