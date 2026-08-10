import React from 'react';
import { motion } from 'motion/react';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

/**
 * ProgressBar Component:
 * Thin progress bar fill with ink-navy color and smooth motion transition.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (current / (total || 1)) * 100));

  return (
    <div className={`w-full bg-pencil-line/40 h-1.5 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className="bg-ink-navy h-full"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
};

interface TimerRingProps {
  secondsLeft: number;
  totalSeconds: number;
  size?: number;
}

/**
 * Countdown Timer Ring Component:
 * Circular countdown ring that fills down as time elapses and turns red-ink in the last 10s.
 */
export const TimerRing: React.FC<TimerRingProps> = ({
  secondsLeft,
  totalSeconds,
  size = 44
}) => {
  const isUrgent = secondsLeft <= 10;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-pencil-line)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isUrgent ? 'var(--accent-red-ink)' : 'var(--brand-ink-navy)'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span
        className={`absolute font-mono font-bold text-xs ${
          isUrgent ? 'text-red-ink animate-pulse' : 'text-graphite'
        }`}
      >
        {formatTime(secondsLeft)}
      </span>
    </div>
  );
};
