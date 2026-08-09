import React, { useState } from 'react';
import { RegistrationCorners } from './RegistrationCorners';
import { OMRBubble } from './OMRBubble';
import { InkMark } from './InkMark';

export interface QuestionData {
  id: string;
  question_text: string;
  options: string[]; // 4 options
  correct_option_index: number; // 0, 1, 2, 3
  explanation?: string;
  subject: string; // 'Physics', 'Chemistry', 'Mathematics'
  topic: string;
  image_url?: string;
}

interface QuestionCardProps {
  question: QuestionData;
  questionNumber: number;
  totalQuestions: number;
  onAnswerSubmit: (questionId: string, selectedIndex: number) => void;
  disabled?: boolean;
}

/**
 * QuestionCard Component:
 * The signature test-taking card featuring OMR bubble selection and instant hand-drawn ink feedback.
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

  const letters = ['A', 'B', 'C', 'D'];

  const handleSelectOption = (index: number) => {
    if (disabled || isRevealed) return;
    setSelectedIndex(index);
    setIsRevealed(true);
    onAnswerSubmit(question.id, index);
  };

  const isCorrectChoice = selectedIndex !== null && selectedIndex === question.correct_option_index;

  return (
    <div className="relative bg-sheet rounded-lg border border-pencil-line p-6 sm:p-8 shadow-md max-w-3xl mx-auto w-full transition-all">
      <RegistrationCorners />

      {/* Meta Header */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-pencil-line">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-sheet-2 border border-pencil-line text-xs font-mono font-medium text-graphite-soft">
          <span className="font-semibold text-graphite">{question.subject}</span>
          <span>·</span>
          <span>{question.topic}</span>
        </div>

        <div className="text-xs font-mono font-bold text-graphite-soft">
          Question {String(questionNumber).padStart(2, '0')} of {String(totalQuestions).padStart(2, '0')}
        </div>
      </div>

      {/* Question Text */}
      <div className="font-sans text-lg sm:text-xl font-medium text-graphite leading-relaxed mb-6">
        {question.question_text}
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
          const isThisCorrect = idx === question.correct_option_index;

          return (
            <OMRBubble
              key={idx}
              letter={letters[idx]}
              text={optionText}
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
                className={isCorrectChoice ? 'text-exam-green' : 'text-red-ink'}
              />
              <span className="font-sans font-bold text-base">
                {isCorrectChoice
                  ? 'Correct!'
                  : `Incorrect — Correct answer is ${letters[question.correct_option_index]}`}
              </span>
            </div>

            {question.explanation && (
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
          {showExplanation && question.explanation && (
            <div className="mt-3 pt-3 border-t border-pencil-line/50 text-sm font-sans text-graphite leading-relaxed">
              <span className="font-semibold block mb-1 font-mono text-xs uppercase text-graphite-soft">
                Explanation:
              </span>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
