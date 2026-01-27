'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export interface HeaderProps extends HTMLAttributes<HTMLElement> {
  showLogo?: boolean;
  showBack?: boolean;
  backHref?: string;
  title?: string;
  rightContent?: ReactNode;
  sticky?: boolean;
  transparent?: boolean;
}

const Header = forwardRef<HTMLElement, HeaderProps>(
  (
    {
      showLogo = true,
      showBack = false,
      backHref = '/',
      title,
      rightContent,
      sticky = false,
      transparent = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      w-full border-b border-gray-200 dark:border-gray-700
      ${transparent ? 'bg-transparent' : 'bg-white dark:bg-gray-800'}
      ${sticky ? 'sticky top-0 z-50' : ''}
    `;

    return (
      <header ref={ref} className={`${baseStyles} ${className}`} {...props}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {showBack && (
                <Link
                  href={backHref}
                  className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </Link>
              )}
              {showLogo && (
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Home className="w-6 h-6 text-primary" />
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Serenity
                  </span>
                </Link>
              )}
              {title && !showLogo && (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
              )}
            </div>
            {children}
            {rightContent && <div className="flex items-center gap-4">{rightContent}</div>}
          </div>
        </div>
      </header>
    );
  }
);

Header.displayName = 'Header';

export { Header };
