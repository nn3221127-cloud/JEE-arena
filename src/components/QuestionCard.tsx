import React, { useState, useEffect, useRef } from 'react';
import { Atom, FlaskConical, Calculator, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { RegistrationCorners } from './RegistrationCorners';
import { OMRBubble } from './OMRBubble';
import { MathText } from './MathText';

export interface QuestionData {
  id: string;
  question_text: string;
  options: string[]; // 4 options
  correct_option_index?: number; // 0, 1, 2, 3 (optional until reveal)
  option_rationales?: string[]; // 4 per-option rationales
  hint?: string;
  explanation?: string;
  subject: string; // 'Physics', 'Chemistry', 'Mathematics'
  topic: string;
  image_url?: string;
}

interface QuestionCardProps {
  question: QuestionData;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (questionId: string, selectedIndex: number) => Promise<{
    is_correct: boolean;
    correct_option_index: number;
    option_rationales?: string[];
    explanation?: string;
  } | void> | void;
  disabled?: boolean;
}

export const QuestionCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-6 sm:p-8 shadow-sm max-w-[720px] mx-auto w-full animate-pulse">
      <RegistrationCorners />
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#2D3139]">
        <div className="h-6 w-40 bg-[#21242B] rounded border border-[#2D3139]" />
        <div className="h-4 w-28 bg-[#21242B] rounded" />
      </div>
      <div className="space-y-3 mb-8">
        <div className="h-5 bg-[#21242B] rounded w-full" />
        <div className="h-5 bg-[#21242B] rounded w-4/5" />
      </div>
      <div className="flex flex-col gap-3 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[#21242B] rounded-xl border border-[#2D3139]" />
        ))}
      </div>
    </div>
  );
};

/**
 * QuestionCard Component:
 * Single-column full-width options stack, collapsible hint pill, MathText LaTeX rendering,
 * and per-option simultaneous rationale accordion expansion on selection.
 */
export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswerSubmit,
  disabled = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [revealedResult, setRevealedResult] = useState<{
    is_correct: boolean;
    correct_option_index: number;
    option_rationales?: string[];
    explanation?: string;
  } | null>(null);

  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Task 5: Reset scroll position to top when question changes
  useEffect(() => {
    setSelectedIndex(null);
    setIsRevealed(false);
    setShowHint(false);
    setRevealedResult(null);

    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  }, [question.id]);

  const letters = ['A', 'B', 'C', 'D'];

  const handleSelectOption = async (index: number) => {
    if (disabled || isRevealed) return;
    setSelectedIndex(index);
    setIsRevealed(true);

    // Task 5: Scroll selected option smoothly into view
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setTimeout(() => {
      optionRefs.current[index]?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'nearest'
      });
    }, 50);

    const result = await onAnswerSubmit(question.id, index);
    if (result) {
      setRevealedResult(result);
    }
  };

  const effectiveCorrectIndex = revealedResult?.correct_option_index ?? question.correct_option_index;
  const rationales = revealedResult?.option_rationales ?? question.option_rationales;

  // Distinct subject color-coding and icons
  const subjectStyles: Record<string, { chip: string; icon: React.ReactNode }> = {
    Physics: {
      chip: 'bg-[#4158FE]/10 border-[#4158FE]/30 text-[#6B80FF] font-bold',
      icon: <Atom size={14} className="text-[#6B80FF]" />
    },
    Chemistry: {
      chip: 'bg-[var(--quiz-correct-bg,#1E2E24)] border-[var(--quiz-correct-label,#6BD586)]/40 text-[var(--quiz-correct-label,#6BD586)] font-bold',
      icon: <FlaskConical size={14} className="text-[var(--quiz-correct-label,#6BD586)]" />
    },
    Mathematics: {
      chip: 'bg-[var(--quiz-wrong-bg,#311E22)] border-[var(--quiz-wrong-border,#B1251E)]/40 text-[var(--quiz-wrong-border,#B1251E)] font-bold',
      icon: <Calculator size={14} className="text-[var(--quiz-wrong-border,#B1251E)]" />
    }
  };

  const subjectConfig = subjectStyles[question.subject] || {
    chip: 'bg-[#21242B] border-[#2D3139] text-gray-400 font-semibold',
    icon: <Atom size={14} className="text-gray-400" />
  };

  return (
    <div className="relative bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-6 sm:p-8 md:p-10 shadow-lg max-w-[720px] mx-auto w-full transition-all text-gray-100">
      <RegistrationCorners />

      {/* Meta Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-[#2D3139]">
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono ${subjectConfig.chip}`}>
          {subjectConfig.icon}
          <span>{question.subject}</span>
          <span>·</span>
          <span className="font-normal opacity-90">{question.topic}</span>
        </div>

        <div className="text-xs font-mono font-bold text-[var(--quiz-text-muted,#9CA3AF)]">
          Question {String(questionNumber).padStart(2, '0')} of {String(totalQuestions).padStart(2, '0')}
        </div>
      </div>

      {/* Question Text with Typeset Math */}
      <div className="font-sans text-lg sm:text-xl font-medium text-white leading-relaxed mb-6">
        <MathText text={question.question_text} />
      </div>

      {/* Embedded Diagram / Image if present */}
      {question.image_url && (
        <div className="mb-6 overflow-hidden rounded-xl border border-[#2D3139] bg-[#21242B] p-2">
          <img
            src={question.image_url}
            alt="Question Diagram"
            className="max-h-72 w-auto mx-auto object-contain rounded-lg"
          />
        </div>
      )}

      {/* Collapsible Hint Pill (Task 4) */}
      {question.hint && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#4158FE]/30 bg-[#4158FE]/10 text-[#6B80FF] hover:bg-[#4158FE]/20 text-xs font-mono font-semibold transition-all cursor-pointer"
            aria-expanded={showHint}
          >
            <Lightbulb size={14} className="text-[#6B80FF]" />
            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
            {showHint ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showHint && (
            <div className="mt-2.5 p-3.5 rounded-xl border border-[#4158FE]/20 bg-[#21242B] text-sm text-gray-200 font-sans leading-relaxed animate-fade-in">
              <span className="block text-[10px] font-mono font-bold uppercase text-[#6B80FF] mb-1 tracking-wider">
                Hint:
              </span>
              <MathText text={question.hint} />
            </div>
          )}
        </div>
      )}

      {/* Options Stack: Single-column full-width list (Task 4) */}
      <div className="flex flex-col gap-3.5">
        {question.options.map((optionText, idx) => {
          const isThisSelected = selectedIndex === idx;
          const isThisCorrect = effectiveCorrectIndex !== undefined && idx === effectiveCorrectIndex;
          const optionRationale = rationales?.[idx];

          return (
            <div key={idx} ref={(el) => (optionRefs.current[idx] = el)}>
              <OMRBubble
                letter={letters[idx]}
                text={optionText}
                isSelected={isThisSelected}
                isCorrect={isThisCorrect}
                isRevealed={isRevealed}
                rationale={optionRationale}
                isDisabled={disabled}
                onClick={() => handleSelectOption(idx)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
