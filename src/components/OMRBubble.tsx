import React from 'react';
import { InkMark } from './InkMark';

export interface OMROptionState {
  letter: string; // 'A', 'B', 'C', 'D'
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

/**
 * OMRBubble Component:
 * Recreates the OMR bubble shading experience + drawn ink mark reveal.
 */
export const OMRBubble: React.FC<OMROptionState> = ({
  letter,
  text,
  isSelected,
  isCorrect,
  isRevealed,
  isDisabled = false,
  onClick
}) => {
  // Determine bubble fill & stroke states
  let bubbleClasses = 'border-2 border-pencil-line bg-sheet text-graphite group-hover:border-ink-navy';
  let containerClasses = 'border-pencil-line bg-sheet hover:border-ink-navy hover:bg-sheet-2 cursor-pointer';
  let badgeText = letter;

  if (isRevealed) {
    if (isCorrect) {
      bubbleClasses = 'bg-exam-green border-exam-green text-white';
      containerClasses = 'border-exam-green bg-exam-green-soft/40 shadow-sm';
    } else if (isSelected && !isCorrect) {
      bubbleClasses = 'bg-red-ink border-red-ink text-white';
      containerClasses = 'border-red-ink bg-red-ink-soft/40 shadow-sm';
    } else {
      containerClasses = 'border-pencil-line bg-sheet/50 opacity-50 cursor-not-allowed';
    }
  } else if (isSelected) {
    bubbleClasses = 'bg-ink-navy border-ink-navy text-white animate-ink-bleed';
    containerClasses = 'border-ink-navy bg-sheet-2 ring-1 ring-ink-navy shadow-sm';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isRevealed}
      className={`group w-full text-left p-4 rounded-md border-1.5 transition-all duration-150 flex items-center gap-3.5 min-h-[56px] ${containerClasses}`}
    >
      {/* OMR Bubble Circle */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-colors duration-200 relative ${bubbleClasses}`}
      >
        {isRevealed && isCorrect ? (
          <InkMark type="tick" size={18} className="text-white" />
        ) : isRevealed && isSelected && !isCorrect ? (
          <InkMark type="cross" size={18} className="text-white" />
        ) : (
          <span>{badgeText}</span>
        )}
      </div>

      {/* Option Text */}
      <span className="font-sans text-base text-graphite leading-relaxed flex-1">
        {text}
      </span>

      {/* Status indicator text tag on reveal */}
      {isRevealed && isCorrect && (
        <span className="font-mono text-xs font-semibold uppercase text-exam-green px-2 py-0.5 rounded bg-exam-green-soft shrink-0">
          Correct Answer
        </span>
      )}
      {isRevealed && isSelected && !isCorrect && (
        <span className="font-mono text-xs font-semibold uppercase text-red-ink px-2 py-0.5 rounded bg-red-ink-soft shrink-0">
          Your Answer
        </span>
      )}
    </button>
  );
};
