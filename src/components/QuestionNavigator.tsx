import React from 'react';

interface QuestionNavigatorProps {
  totalQuestions: number;
  currentIndex: number;
  answeredMap: Record<string, number>;
  questionIds: string[];
  onSelectQuestion: (index: number) => void;
  className?: string;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  totalQuestions,
  currentIndex,
  answeredMap,
  questionIds,
  onSelectQuestion,
  className = ''
}) => {
  return (
    <div className={`p-3 rounded-lg bg-sheet border border-pencil-line shadow-xs mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono font-bold uppercase text-graphite-soft tracking-wider">
          Question Navigator
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono text-graphite-soft">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-ink-navy inline-block" /> Current
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-exam-green inline-block" /> Answered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sheet-2 border border-pencil-line inline-block" /> Unanswered
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-start">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx];
          const isCurrent = idx === currentIndex;
          const isAnswered = qId ? answeredMap[qId] !== undefined : false;

          let btnStyle = 'bg-sheet-2 text-graphite-soft border-pencil-line hover:border-graphite';
          if (isCurrent) {
            btnStyle = 'bg-ink-navy text-white border-ink-navy ring-2 ring-ink-navy/20 font-bold';
          } else if (isAnswered) {
            btnStyle = 'bg-exam-green-soft text-exam-green border-exam-green/40 font-bold';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectQuestion(idx)}
              className={`w-8 h-8 rounded border text-xs font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
            >
              {String(idx + 1).padStart(2, '0')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
