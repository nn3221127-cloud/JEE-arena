import React, { useEffect, useState } from 'react';
import { api, LeaderboardUser } from '../api/client';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { DigitBox } from '../components/DigitBox';
import { Trophy, Flame, Target } from 'lucide-react';

/**
 * Screen 4.8: All-Time Leaderboard (Podium Style)
 */
export const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const data = await api.getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 text-center font-mono text-sm text-graphite-soft">
        Calculating standings...
      </div>
    );
  }

  const rank1 = leaderboard.find((u) => u.rank === 1) || leaderboard[0];
  const rank2 = leaderboard.find((u) => u.rank === 2) || leaderboard[1];
  const rank3 = leaderboard.find((u) => u.rank === 3) || leaderboard[2];

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="w-10 h-10 rounded-full bg-ink-navy text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
          <Trophy size={20} />
        </div>
        <h1 className="text-2xl font-bold text-graphite">All-Time Arena Standings</h1>
        <p className="text-sm text-graphite-soft">
          Rankings computed from accuracy, total tests completed, and consistency streaks.
        </p>
      </div>

      {/* Podium-Style Top 3 Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 max-w-4xl mx-auto">
        {/* Rank 2 (Flanking Left) */}
        {rank2 && (
          <div className="relative bg-sheet rounded-xl border border-pencil-line p-6 shadow-sm text-center space-y-3 order-2 md:order-1">
            <RegistrationCorners />
            <DigitBox value="02" size="sm" />
            <div className="w-14 h-14 rounded-full bg-sheet-2 border-2 border-pencil-line text-graphite font-mono font-bold text-xl flex items-center justify-center mx-auto">
              {rank2.avatar_letter}
            </div>
            <div>
              <div className="font-sans font-bold text-base text-graphite">
                {rank2.user_name}
              </div>
              <div className="font-mono text-xs text-graphite-soft">
                {rank2.tests_taken} Tests Completed
              </div>
            </div>
            <div className="pt-2 border-t border-pencil-line">
              <div className="font-mono font-extrabold text-2xl text-ink-navy">
                {rank2.overall_accuracy}%
              </div>
              <div className="text-[10px] font-mono text-graphite-soft uppercase">Overall Accuracy</div>
            </div>
          </div>
        )}

        {/* Rank 1 (Centered, Raised & Larger) */}
        {rank1 && (
          <div className="relative bg-sheet rounded-xl border-2 border-ink-navy p-8 shadow-md text-center space-y-4 order-1 md:order-2 md:-translate-y-4">
            <RegistrationCorners />
            <div className="inline-block">
              <DigitBox value="01" size="md" active />
            </div>
            <div className="w-20 h-20 rounded-full bg-ink-navy text-white font-mono font-bold text-3xl flex items-center justify-center mx-auto shadow-md">
              {rank1.avatar_letter}
            </div>
            <div>
              <div className="font-sans font-bold text-xl text-graphite">
                {rank1.user_name}
              </div>
              <div className="font-mono text-xs text-graphite-soft flex items-center justify-center gap-1 mt-0.5">
                <Flame size={14} className="text-amber-flag" />
                <span>{rank1.current_streak} Test Streak</span>
              </div>
            </div>
            <div className="pt-3 border-t border-pencil-line">
              <div className="font-mono font-extrabold text-4xl text-ink-navy">
                {rank1.overall_accuracy}%
              </div>
              <div className="text-xs font-mono text-graphite-soft uppercase">Overall Accuracy</div>
            </div>
          </div>
        )}

        {/* Rank 3 (Flanking Right) */}
        {rank3 && (
          <div className="relative bg-sheet rounded-xl border border-pencil-line p-6 shadow-sm text-center space-y-3 order-3">
            <RegistrationCorners />
            <DigitBox value="03" size="sm" />
            <div className="w-14 h-14 rounded-full bg-sheet-2 border-2 border-pencil-line text-graphite font-mono font-bold text-xl flex items-center justify-center mx-auto">
              {rank3.avatar_letter}
            </div>
            <div>
              <div className="font-sans font-bold text-base text-graphite">
                {rank3.user_name}
              </div>
              <div className="font-mono text-xs text-graphite-soft">
                {rank3.tests_taken} Tests Completed
              </div>
            </div>
            <div className="pt-2 border-t border-pencil-line">
              <div className="font-mono font-extrabold text-2xl text-ink-navy">
                {rank3.overall_accuracy}%
              </div>
              <div className="text-[10px] font-mono text-graphite-soft uppercase">Overall Accuracy</div>
            </div>
          </div>
        )}
      </div>

      {/* Ranks 4+ Table if any */}
      {leaderboard.length > 3 && (
        <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm max-w-4xl mx-auto space-y-3">
          <h2 className="text-sm font-mono font-semibold uppercase text-graphite-soft">
            Full Arena Roster
          </h2>
          <div className="divide-y divide-pencil-line">
            {leaderboard.slice(3).map((u) => (
              <div key={u.user_id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DigitBox value={u.rank < 10 ? `0${u.rank}` : String(u.rank)} size="sm" />
                  <span className="font-sans font-bold text-sm text-graphite">{u.user_name}</span>
                </div>
                <div className="font-mono font-bold text-base text-ink-navy">
                  {u.overall_accuracy}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
