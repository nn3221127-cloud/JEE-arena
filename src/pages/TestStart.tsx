import React, { useEffect, useState } from 'react';
import { api, AuthUser, TestSummary } from '../api/client';
import { PERMISSIONS } from '../lib/permissions';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { WireframeScene } from '../components/WireframeScene';
import { DigitBox } from '../components/DigitBox';
import { Play, Sparkles, Eye, Award } from 'lucide-react';

interface TestStartProps {
  testId: string;
  user?: AuthUser;
  onStartTest: (attemptSession: any) => void;
  onBack: () => void;
}

/**
 * Screen 4.4: Test Start Screen (Member / Admin Learner Mode)
 */
export const TestStart: React.FC<TestStartProps> = ({ testId, user, onStartTest, onBack }) => {
  const [test, setTest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const isAdmin = PERMISSIONS.canManageTests(user?.role);

  useEffect(() => {
    const fetchTest = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTest(testId);
        setTest(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTest();
  }, [testId]);

  const handleStartReal = async () => {
    if (!testId) return;
    setIsStarting(true);
    try {
      const session = await api.startAttempt(testId);
      onStartTest(session);
    } catch (err) {
      console.error(err);
      setIsStarting(false);
    }
  };

  const handleStartPreview = async () => {
    if (!testId) return;
    setIsStarting(true);
    try {
      const previewSession = await api.getTestPreview(testId);
      onStartTest(previewSession);
    } catch (err) {
      console.error(err);
      setIsStarting(false);
    }
  };

  if (isLoading || !test) {
    return (
      <div className="py-24 text-center font-mono text-sm text-graphite-soft">
        Preparing exam booklet...
      </div>
    );
  }

  const subjects = Array.from(new Set(test.questions?.map((q: any) => q.subject) || []));

  return (
    <div className="relative min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* 3D Wireframe Scene Background Motif */}
      <WireframeScene opacity={0.15} />

      {/* Centered Card (max-width 480px) */}
      <div className="relative z-10 w-full max-w-[480px] bg-sheet rounded-xl border border-pencil-line p-8 shadow-lg">
        <RegistrationCorners />

        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded border text-xs font-mono font-semibold ${
              isAdmin ? 'bg-amber-flag/10 border-amber-flag/40 text-amber-flag' : 'bg-sheet-2 border-pencil-line text-graphite-soft'
            }`}>
              {isAdmin ? <Award size={14} className="text-amber-flag" /> : <Sparkles size={14} className="text-ink-navy" />}
              <span>{isAdmin ? 'ADMIN LEARNER & INSPECTION MODE' : 'JEE MOCK TEST'}</span>
            </div>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-graphite">
              {test.title}
            </h1>
            <p className="text-sm font-sans text-graphite-soft leading-relaxed">
              {test.description || 'Practice under timed JEE exam conditions with step-by-step solutions.'}
            </p>
          </div>

          {/* 3 Meta Chips */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-pencil-line">
            <div className="flex flex-col items-center justify-center p-2 rounded bg-sheet-2/60">
              <span className="text-[10px] font-mono text-graphite-soft uppercase">Questions</span>
              <DigitBox value={test.questions?.length || 0} size="sm" className="mt-1" />
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded bg-sheet-2/60">
              <span className="text-[10px] font-mono text-graphite-soft uppercase">Est. Time</span>
              <span className="font-mono font-bold text-sm text-graphite mt-1">
                {test.estimated_time_minutes || 15}m
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded bg-sheet-2/60">
              <span className="text-[10px] font-mono text-graphite-soft uppercase">Subjects</span>
              <span className="font-sans font-semibold text-xs text-graphite truncate mt-1">
                {subjects.length} Subjects
              </span>
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {subjects.map((sub: any) => (
              <span
                key={sub}
                className="px-2.5 py-1 rounded-full text-xs font-mono bg-sheet-2 border border-pencil-line text-graphite-soft"
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Main Action: Start Real Graded Attempt (Records score & progress) */}
            <button
              type="button"
              onClick={handleStartReal}
              disabled={isStarting}
              className="w-full h-12 rounded-md bg-ink-navy hover:bg-ink-navy/90 text-white font-sans font-bold text-base shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <Play size={18} fill="currentColor" />
              <span>
                {isStarting ? 'Initiating Test...' : 'Start Graded Test Attempt'}
              </span>
            </button>

            {/* Optional Admin Inspection Preview button */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleStartPreview}
                disabled={isStarting}
                className="w-full h-10 rounded-md bg-sheet-2 border border-pencil-line hover:bg-sheet-3 text-graphite-soft hover:text-graphite font-sans font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Eye size={16} className="text-amber-flag" />
                <span>Inspection Preview (No Progress Recorded)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full mt-2 text-center text-xs font-mono text-graphite-soft hover:text-graphite cursor-pointer"
            >
              ← Back to tests
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

