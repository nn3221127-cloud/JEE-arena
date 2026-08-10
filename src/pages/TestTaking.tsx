import React, { useState, useEffect } from 'react';
import { api, AttemptSession } from '../api/client';
import { QuestionCard, QuestionCardSkeleton, QuestionData } from '../components/QuestionCard';
import { QuestionNavigator } from '../components/QuestionNavigator';
import { ArrowRight, ArrowLeft, CheckCircle, Grid, Share2, MoreVertical, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TestTakingProps {
  session: AttemptSession;
  onFinishTest: (attemptId: string) => void;
}

/**
 * Screen 4.5: Test-Taking Screen
 * Clean minimal header, shrunk timer badge, local storage persistence, keyboard controls,
 * and per-option simultaneous rationale reveals.
 */
export const TestTaking: React.FC<TestTakingProps> = ({ session, onFinishTest }) => {
  const storageKey = `quiz_progress_${session.attempt_id}`;

  // Task 9: Initialize state from localStorage if present
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.currentIndex === 'number') return parsed.currentIndex;
      }
    } catch (e) {
      console.error('Failed to read localStorage:', e);
    }
    return 0;
  });

  const [answeredMap, setAnsweredMap] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answeredMap) return parsed.answeredMap;
      }
    } catch (e) {
      console.error('Failed to read localStorage:', e);
    }
    return {};
  });

  const [showPalette, setShowPalette] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timer calculation
  const totalSeconds = (session.estimated_time_minutes || 15) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  // Task 9: Save progress to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ currentIndex, answeredMap }));
      } catch (e) {
        console.error('Failed to write localStorage:', e);
      }
    }
  }, [currentIndex, answeredMap, storageKey]);

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
      const q = session.questions.find((item) => item.id === questionId);
      const corrIdx = typeof (q as any)?.correct_option_index === 'number' ? (q as any).correct_option_index : 0;
      return {
        is_correct: selectedIndex === corrIdx,
        correct_option_index: corrIdx,
        explanation: (q as any)?.explanation
      };
    }
  };

  // Task 8: Keyboard navigation support (1-4, A-D, ArrowLeft/Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinishing || !currentQuestion) return;
      // Don't intercept if user typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();
      let optIdx: number | null = null;
      if (key === '1' || key === 'A') optIdx = 0;
      else if (key === '2' || key === 'B') optIdx = 1;
      else if (key === '3' || key === 'C') optIdx = 2;
      else if (key === '4' || key === 'D') optIdx = 3;

      if (optIdx !== null && optIdx < currentQuestion.options.length) {
        if (!hasAnsweredCurrent) {
          handleAnswerSubmit(currentQuestion.id, optIdx);
        }
      } else if (e.key === 'ArrowRight' && hasAnsweredCurrent) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, hasAnsweredCurrent, isFinishing]);

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
    // Clear progress from localStorage on finish
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        // ignore
      }
    }
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

  const minutesLeft = Math.floor(secondsLeft / 60);
  const secsRemainder = secondsLeft % 60;
  const formattedTimer = `${String(minutesLeft).padStart(2, '0')}:${String(secsRemainder).padStart(2, '0')}`;

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!currentQuestion) {
    return (
      <div className="max-w-[720px] mx-auto py-8">
        <QuestionCardSkeleton />
      </div>
    );
  }

  return (
    <div className="quiz-dark space-y-6 pb-28 font-sans max-w-4xl mx-auto text-gray-100">
      {/* Task 6: Minimal Decluttered Header */}
      <div className="bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] px-4 py-3 shadow-md sticky top-16 z-30 space-y-2">
        <div className="flex items-center justify-between gap-3">
          {/* Back Arrow & Test Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg border border-[#2D3139] bg-[#21242B] text-gray-300 hover:text-white hover:border-[#4158FE] transition-colors disabled:opacity-30 cursor-pointer shrink-0"
              title="Previous Question"
            >
              <ArrowLeft size={16} />
            </button>
            <h1 className="font-sans font-bold text-sm text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {session.test_title}
            </h1>
          </div>

          {/* Right Header Controls: Share, Menu, Counter + Shrunk Timer Badge */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Question Counter Badge */}
            <div className="px-2.5 py-1 rounded-full bg-[#21242B] border border-[#2D3139] text-xs font-mono font-bold text-gray-200">
              {currentIndex + 1} / {totalQuestions}
            </div>

            {/* Task 6: Shrunk Timer Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#21242B] border border-[#2D3139] text-xs font-mono font-bold text-[#6B80FF]">
              <Timer size={13} className="text-[#6B80FF]" />
              <span>{formattedTimer}</span>
            </div>

            {/* Palette Toggle */}
            <button
              type="button"
              onClick={() => setShowPalette(!showPalette)}
              className="p-1.5 rounded-lg border border-[#2D3139] bg-[#21242B] text-gray-300 hover:text-white hover:border-[#4158FE] transition-colors cursor-pointer"
              title="Toggle Question Palette"
            >
              <Grid size={16} />
            </button>

            {/* Share Icon */}
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: session.test_title, url: window.location.href });
                }
              }}
              className="p-1.5 rounded-lg border border-[#2D3139] bg-[#21242B] text-gray-300 hover:text-white hover:border-[#4158FE] transition-colors cursor-pointer hidden sm:flex"
              title="Share Test"
            >
              <Share2 size={16} />
            </button>

            {/* Menu Icon */}
            <button
              type="button"
              className="p-1.5 rounded-lg border border-[#2D3139] bg-[#21242B] text-gray-300 hover:text-white hover:border-[#4158FE] transition-colors cursor-pointer hidden sm:flex"
              title="Menu"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Question Palette Drawer */}
        {showPalette && (
          <div className="pt-2.5 border-t border-[#2D3139] animate-fade-in">
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
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: 'easeOut' }}
          aria-live="polite"
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

      {/* Footer Controls (Task 7: Pill shaped buttons) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#191C23]/95 backdrop-blur-md border-t border-[#2D3139] p-4 z-30 shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isFinishing}
            className={`px-5 py-2.5 rounded-full font-sans font-semibold text-xs border border-[#2D3139] transition-all flex items-center gap-1.5 cursor-pointer ${
              currentIndex > 0
                ? 'bg-[#21242B] text-gray-200 hover:border-[#4158FE] hover:text-white'
                : 'opacity-30 cursor-not-allowed text-gray-500'
            }`}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          <div className="font-mono text-xs text-gray-400 hidden sm:block">
            {hasAnsweredCurrent ? 'Answer recorded' : 'Press 1-4 or click an option to answer'}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnsweredCurrent || isFinishing}
            className={`px-7 py-2.5 rounded-full font-sans font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              hasAnsweredCurrent
                ? 'bg-[#4158FE] hover:bg-[#3448E0] text-white shadow-[#4158FE]/20'
                : 'bg-[#21242B] text-gray-500 border border-[#2D3139] cursor-not-allowed opacity-50'
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
