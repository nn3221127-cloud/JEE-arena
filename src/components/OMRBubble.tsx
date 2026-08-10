import React from 'react';
import { motion } from 'motion/react';
import { InkMark } from './InkMark';
import { MathText } from './MathText';

export interface OMROptionState {
  letter: string; // 'A', 'B', 'C', 'D'
  text: React.ReactNode | string;
  isSelected: boolean;
  isCorrect?: boolean;
  isRevealed: boolean;
  rationale?: string;
  isDisabled?: boolean;
  onClick: () => void;
}

/**
 * OMRBubble Component:
 * Performs instant answer selection + smooth simultaneous accordion rationale expansion on reveal.
 */
export const OMRBubble: React.FC<OMROptionState> = ({
  letter,
  text,
  isSelected,
  isCorrect,
  isRevealed,
  rationale,
  isDisabled = false,
  onClick
}) => {
  // Theme styling based on status
  let bubbleClasses = 'border-2 border-[#353535] bg-[#21242B] text-white group-hover:border-[#4158FE]';
  let containerClasses = 'border-[#2D3139] bg-[var(--quiz-card-bg,#191C23)] hover:border-[#4158FE] hover:bg-[#21242B] cursor-pointer';

  if (isRevealed) {
    if (isCorrect) {
      bubbleClasses = 'bg-[var(--quiz-correct-label,#6BD586)] border-[var(--quiz-correct-label,#6BD586)] text-[#191C23]';
      containerClasses = 'border-[var(--quiz-correct-label,#6BD586)] bg-[var(--quiz-correct-bg,#1E2E24)] shadow-sm';
    } else if (isSelected && !isCorrect) {
      bubbleClasses = 'bg-[var(--quiz-wrong-border,#B1251E)] border-[var(--quiz-wrong-border,#B1251E)] text-white';
      containerClasses = 'border-[var(--quiz-wrong-border,#B1251E)] bg-[var(--quiz-wrong-bg,#311E22)] shadow-sm';
    } else {
      containerClasses = 'border-[#2D3139] bg-[var(--quiz-card-bg,#191C23)] opacity-85';
    }
  } else if (isSelected) {
    bubbleClasses = 'bg-[#4158FE] border-[#4158FE] text-white';
    containerClasses = 'border-[#4158FE] bg-[#21242B] ring-1 ring-[#4158FE] shadow-sm';
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isRevealed}
      className={`group w-full text-left p-4 rounded-xl border transition-all duration-150 flex flex-col gap-2 ${containerClasses}`}
    >
      <div className="flex items-center gap-3.5 w-full min-h-[32px]">
        {/* OMR Bubble Circle */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-sm shrink-0 transition-colors duration-200 relative ${bubbleClasses}`}
        >
          {isRevealed && isCorrect ? (
            <InkMark type="tick" size={16} className="text-[#191C23]" />
          ) : isRevealed && isSelected && !isCorrect ? (
            <InkMark type="cross" size={16} className="text-white" />
          ) : (
            <span>{letter}</span>
          )}
        </div>

        {/* Option Text */}
        <div className="font-sans text-base text-gray-100 leading-relaxed flex-1">
          {typeof text === 'string' ? <MathText text={text} /> : text}
        </div>
      </div>

      {/* Accordion Rationale Reveal (180ms ease-out simultaneous expansion) */}
      <motion.div
        initial={false}
        animate={{
          height: isRevealed && rationale ? 'auto' : 0,
          opacity: isRevealed && rationale ? 1 : 0
        }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.18,
          ease: 'easeOut'
        }}
        className="overflow-hidden w-full"
      >
        <div className="pt-2 pl-10 pr-2 border-t border-white/5 space-y-1">
          {isRevealed && isCorrect && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--quiz-correct-label,#6BD586)] uppercase tracking-wider mb-1">
              <InkMark type="tick" size={14} className="text-[var(--quiz-correct-label,#6BD586)]" />
              <span>Right answer</span>
            </div>
          )}
          {isRevealed && isSelected && !isCorrect && (
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--quiz-wrong-border,#B1251E)] uppercase tracking-wider mb-1">
              <InkMark type="cross" size={14} className="text-[var(--quiz-wrong-border,#B1251E)]" />
              <span>Not quite</span>
            </div>
          )}

          <div
            className={`text-sm font-sans leading-relaxed ${
              isCorrect
                ? 'text-gray-200 font-medium'
                : isSelected
                ? 'text-gray-200'
                : 'text-[var(--quiz-text-muted,#9CA3AF)]'
            }`}
          >
            {rationale ? <MathText text={rationale} /> : null}
          </div>
        </div>
      </motion.div>
    </button>
  );
};
