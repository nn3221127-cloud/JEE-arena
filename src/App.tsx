import React, { useState, useEffect } from 'react';
import { api, AuthUser, QuestionDraft, AttemptSession } from './api/client';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { QuestionUpload } from './pages/QuestionUpload';
import { QuestionReview } from './pages/QuestionReview';
import { TestStart } from './pages/TestStart';
import { TestTaking } from './pages/TestTaking';
import { Results } from './pages/Results';
import { ProgressDashboard } from './pages/ProgressDashboard';
import { Leaderboard } from './pages/Leaderboard';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Active Screen Navigation State
  const [activeNav, setActiveNav] = useState<string>('home');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [extractedQuestions, setExtractedQuestions] = useState<QuestionDraft[]>([]);
  const [extractionWarning, setExtractionWarning] = useState<string | undefined>();
  const [currentAttemptSession, setCurrentAttemptSession] = useState<AttemptSession | null>(null);
  const [completedAttemptId, setCompletedAttemptId] = useState<string | null>(null);

  // Check existing session token on load
  useEffect(() => {
    const checkSession = async () => {
      const token = api.getToken();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }
      try {
        const authUser = await api.getMe();
        setUser(authUser);
        setActiveNav(authUser.role === 'admin' ? 'dashboard' : 'home');
      } catch (err) {
        console.error('Session expired:', err);
        api.logout();
      } finally {
        setIsAuthChecking(false);
      }
    };
    checkSession();
  }, []);

  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    setActiveNav(authUser.role === 'admin' ? 'dashboard' : 'home');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setActiveNav('home');
    setSelectedTestId(null);
    setCurrentAttemptSession(null);
    setCompletedAttemptId(null);
  };

  const handleNavigate = (nav: string, testId?: string) => {
    setActiveNav(nav);
    if (testId) {
      setSelectedTestId(testId);
    }
  };

  const handleExtractionComplete = (questions: QuestionDraft[], warning?: string) => {
    setExtractedQuestions(questions);
    setExtractionWarning(warning);
    setActiveNav('review');
  };

  const handlePublishSuccess = () => {
    setActiveNav(user?.role === 'admin' ? 'dashboard' : 'home');
  };

  const handleStartAttempt = (session: AttemptSession) => {
    setCurrentAttemptSession(session);
    setActiveNav('test-taking');
  };

  const handleFinishAttempt = (attemptId: string) => {
    setCompletedAttemptId(attemptId);
    setActiveNav('results');
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-sm text-graphite-soft">
        Verifying session token...
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AppShell
      user={user}
      activeNav={activeNav}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {/* Admin Dashboard */}
      {activeNav === 'dashboard' && user.role === 'admin' && (
        <AdminDashboard user={user} onNavigate={handleNavigate} />
      )}

      {/* Member Home / Tests List */}
      {activeNav === 'home' && (
        <AdminDashboard user={user} onNavigate={handleNavigate} />
      )}

      {/* Step 1: Upload Paper */}
      {activeNav === 'upload' && (
        <QuestionUpload onExtractionComplete={handleExtractionComplete} />
      )}

      {/* Step 2 & 3: Question Review & Publish */}
      {activeNav === 'review' && (
        <QuestionReview
          initialQuestions={extractedQuestions}
          extractionWarning={extractionWarning}
          onPublishSuccess={handlePublishSuccess}
        />
      )}

      {/* Test Start Screen */}
      {activeNav === 'test-start' && selectedTestId && (
        <TestStart
          testId={selectedTestId}
          onStartTest={handleStartAttempt}
          onBack={() => setActiveNav(user.role === 'admin' ? 'dashboard' : 'home')}
        />
      )}

      {/* Test Taking Screen */}
      {activeNav === 'test-taking' && currentAttemptSession && (
        <TestTaking
          session={currentAttemptSession}
          onFinishTest={handleFinishAttempt}
        />
      )}

      {/* Results Screen */}
      {activeNav === 'results' && (completedAttemptId || currentAttemptSession?.attempt_id) && (
        <Results
          attemptId={completedAttemptId || currentAttemptSession!.attempt_id}
          onNavigate={handleNavigate}
        />
      )}

      {/* Progress Dashboard */}
      {activeNav === 'progress' && (
        <ProgressDashboard
          onNavigate={handleNavigate}
          onStartRetakeTest={(testId) => handleNavigate('test-start', testId)}
        />
      )}

      {/* Leaderboard */}
      {activeNav === 'leaderboard' && <Leaderboard />}
    </AppShell>
  );
}
