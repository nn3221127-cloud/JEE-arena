import React, { useState, useEffect } from 'react';
import { api, AttemptSession } from '../api/client';
import { QuestionCard, QuestionCardSkeleton, QuestionData } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { DigitBox } from '../components/DigitBox';
import { TimerRing, ProgressBar } from '../components/ProgressBar';
import { ArrowRight, ArrowLeft, CheckCircle, Grid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TestTakingProps {
  session: AttemptSession;
  onFinishTest: (attemptId: string) => void;
}

/**
 * Screen 4.5: Test-Taking Screen (Core Flow - Signature Screen)
 * Elevated with NotebookLM-style single focal question feel, smooth motion transitions,
 * and a question palette navigator.
 */
export const TestTaking: React.FC<TestTakingProps> = ({ session, onFinishTest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, number>>({});
  const [showPalette, setShowPalette] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timer calculation
  const totalSeconds = (session.estimated_time_minutes || 15) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const isPreviewMode = (session as any).is_preview || session.attempt_id?.startsWith('preview_');

  const currentQuestion = session.questions[currentIndex];
  const totalQuestions = session.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasAnsweredCurrent = answeredMap[currentQuestion?.id] !== undefined;

  const handleAnswerSubmit = async (questionId: string, selectedIndex: number) => {
    setAnsweredMap((prev) => ({ ...prev, [questionId]: selectedIndex }));
    try {
      const res = await api.submitAnswer(session.attempt_id, questionId, selectedIndex);
      return res;
    } catch (err) {
      console.error('Failed to record answer:', err);
      // Fallback evaluation if local or preview mode
      const q = session.questions.find((item) => item.id === questionId);
      const corrIdx = typeof q?.correct_option_index === 'number' ? q.correct_option_index : 0;
      return {
        is_correct: selectedIndex === corrIdx,
        correct_option_index: corrIdx,
        explanation: q?.explanation
      };
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    if (isPreviewMode) {
      onFinishTest('preview_finished');
      return;
    }
    try {
      await api.finishAttempt(session.attempt_id);
      onFinishTest(session.attempt_id);
    } catch (err) {
      console.error('Failed to finish attempt:', err);
      onFinishTest(session.attempt_id);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="max-w-[720px] mx-auto py-8">
        <QuestionCardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 font-sans max-w-4xl mx-auto">
      {/* Sticky Header Bar */}
      <div className="bg-sheet rounded-lg border border-pencil-line p-4 shadow-sm sticky top-16 z-30 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Question Index & Palette Toggle */}
          <div className="flex items-center gap-3">
            <DigitBox prefix="Q" value={currentIndex + 1} size="md" active />
            <span className="font-mono text-xs text-graphite-soft font-semibold">
              of {String(totalQuestions).padStart(2, '0')}
            </span>

            <button
              type="button"
              onClick={() => setShowPalette(!showPalette)}
              className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sheet-2 border border-pencil-line hover:border-graphite-soft text-xs font-mono font-semibold text-graphite cursor-pointer transition-colors"
              title="Toggle Question Navigator"
            >
              <Grid size={14} className="text-ink-navy" />
              <span className="hidden sm:inline">Palette</span>
            </button>
          </div>

          <div className="font-sans font-bold text-sm text-graphite truncate hidden md:block">
            {session.test_title}
          </div>

          {/* Timer Ring */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-graphite-soft hidden sm:inline-block">Time Left:</span>
            <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds} size={42} />
          </div>
        </div>

        {/* Linear Progress Bar */}
        <ProgressBar current={currentIndex + 1} total={totalQuestions} />

        {/* Question Navigator Palette Drawer */}
        {showPalette && (
          <div className="pt-3 border-t border-pencil-line animate-fade-in">
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentIndex={currentIndex}
              answeredMap={answeredMap}
              questionIds={session.questions.map((q) => q.id)}
              onSelectQuestion={(idx) => {
                setCurrentIndex(idx);
                setShowPalette(false);
              }}
              className="mb-0 border-none shadow-none p-0 bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Question Card Container with Motion Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <QuestionCard
            question={currentQuestion as QuestionData}
            questionNumber={currentIndex + 1}
            totalQuestions={totalQuestions}
            onAnswerSubmit={handleAnswerSubmit}
            disabled={isFinishing}
          />
        </motion.div>
      </AnimatePresence>

      {/* Footer Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-sheet/95 backdrop-blur border-t border-pencil-line p-4 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isFinishing}
            className={`px-4 py-2.5 rounded-md font-sans font-semibold text-xs border border-pencil-line transition-all flex items-center gap-1.5 cursor-pointer ${
              currentIndex > 0
                ? 'bg-sheet text-graphite hover:bg-sheet-2'
                : 'opacity-40 cursor-not-allowed text-graphite-soft'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          <div className="font-mono text-xs text-graphite-soft hidden sm:block">
            {hasAnsweredCurrent ? 'Answer recorded' : 'Select an option to answer'}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnsweredCurrent || isFinishing}
            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-md font-sans font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              hasAnsweredCurrent
                ? 'bg-ink-navy text-white hover:bg-ink-navy/90'
                : 'bg-sheet-2 text-graphite-soft border border-pencil-line cursor-not-allowed opacity-60'
            }`}
          >
            {isLastQuestion ? (
              <>
                <CheckCircle size={18} />
                <span>{isFinishing ? 'Submitting...' : 'Submit Final Paper'}</span>
              </>
            ) : (
              <>
                <span>Next Question</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
