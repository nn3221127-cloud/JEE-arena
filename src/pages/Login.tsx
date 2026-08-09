import React, { useState } from 'react';
import { api, AuthUser } from '../api/client';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { WireframeScene } from '../components/WireframeScene';
import { Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

/**
 * Screen 4.1: Login (Password Only)
 */
export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setErrorMsg('');
    setIsLoading(true);

    try {
      const user = await api.login(password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || "That password doesn't match any account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-paper relative flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Registration Dot Grid Motif */}
      <div className="absolute inset-0 bg-registration-dots pointer-events-none" />

      {/* 3D Wireframe Icosahedron Background Motif */}
      <WireframeScene opacity={0.3} />

      {/* Main Centered Login Card (360px max width) */}
      <div className="relative z-10 w-full max-w-[360px] bg-sheet rounded-2xl border border-pencil-line p-8 shadow-xl">
        <RegistrationCorners />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-ink-navy text-white font-mono font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            TA
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-graphite">
            JEE Test Arena
          </h1>
          <p className="text-xs font-mono text-graphite-soft mt-1">
            Private Exam Practice Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-graphite-soft mb-1.5">
              Access Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-md border border-pencil-line bg-sheet-2 text-graphite font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ink-navy focus:border-ink-navy transition-all"
              />
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-soft"
              />
            </div>
          </div>

          {/* Wrong password inline error message */}
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-ink-soft border border-red-ink text-red-ink text-xs font-sans font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 px-4 rounded-md bg-ink-navy hover:bg-ink-navy/90 text-white font-sans font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="font-mono text-xs">Authenticating...</span>
            ) : (
              <>
                <span>Enter Arena</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-pencil-line text-center text-[11px] font-mono text-graphite-soft">
          Single Password Authentication System
        </div>
      </div>
    </div>
  );
};
