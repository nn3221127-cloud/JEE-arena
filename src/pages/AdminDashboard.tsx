import React, { useEffect, useState } from 'react';
import { api, TestSummary } from '../api/client';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { DigitBox } from '../components/DigitBox';
import { Plus, FileText, CheckCircle2, Archive, Play, BarChart3, Users } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (nav: string, testId?: string) => void;
}

/**
 * Screen 4.2: Admin Dashboard
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({ total_tests: 0, avg_accuracy: 0, active_members: 0 });
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, testsRes] = await Promise.all([
        api.getAdminStats(),
        api.getTests()
      ]);
      setStats(statsRes);
      setTests(testsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePublish = async (testId: string) => {
    try {
      await api.publishTest(testId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (testId: string) => {
    try {
      await api.archiveTest(testId);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-sans text-graphite">
            Admin Overview
          </h1>
          <p className="text-sm font-sans text-graphite-soft mt-0.5">
            Manage question papers, extractions, and student test performance.
          </p>
        </div>

        {/* "+ New Test" primary pill button */}
        <button
          type="button"
          onClick={() => onNavigate('upload')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink-navy hover:bg-ink-navy/90 text-white font-sans font-semibold text-sm shadow-md transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>+ New Test</span>
        </button>
      </div>

      {/* 3-Column Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Tests */}
        <div className="relative bg-sheet rounded-md border border-pencil-line p-6 shadow-sm">
          <RegistrationCorners />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold uppercase text-graphite-soft">
              Total Tests
            </span>
            <FileText size={18} className="text-graphite-soft" />
          </div>
          <div className="font-mono text-4xl font-extrabold text-graphite">
            {stats.total_tests}
          </div>
          <div className="text-xs font-sans text-graphite-soft mt-2">
            Mock papers uploaded
          </div>
        </div>

        {/* Avg Accuracy */}
        <div className="relative bg-sheet rounded-md border border-pencil-line p-6 shadow-sm">
          <RegistrationCorners />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold uppercase text-graphite-soft">
              Avg Accuracy
            </span>
            <BarChart3 size={18} className="text-ink-navy" />
          </div>
          <div className="font-mono text-4xl font-extrabold text-ink-navy">
            {stats.avg_accuracy}%
          </div>
          <div className="text-xs font-sans text-graphite-soft mt-2">
            Across all member attempts
          </div>
        </div>

        {/* Active Members */}
        <div className="relative bg-sheet rounded-md border border-pencil-line p-6 shadow-sm">
          <RegistrationCorners />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-semibold uppercase text-graphite-soft">
              Active Members
            </span>
            <Users size={18} className="text-exam-green" />
          </div>
          <div className="font-mono text-4xl font-extrabold text-exam-green">
            {stats.active_members}
          </div>
          <div className="text-xs font-sans text-graphite-soft mt-2">
            Enrolled student accounts
          </div>
        </div>
      </div>

      {/* Tests List Section */}
      <div className="bg-sheet rounded-lg border border-pencil-line p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-pencil-line">
          <h2 className="text-lg font-bold font-sans text-graphite flex items-center gap-2">
            <span>Question Papers</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-sheet-2 border border-pencil-line text-graphite-soft">
              {tests.length}
            </span>
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm font-mono text-graphite-soft">
            Loading test papers...
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 text-sm font-sans text-graphite-soft">
            No tests published yet — upload a question paper to create one.
          </div>
        ) : (
          <div className="divide-y divide-pencil-line">
            {tests.map((test) => {
              const statusColors = {
                draft: 'bg-sheet-2 text-graphite-soft border-pencil-line',
                published: 'bg-ink-navy/10 text-ink-navy border-ink-navy/30',
                archived: 'bg-red-ink-soft/40 text-red-ink border-red-ink/20'
              };

              return (
                <div
                  key={test.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sheet-2/40 px-2 rounded-md transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-sans font-bold text-base text-graphite">
                        {test.title}
                      </h3>
                      <span
                        className={`text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${
                          statusColors[test.status]
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-graphite-soft">
                      <DigitBox prefix="Q" value={test.question_count} size="sm" />
                      <span>·</span>
                      <span>~{test.estimated_time_minutes} mins</span>
                      <span>·</span>
                      <span>{test.subjects.join(', ')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigate('test-start', test.id)}
                      className="px-3 py-1.5 rounded text-xs font-sans font-semibold border border-pencil-line bg-sheet hover:bg-sheet-2 text-graphite transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={14} />
                      <span>Preview</span>
                    </button>

                    {test.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handlePublish(test.id)}
                        className="px-3 py-1.5 rounded text-xs font-sans font-semibold bg-ink-navy hover:bg-ink-navy/90 text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 size={14} />
                        <span>Publish</span>
                      </button>
                    )}

                    {test.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => handleArchive(test.id)}
                        className="px-3 py-1.5 rounded text-xs font-sans font-semibold border border-pencil-line text-graphite-soft hover:text-red-ink hover:bg-red-ink-soft transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Archive size={14} />
                        <span>Archive</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
