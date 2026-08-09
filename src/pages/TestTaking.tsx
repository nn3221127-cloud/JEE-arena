import React, { useState, useEffect } from 'react';
import { api, AttemptSession } from '../api/client';
import { QuestionCard, QuestionData } from '../components/QuestionCard';
import { DigitBox } from '../components/DigitBox';
import { TimerRing, ProgressBar } from '../components/ProgressBar';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface TestTakingProps {
  session: AttemptSession;
  onFinishTest: (attemptId: string) => void;
}

/**
 * Screen 4.5: Test-Taking Screen (Core Flow - Signature Screen)
 */
export const TestTaking: React.FC<TestTakingProps> = ({ session, onFinishTest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<string, number>>({});
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

  const currentQuestion = session.questions[currentIndex];
  const totalQuestions = session.questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasAnsweredCurrent = answeredMap[currentQuestion?.id] !== undefined;

  const handleAnswerSubmit = async (questionId: string, selectedIndex: number) => {
    setAnsweredMap((prev) => ({ ...prev, [questionId]: selectedIndex }));
    try {
      await api.submitAnswer(session.attempt_id, questionId, selectedIndex);
    } catch (err) {
      console.error('Failed to record answer:', err);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
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
      <div className="py-24 text-center font-mono text-sm text-graphite-soft">
        Loading exam question...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 font-sans">
      {/* Header Bar Row (Sticky Top) */}
      <div className="bg-sheet rounded-lg border border-pencil-line p-4 shadow-sm sticky top-16 z-30 space-y-3">
        <div className="flex items-center justify-between gap-4">
          {/* Digit Box Question Index */}
          <div className="flex items-center gap-3">
            <DigitBox prefix="Q" value={currentIndex + 1} size="md" active />
            <span className="font-mono text-xs text-graphite-soft font-semibold">
              of {String(totalQuestions).padStart(2, '0')}
            </span>
          </div>

          <div className="font-sans font-bold text-sm text-graphite truncate hidden sm:block">
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
      </div>

      {/* Question Card Container */}
      <div className="transition-all duration-200">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion as QuestionData}
          questionNumber={currentIndex + 1}
          totalQuestions={totalQuestions}
          onAnswerSubmit={handleAnswerSubmit}
          disabled={isFinishing}
        />
      </div>

      {/* Footer Controls (Desktop & Mobile Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 bg-sheet/95 backdrop-blur border-t border-pencil-line p-4 z-30 shadow-lg">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="font-mono text-xs text-graphite-soft hidden sm:block">
            Answer saved automatically on tap
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasAnsweredCurrent || isFinishing}
            className={`w-full sm:w-auto px-8 py-3 rounded-md font-sans font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
