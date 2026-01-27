'use client';

import { forwardRef, HTMLAttributes, useState } from 'react';
import { Star } from 'lucide-react';

export interface StarRatingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  maxStars?: number;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

const StarRating = forwardRef<HTMLDivElement, StarRatingProps>(
  (
    {
      value = 0,
      onChange,
      readonly = false,
      size = 'md',
      showValue = false,
      maxStars = 5,
      className = '',
      ...props
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const displayValue = hoverValue !== null ? hoverValue : value;

    const handleMouseEnter = (starIndex: number) => {
      if (!readonly && onChange) {
        setHoverValue(starIndex);
      }
    };

    const handleMouseLeave = () => {
      setHoverValue(null);
    };

    const handleClick = (starIndex: number) => {
      if (!readonly && onChange) {
        onChange(starIndex);
      }
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center gap-1 ${className}`}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {Array.from({ length: maxStars }, (_, i) => {
          const starIndex = i + 1;
          const isFilled = starIndex <= displayValue;
          const isHalf = !isFilled && starIndex - 0.5 <= displayValue;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              disabled={readonly}
              className={`
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                transition-transform focus:outline-none disabled:opacity-100
              `}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  ${
                    isFilled
                      ? 'fill-yellow-400 text-yellow-400'
                      : isHalf
                      ? 'fill-yellow-400/50 text-yellow-400'
                      : 'fill-transparent text-gray-300 dark:text-gray-600'
                  }
                  transition-colors
                `}
              />
            </button>
          );
        })}
        {showValue && (
          <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            {value.toFixed(1)}
          </span>
        )}
      </div>
    );
  }
);

StarRating.displayName = 'StarRating';

export { StarRating };
