import React, { useEffect, useState } from 'react';

interface ScoreCircleProps {
  score: number;
  total: number;
  accuracyPercentage: number;
  timeSpentText?: string;
  className?: string;
}

/**
 * ScoreCircle Component:
 * Signature Moment 2: Hand-drawn red-ink circle that draws itself around the final score on load (~600ms),
 * with score numerals counting up inside in Plex Mono.
 */
export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  total,
  accuracyPercentage,
  timeSpentText,
  className = ''
}) => {
  const [displayedScore, setDisplayedScore] = useState(0);

  useEffect(() => {
    // Count-up animation for score
    let start = 0;
    const duration = 600; // ms
    const stepTime = Math.max(10, Math.floor(duration / (score || 1)));

    const timer = setInterval(() => {
      start += 1;
      if (start >= score) {
        setDisplayedScore(score);
        clearInterval(timer);
      } else {
        setDisplayedScore(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className={`flex flex-col items-center justify-center text-center py-6 relative ${className}`}>
      {/* Red Ink Drawn Circle Container */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
        {/* Irregular hand-drawn organic SVG circle stroke */}
        <svg
          className="absolute inset-0 w-full h-full text-red-ink overflow-visible"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 100 15 
               C 145 12, 188 45, 185 98 
               C 182 152, 142 188, 96 185 
               C 48 182, 12 142, 15 95 
               C 18 48, 52 18, 98 15"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-circle"
          />
        </svg>

        {/* Score Inside Circle */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="font-mono text-5xl sm:text-6xl font-bold tracking-tight text-graphite">
            {displayedScore}
            <span className="text-2xl sm:text-3xl font-normal text-graphite-soft">
              /{total}
            </span>
          </div>
          <div className="mt-1 text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider text-red-ink">
            Total Score
          </div>
        </div>
      </div>

      {/* Accuracy Subtitle */}
      <div className="mt-6 text-2xl font-bold font-sans text-graphite">
        <span className="font-mono text-3xl font-extrabold text-ink-navy">
          {accuracyPercentage}%
        </span>{' '}
        Accuracy
      </div>

      {timeSpentText && (
        <div className="mt-1 font-mono text-sm text-graphite-soft">
          Time taken: {timeSpentText}
        </div>
      )}
    </div>
  );
};
