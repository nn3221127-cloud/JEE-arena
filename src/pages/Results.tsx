import React, { useEffect, useState } from 'react';
import { api, ResultsSummary } from '../api/client';
import { ScoreCircle } from '../components/ScoreCircle';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { DigitBox } from '../components/DigitBox';
import { InkMark } from '../components/InkMark';
import { Trophy, BarChart2, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface ResultsProps {
  attemptId: string;
  onNavigate: (nav: string) => void;
}

/**
 * Screen 4.6: Results Screen (Signature Hero + 3 Tabs)
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
      <div className="py-24 text-center font-mono text-sm text-graphite-soft">
        Evaluating graded answer booklet...
      </div>
    );
  }

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-8 font-sans">
      {/* Hero Section — Signature Red-Ink Circle Score Reveal */}
      <div className="relative bg-sheet rounded-xl border border-pencil-line p-6 sm:p-10 shadow-md text-center overflow-hidden">
        <div className="absolute inset-0 bg-registration-dots pointer-events-none" />
        <RegistrationCorners />

        <div className="relative z-10 max-w-md mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sheet-2 border border-pencil-line text-xs font-mono font-semibold text-graphite-soft">
            <CheckCircle2 size={14} className="text-exam-green" />
            <span>TEST GRADED & VERIFIED</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-graphite">
            {results.test_title}
          </h1>

          {/* Signature Moment 2: Red Ink Score Circle */}
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
              className="px-6 py-2 rounded-full bg-ink-navy text-white text-xs font-mono font-semibold hover:bg-ink-navy/90 shadow transition-colors cursor-pointer"
            >
              Return to Arena Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-pencil-line flex items-center justify-center gap-6 text-sm font-sans font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-ink-navy text-ink-navy font-bold'
              : 'border-transparent text-graphite-soft hover:text-graphite'
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
              ? 'border-ink-navy text-ink-navy font-bold'
              : 'border-transparent text-graphite-soft hover:text-graphite'
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
              ? 'border-ink-navy text-ink-navy font-bold'
              : 'border-transparent text-graphite-soft hover:text-graphite'
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
          <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold font-sans text-graphite">
              Subject-wise Performance
            </h2>

            <div className="space-y-4">
              {results.subject_breakdown.map((sub) => (
                <div key={sub.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-graphite">{sub.subject}</span>
                    <span className="text-graphite-soft">
                      {sub.correct} / {sub.total} Correct ({sub.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full bg-pencil-line/40 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-ink-navy h-full transition-all duration-500"
                      style={{ width: `${sub.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics Chip List */}
          <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold font-sans text-graphite flex items-center gap-2">
              <AlertCircle size={18} className="text-red-ink" />
              <span>Topics Needing Revision</span>
            </h2>

            {results.weak_topics.length === 0 ? (
              <p className="text-xs font-sans text-graphite-soft">
                Great job! No weak topics detected in this attempt.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {results.weak_topics.map((wt) => (
                  <div
                    key={wt.topic}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-ink-soft border border-red-ink/30 text-xs font-sans text-graphite"
                  >
                    <span className="font-semibold text-red-ink">{wt.topic}</span>
                    <span className="font-mono text-[10px] text-graphite-soft">
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
                className="bg-sheet rounded-lg border border-pencil-line p-4 shadow-xs space-y-3 transition-all"
              >
                <div
                  onClick={() => toggleExpandQuestion(q.question_id)}
                  className="flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <DigitBox prefix="Q" value={idx + 1} size="sm" />
                    <InkMark
                      type={q.is_correct ? 'tick' : 'cross'}
                      size={20}
                      className={q.is_correct ? 'text-exam-green' : 'text-red-ink'}
                    />
                    <span className="font-sans font-medium text-sm text-graphite line-clamp-1">
                      {q.question_text}
                    </span>
                  </div>

                  <button type="button" className="text-graphite-soft">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-pencil-line space-y-3 text-sm font-sans">
                    <div className="font-medium text-graphite leading-relaxed">
                      {q.question_text}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs">
                      {q.options.map((optText, optIdx) => {
                        const isUserPick = q.user_selected_index === optIdx;
                        const isCorrectOpt = q.correct_option_index === optIdx;

                        let style = 'bg-sheet border-pencil-line text-graphite-soft';
                        if (isCorrectOpt) {
                          style = 'bg-exam-green-soft border-exam-green text-graphite font-semibold';
                        } else if (isUserPick && !isCorrectOpt) {
                          style = 'bg-red-ink-soft border-red-ink text-graphite font-semibold';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded border ${style}`}>
                            <span className="font-mono font-bold mr-1">{letters[optIdx]}.</span>
                            <span>{optText}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded bg-sheet-2 border border-pencil-line text-xs font-sans text-graphite leading-relaxed">
                        <span className="font-mono font-bold uppercase text-graphite-soft block mb-1">
                          Explanation:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Compare with Team Leaderboard */}
      {activeTab === 'compare' && (
        <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold font-sans text-graphite flex items-center gap-2">
            <Trophy size={18} className="text-ink-navy" />
            <span>Test Scoreboard</span>
          </h2>

          <div className="divide-y divide-pencil-line">
            {results.team_comparison.map((m) => (
              <div
                key={m.user_id}
                className={`py-3.5 px-3 flex items-center justify-between gap-4 rounded-md transition-colors ${
                  m.is_current_user ? 'bg-ink-navy/10 border border-ink-navy/20' : 'hover:bg-sheet-2'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DigitBox value={`0${m.rank}`} size="sm" active={m.rank === 1} />
                  <div className="w-8 h-8 rounded-full bg-ink-navy text-white font-mono font-bold text-xs flex items-center justify-center">
                    {m.user_name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-sans font-bold text-sm text-graphite">
                      {m.user_name} {m.is_current_user && '(You)'}
                    </div>
                    <div className="font-mono text-xs text-graphite-soft">
                      {m.has_attempted ? `Score: ${m.score}/${m.total}` : 'Not attempted yet'}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-lg text-ink-navy">
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
