import React from 'react';

interface DigitBoxProps {
  prefix?: string;
  value: string | number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  className?: string;
}

/**
 * DigitBox Component:
 * Renders numbers in a roll-number style bordered monospace digit cell.
 */
export const DigitBox: React.FC<DigitBoxProps> = ({
  prefix,
  value,
  label,
  size = 'md',
  active = false,
  className = ''
}) => {
  const formattedValue = typeof value === 'number' ? String(value).padStart(2, '0') : value;

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs rounded-sm min-w-[28px]',
    md: 'px-2.5 py-1 text-sm rounded-md min-w-[36px]',
    lg: 'px-3.5 py-1.5 text-base rounded-md min-w-[48px]'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {prefix && (
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-graphite-soft">
          {prefix}
        </span>
      )}
      <div
        className={`font-mono font-bold tracking-tight text-center border transition-colors ${
          sizeStyles[size]
        } ${
          active
            ? 'bg-ink-navy text-white border-ink-navy shadow-sm'
            : 'bg-sheet-2 text-graphite border-pencil-line'
        }`}
      >
        {formattedValue}
      </div>
      {label && (
        <span className="text-xs text-graphite-soft font-sans font-medium">
          {label}
        </span>
      )}
    </div>
  );
};
