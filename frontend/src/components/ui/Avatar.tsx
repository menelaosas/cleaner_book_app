'use client';

import { forwardRef, HTMLAttributes } from 'react';
import { User, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  verified?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const badgeSizes = {
  sm: 'w-3 h-3 -right-0.5 -bottom-0.5',
  md: 'w-3.5 h-3.5 -right-0.5 -bottom-0.5',
  lg: 'w-4 h-4 -right-1 -bottom-1',
  xl: 'w-5 h-5 -right-1 -bottom-1',
  '2xl': 'w-6 h-6 -right-1 -bottom-1',
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    { src, alt = '', fallback, size = 'md', verified = false, className = '', ...props },
    ref
  ) => {
    const initials = fallback
      ? fallback
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '';

    return (
      <div ref={ref} className={`relative inline-block ${className}`} {...props}>
        <div
          className={`
            ${sizeClasses[size]}
            rounded-full overflow-hidden
            bg-gray-200 dark:bg-gray-700
            flex items-center justify-center
            font-medium text-gray-600 dark:text-gray-300
          `}
        >
          {src ? (
            <Image
              src={src}
              alt={alt}
              fill
              className="object-cover"
              sizes={`(max-width: 768px) ${sizeClasses[size].split(' ')[0]}, ${sizeClasses[size].split(' ')[0]}`}
            />
          ) : initials ? (
            <span>{initials}</span>
          ) : (
            <User className="w-1/2 h-1/2" />
          )}
        </div>
        {verified && (
          <div
            className={`
              absolute ${badgeSizes[size]}
              bg-white dark:bg-gray-800 rounded-full
              flex items-center justify-center
            `}
          >
            <CheckCircle className="w-full h-full text-primary" />
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
