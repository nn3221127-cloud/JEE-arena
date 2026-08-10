import React, { useState } from 'react';
import { Atom, FlaskConical, Calculator } from 'lucide-react';
import { RegistrationCorners } from './RegistrationCorners';
import { OMRBubble } from './OMRBubble';
import { InkMark } from './InkMark';
import { MathText } from './MathText';

export interface QuestionData {
  id: string;
  question_text: string;
  options: string[]; // 4 options
  correct_option_index?: number; // 0, 1, 2, 3 (optional until reveal)
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
    explanation?: string;
  } | void> | void;
  disabled?: boolean;
}

export const QuestionCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-sheet rounded-xl border border-pencil-line p-8 shadow-sm max-w-[720px] mx-auto w-full animate-pulse">
      <RegistrationCorners />
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-pencil-line">
        <div className="h-6 w-40 bg-sheet-2 rounded border border-pencil-line/50" />
        <div className="h-4 w-28 bg-sheet-2 rounded" />
      </div>
      <div className="space-y-3 mb-8">
        <div className="h-5 bg-sheet-2 rounded w-full" />
        <div className="h-5 bg-sheet-2 rounded w-4/5" />
        <div className="h-5 bg-sheet-2 rounded w-3/4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-sheet-2 rounded-lg border border-pencil-line/50" />
        ))}
      </div>
      <div className="flex justify-end pt-4 border-t border-pencil-line">
        <div className="h-11 w-36 bg-sheet-2 rounded-lg" />
      </div>
    </div>
  );
};

/**
 * QuestionCard Component:
 * The signature test-taking card featuring OMR bubble selection, MathText LaTeX typeset rendering,
 * and instant hand-drawn ink feedback.
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [revealedResult, setRevealedResult] = useState<{
    is_correct: boolean;
    correct_option_index: number;
    explanation?: string;
  } | null>(null);

  const letters = ['A', 'B', 'C', 'D'];

  const handleSelectOption = async (index: number) => {
    if (disabled || isRevealed) return;
    setSelectedIndex(index);
    setIsRevealed(true);
    const result = await onAnswerSubmit(question.id, index);
    if (result) {
      setRevealedResult(result);
    }
  };

  const effectiveCorrectIndex = revealedResult?.correct_option_index;
  const isCorrectChoice = revealedResult?.is_correct ?? false;
  const explanationText = revealedResult?.explanation;

  // Distinct subject color-coding and icons
  const subjectStyles: Record<string, { chip: string; icon: React.ReactNode }> = {
    Physics: {
      chip: 'bg-ink-navy/10 border-ink-navy/30 text-ink-navy font-bold',
      icon: <Atom size={14} className="text-ink-navy" />
    },
    Chemistry: {
      chip: 'bg-exam-green-soft border-exam-green/40 text-exam-green font-bold',
      icon: <FlaskConical size={14} className="text-exam-green" />
    },
    Mathematics: {
      chip: 'bg-red-ink-soft border-red-ink/40 text-red-ink font-bold',
      icon: <Calculator size={14} className="text-red-ink" />
    }
  };

  const subjectConfig = subjectStyles[question.subject] || {
    chip: 'bg-sheet-2 border-pencil-line text-graphite-soft font-semibold',
    icon: <Atom size={14} className="text-graphite-soft" />
  };

  return (
    <div className="relative bg-sheet rounded-xl border border-pencil-line p-6 sm:p-8 md:p-10 shadow-sm max-w-[720px] mx-auto w-full transition-all">
      <RegistrationCorners />

      {/* Meta Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-pencil-line">
        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono ${subjectConfig.chip}`}>
          {subjectConfig.icon}
          <span>{question.subject}</span>
          <span>·</span>
          <span className="font-normal opacity-90">{question.topic}</span>
        </div>

        <div className="text-xs font-mono font-bold text-graphite-soft">
          Question {String(questionNumber).padStart(2, '0')} of {String(totalQuestions).padStart(2, '0')}
        </div>
      </div>

      {/* Question Text with Typeset Math */}
      <div className="font-sans text-lg sm:text-xl font-medium text-graphite leading-relaxed mb-6">
        <MathText text={question.question_text} />
      </div>

      {/* Embedded Diagram / Image if present */}
      {question.image_url && (
        <div className="mb-6 overflow-hidden rounded-md border border-pencil-line bg-sheet-2 p-2">
          <img
            src={question.image_url}
            alt="Question Diagram"
            className="max-h-72 w-auto mx-auto object-contain rounded"
          />
        </div>
      )}

      {/* Options Grid (2x2 Desktop, Stack Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {question.options.map((optionText, idx) => {
          const isThisSelected = selectedIndex === idx;
          const isThisCorrect = effectiveCorrectIndex !== undefined && idx === effectiveCorrectIndex;

          return (
            <OMRBubble
              key={idx}
              letter={letters[idx]}
              text={<MathText text={optionText} />}
              isSelected={isThisSelected}
              isCorrect={isThisCorrect}
              isRevealed={isRevealed}
              isDisabled={disabled}
              onClick={() => handleSelectOption(idx)}
            />
          );
        })}
      </div>

      {/* Feedback Banner on Reveal */}
      {isRevealed && selectedIndex !== null && (
        <div
          className={`p-4 rounded-md border transition-all animate-fade-in ${
            isCorrectChoice
              ? 'bg-exam-green-soft border-exam-green text-graphite'
              : 'bg-red-ink-soft border-red-ink text-graphite'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <InkMark
                type={isCorrectChoice ? 'tick' : 'cross'}
                size={22}
                animate={true}
                className={isCorrectChoice ? 'text-exam-green' : 'text-red-ink'}
              />
              <span className="font-sans font-bold text-base">
                {isCorrectChoice
                  ? 'Correct!'
                  : effectiveCorrectIndex !== undefined
                  ? `Incorrect — Correct answer is ${letters[effectiveCorrectIndex]}`
                  : 'Incorrect'}
              </span>
            </div>

            {explanationText && (
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs font-mono font-semibold underline hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
              >
                {showExplanation ? 'Hide explanation ▲' : 'Show explanation ▼'}
              </button>
            )}
          </div>

          {/* Accordion Explanation */}
          {showExplanation && explanationText && (
            <div className="mt-3 pt-3 border-t border-pencil-line/50 text-sm font-sans text-graphite leading-relaxed">
              <span className="font-semibold block mb-1 font-mono text-xs uppercase text-graphite-soft">
                Explanation:
              </span>
              <MathText text={explanationText} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
