import React from 'react';

interface InkMarkProps {
  type: 'tick' | 'cross';
  size?: number;
  className?: string;
  animate?: boolean;
}

/**
 * InkMark Component:
 * Signature hand-drawn ink stroke (tick or cross) rendered with SVG path stroke-dashoffset animation.
 */
export const InkMark: React.FC<InkMarkProps> = ({
  type,
  size = 24,
  className = '',
  animate = true
}) => {
  if (type === 'tick') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${className}`}
        aria-label="Correct"
      >
        {/* Hand-drawn organic tick stroke with slight natural wobble */}
        <path
          d="M 4.5 12.5 C 7.2 15.1 8.8 17.2 10.2 19.5 C 13.8 13.8 17.5 8.5 21.5 4.5"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? 'animate-draw-stroke' : ''}
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      aria-label="Incorrect"
    >
      {/* Hand-drawn organic cross with two strokes */}
      <path
        d="M 5 5 C 9.5 9.5 14.5 14.5 19 19"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'animate-draw-stroke' : ''}
      />
      <path
        d="M 19 5 C 14.5 9.5 9.5 14.5 5 19"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? 'animate-draw-stroke' : ''}
        style={{ animationDelay: '100ms' }}
      />
    </svg>
  );
};
