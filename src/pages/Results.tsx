import React, { useEffect, useState } from 'react';
import { api, ResultsSummary } from '../api/client';
import { ScoreCircle } from '../components/ScoreCircle';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { DigitBox } from '../components/DigitBox';
import { InkMark } from '../components/InkMark';
import { MathText } from '../components/MathText';
import { Trophy, BarChart2, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface ResultsProps {
  attemptId: string;
  onNavigate: (nav: string) => void;
}

/**
 * Screen 4.6: Results Screen
 * Extended with .quiz-dark theme consistency, MathText rendering, and per-option rationale review.
 */
export const Results: React.FC<ResultsProps> = ({ attemptId, onNavigate }) => {
  const [results, setResults] = useState<ResultsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'compare'>('overview');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const data = await api.getResults(attemptId);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [attemptId]);

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading || !results) {
    return (
      <div className="py-24 text-center font-mono text-sm text-gray-400">
        Evaluating graded answer booklet...
      </div>
    );
  }

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="quiz-dark space-y-8 font-sans text-gray-100 max-w-4xl mx-auto">
      {/* Hero Section — Red-Ink Circle Score Reveal */}
      <div className="relative bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-6 sm:p-10 shadow-lg text-center overflow-hidden">
        <div className="absolute inset-0 bg-registration-dots opacity-10 pointer-events-none" />
        <RegistrationCorners />

        <div className="relative z-10 max-w-md mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21242B] border border-[#2D3139] text-xs font-mono font-semibold text-[var(--quiz-correct-label,#6BD586)]">
            <CheckCircle2 size={14} className="text-[var(--quiz-correct-label,#6BD586)]" />
            <span>TEST GRADED & VERIFIED</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {results.test_title}
          </h1>

          {/* Score Circle */}
          <ScoreCircle
            score={results.score}
            total={results.total_questions}
            accuracyPercentage={results.accuracy_percentage}
            timeSpentText={results.time_spent_text}
          />

          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-6 py-2.5 rounded-full bg-[#4158FE] hover:bg-[#3448E0] text-white text-xs font-mono font-semibold shadow-md transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-[#2D3139] flex items-center justify-center gap-6 text-sm font-sans font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-[#4158FE] text-[#6B80FF] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <BarChart2 size={16} />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'review'
              ? 'border-[#4158FE] text-[#6B80FF] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>Question Review</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('compare')}
          className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'compare'
              ? 'border-[#4158FE] text-[#6B80FF] font-bold'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Trophy size={16} />
          <span>Compare with Team</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Subject Wise Accuracy Bars */}
          <div className="bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-6 shadow-md space-y-4">
            <h2 className="text-base font-bold font-sans text-white">
              Subject-wise Performance
            </h2>

            <div className="space-y-4">
              {results.subject_breakdown.map((sub) => (
                <div key={sub.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-gray-200">{sub.subject}</span>
                    <span className="text-gray-400">
                      {sub.correct} / {sub.total} Correct ({sub.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#21242B] h-2.5 rounded-full overflow-hidden border border-[#2D3139]">
                    <div
                      className="bg-[#4158FE] h-full transition-all duration-500 rounded-full"
                      style={{ width: `${sub.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics List */}
          <div className="bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-6 shadow-md space-y-4">
            <h2 className="text-base font-bold font-sans text-white flex items-center gap-2">
              <AlertCircle size={18} className="text-[var(--quiz-wrong-border,#B1251E)]" />
              <span>Topics Needing Revision</span>
            </h2>

            {results.weak_topics.length === 0 ? (
              <p className="text-xs font-sans text-gray-400">
                Great job! No weak topics detected in this attempt.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {results.weak_topics.map((wt) => (
                  <div
                    key={wt.topic}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--quiz-wrong-bg,#311E22)] border border-[var(--quiz-wrong-border,#B1251E)]/40 text-xs font-sans text-gray-200"
                  >
                    <span className="font-semibold text-[var(--quiz-wrong-border,#B1251E)]">{wt.topic}</span>
                    <span className="font-mono text-[10px] text-gray-400">
                      ({wt.wrong_count} incorrect)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Question Review List */}
      {activeTab === 'review' && (
        <div className="space-y-3">
          {results.answers_review.map((q, idx) => {
            const isExpanded = !!expandedQuestions[q.question_id];

            return (
              <div
                key={q.question_id}
                className="bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-4 sm:p-5 shadow-md space-y-3 transition-all"
              >
                <div
                  onClick={() => toggleExpandQuestion(q.question_id)}
                  className="flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <DigitBox prefix="Q" value={idx + 1} size="sm" />
                    <InkMark
                      type={q.is_correct ? 'tick' : 'cross'}
                      size={20}
                      className={q.is_correct ? 'text-[var(--quiz-correct-label,#6BD586)]' : 'text-[var(--quiz-wrong-border,#B1251E)]'}
                    />
                    <div className="font-sans font-medium text-sm text-gray-200 truncate">
                      <MathText text={q.question_text} />
                    </div>
                  </div>

                  <button type="button" className="text-gray-400 shrink-0">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-[#2D3139] space-y-4 text-sm font-sans">
                    <div className="font-medium text-white leading-relaxed">
                      <MathText text={q.question_text} />
                    </div>

                    {/* Hint if present */}
                    {q.hint && (
                      <div className="p-3 rounded-xl border border-[#4158FE]/20 bg-[#21242B] text-xs text-gray-200">
                        <span className="block font-mono text-[10px] uppercase font-bold text-[#6B80FF] mb-0.5">
                          Hint:
                        </span>
                        <MathText text={q.hint} />
                      </div>
                    )}

                    {/* Options Stack with Per-Option Rationales */}
                    <div className="flex flex-col gap-2.5">
                      {q.options.map((optText, optIdx) => {
                        const isUserPick = q.user_selected_index === optIdx;
                        const isCorrectOpt = q.correct_option_index === optIdx;
                        const rationaleText = q.option_rationales?.[optIdx] || (isCorrectOpt ? q.explanation : undefined);

                        let style = 'bg-[#21242B] border-[#2D3139] text-gray-300';
                        if (isCorrectOpt) {
                          style = 'bg-[var(--quiz-correct-bg,#1E2E24)] border-[var(--quiz-correct-label,#6BD586)] text-white font-semibold';
                        } else if (isUserPick && !isCorrectOpt) {
                          style = 'bg-[var(--quiz-wrong-bg,#311E22)] border-[var(--quiz-wrong-border,#B1251E)] text-white font-semibold';
                        }

                        return (
                          <div key={optIdx} className={`p-3 rounded-xl border ${style} space-y-1.5`}>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-mono font-bold">{letters[optIdx]}.</span>
                              <div className="flex-1">
                                <MathText text={optText} />
                              </div>
                            </div>

                            {rationaleText && (
                              <div className="pt-2 border-t border-white/5 text-xs text-gray-300 leading-relaxed pl-5">
                                <span className="font-mono text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                  Rationale:
                                </span>
                                <MathText text={rationaleText} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Compare with Team Leaderboard */}
      {activeTab === 'compare' && (
        <div className="bg-[var(--quiz-card-bg,#191C23)] rounded-2xl border border-[var(--quiz-card-border,#2D3139)] p-6 shadow-md space-y-4">
          <h2 className="text-base font-bold font-sans text-white flex items-center gap-2">
            <Trophy size={18} className="text-[#6B80FF]" />
            <span>Test Scoreboard</span>
          </h2>

          <div className="divide-y divide-[#2D3139]">
            {results.team_comparison.map((m) => (
              <div
                key={m.user_id}
                className={`py-3.5 px-3 flex items-center justify-between gap-4 rounded-xl transition-colors ${
                  m.is_current_user ? 'bg-[#4158FE]/10 border border-[#4158FE]/30' : 'hover:bg-[#21242B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DigitBox value={`0${m.rank}`} size="sm" active={m.rank === 1} />
                  <div className="w-8 h-8 rounded-full bg-[#4158FE] text-white font-mono font-bold text-xs flex items-center justify-center">
                    {m.user_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-sm text-white">
                      {m.user_name} {m.is_current_user && '(You)'}
                    </div>
                    <div className="font-mono text-xs text-gray-400">
                      {m.has_attempted ? `Score: ${m.score}/${m.total}` : 'Not attempted yet'}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-lg text-[#6B80FF]">
                  {m.has_attempted ? `${m.accuracy}%` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
