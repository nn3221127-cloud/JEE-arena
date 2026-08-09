import React, { useEffect, useState } from 'react';
import { api, TopicStat } from '../api/client';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { DigitBox } from '../components/DigitBox';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, RefreshCw, AlertTriangle, FileText } from 'lucide-react';

interface ProgressDashboardProps {
  onNavigate: (nav: string, attemptId?: string) => void;
  onStartRetakeTest: (testId: string) => void;
}

/**
 * Screen 4.7: Progress / History Dashboard (Per Member)
 */
export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  onNavigate,
  onStartRetakeTest
}) => {
  const [weakTopics, setWeakTopics] = useState<TopicStat[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRetake, setIsCreatingRetake] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const [wtRes, attRes] = await Promise.all([
          api.getWeakTopics(),
          api.getPastAttempts()
        ]);
        setWeakTopics(wtRes);
        setAttempts(attRes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  const handleRetake = async () => {
    setIsCreatingRetake(true);
    try {
      const retakeTest = await api.retakeWeakQuestions();
      onStartRetakeTest(retakeTest.id);
    } catch (err) {
      console.error(err);
      setIsCreatingRetake(false);
    }
  };

  // Prepare chart data from attempts
  const chartData = attempts.map((a, i) => ({
    name: a.date || `Test ${i + 1}`,
    accuracy: a.accuracy
  }));

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-graphite flex items-center gap-2">
          <TrendingUp size={24} className="text-ink-navy" />
          <span>My Performance History</span>
        </h1>
        <p className="text-sm text-graphite-soft mt-0.5">
          Track accuracy over time, analyze topic weaknesses, and launch targeted revision papers.
        </p>
      </div>

      {/* Retake Weak Questions CTA Card (if weak topics exist) */}
      {weakTopics.length > 0 && (
        <div className="relative bg-sheet rounded-xl border border-pencil-line p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <RegistrationCorners />
          <div className="space-y-1">
            <div className="font-sans font-bold text-base text-graphite flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-ink" />
              <span>Targeted Revision Test Available</span>
            </div>
            <p className="text-xs text-graphite-soft">
              Generate a personalized test compiled strictly from your historical wrong answers.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRetake}
            disabled={isCreatingRetake}
            className="px-5 py-2.5 rounded-full bg-red-ink hover:bg-red-ink/90 text-white font-sans font-bold text-xs shadow transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={isCreatingRetake ? 'animate-spin' : ''} />
            <span>{isCreatingRetake ? 'Generating Paper...' : 'Retake Weak Questions'}</span>
          </button>
        </div>
      )}

      {/* Accuracy Over Time Line Chart */}
      <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-graphite">Accuracy Trajectory (%)</h2>
        {chartData.length === 0 ? (
          <div className="h-48 w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-pencil-line rounded-lg bg-sheet-2/30">
            <TrendingUp size={28} className="text-graphite-soft mb-2 opacity-60" />
            <div className="font-sans font-bold text-sm text-graphite">No Practice Completed Yet</div>
            <p className="text-xs text-graphite-soft max-w-sm mt-1">
              Start practicing to track your accuracy trajectory over time.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="name" stroke="#6B6E76" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#6B6E76" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#D8D6CC',
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Sans',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#1F2A44"
                  strokeWidth={3}
                  dot={{ fill: '#1F2A44', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Weak Topics Bar Performance List */}
      <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-graphite">Topic-wise Breakdown</h2>
        {weakTopics.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-pencil-line rounded-lg bg-sheet-2/30">
            <p className="text-xs font-sans text-graphite-soft">
              No topic practice completed yet. Attempt questions across test papers to generate a breakdown of your strengths and weaknesses.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {weakTopics.map((top) => {
              const isWeak = top.accuracy < 50;
              return (
                <div key={top.topic} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-graphite">
                      {top.subject} · {top.topic}
                    </span>
                    <span className={isWeak ? 'text-red-ink font-bold' : 'text-exam-green font-bold'}>
                      {top.accuracy}% Accuracy
                    </span>
                  </div>
                  <div className="w-full bg-pencil-line/40 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isWeak ? 'bg-red-ink' : 'bg-exam-green'
                      }`}
                      style={{ width: `${top.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Attempts Table */}
      <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-graphite">Recent Test Attempts</h2>
        {attempts.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-pencil-line rounded-lg bg-sheet-2/30">
            <p className="text-xs font-sans text-graphite-soft">
              No practice completed yet. Start practicing to track your progress.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-pencil-line">
            {attempts.map((att) => (
              <div
                key={att.attempt_id}
                onClick={() => onNavigate('results', att.attempt_id)}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-sheet-2 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-ink-navy" />
                  <div>
                    <div className="font-sans font-bold text-sm text-graphite">
                      {att.test_title}
                    </div>
                    <div className="font-mono text-xs text-graphite-soft">
                      {att.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DigitBox value={`${att.score}/${att.total}`} size="sm" />
                  <span className="font-mono font-bold text-sm text-ink-navy">
                    {att.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
