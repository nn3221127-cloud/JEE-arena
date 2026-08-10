import React from 'react';
import { AuthUser, api } from '../api/client';
import { PERMISSIONS } from '../lib/permissions';
import { LayoutDashboard, FileText, Upload, Trophy, TrendingUp, LogOut, Moon, Sun } from 'lucide-react';

interface AppShellProps {
  user: AuthUser;
  activeNav: string;
  onNavigate: (nav: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

/**
 * Global App Shell Component:
 * - Top bar (fixed 64px, sheet background, pencil-line border)
 * - Admin Sidebar (desktop 240px) or Member Top/Bottom navigation
 * - Responsive breakpoints and paper background
 */
export const AppShell: React.FC<AppShellProps> = ({
  user,
  activeNav,
  onNavigate,
  onLogout,
  children
}) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'home', label: 'Tests', icon: FileText },
    { id: 'upload', label: 'Upload Paper', icon: Upload },
    { id: 'progress', label: 'My Progress', icon: TrendingUp },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
  ];

  const memberNavItems = [
    { id: 'home', label: 'Tests', icon: FileText },
    { id: 'progress', label: 'My Progress', icon: TrendingUp },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
  ];

  const navItems = PERMISSIONS.canManageTests(user.role) ? adminNavItems : memberNavItems;


  return (
    <div className="min-h-screen bg-paper text-graphite flex flex-col font-sans">
      {/* Fixed Top Bar (64px) */}
      <header className="h-16 bg-sheet border-b border-pencil-line fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo / Wordmark in Plex Sans semibold */}
          <div
            onClick={() => onNavigate(user.role === 'admin' ? 'dashboard' : 'home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded bg-ink-navy text-white flex items-center justify-center font-mono font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
              TA
            </div>
            <span className="font-sans font-bold text-lg sm:text-xl tracking-tight text-graphite">
              JEE Test Arena
            </span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sheet-2 border border-pencil-line text-graphite-soft hidden sm:inline-block">
              {user.role === 'admin' ? 'ADMIN' : 'MEMBER'}
            </span>
          </div>
        </div>

        {/* User Info & Actions Right */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-md hover:bg-sheet-2 border border-transparent hover:border-pencil-line transition-colors text-graphite-soft"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-pencil-line">
            <div className="w-8 h-8 rounded-full bg-ink-navy text-white font-mono font-bold text-sm flex items-center justify-center">
              {user.name.charAt(0)}
            </div>
            <span className="font-sans font-medium text-sm text-graphite hidden md:inline-block">
              {user.name}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-graphite-soft hover:text-red-ink hover:bg-red-ink-soft rounded-md transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-mono font-medium"
            title="Logout"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="pt-16 flex-1 flex">
        {/* Desktop Admin Sidebar (240px) */}
        {user.role === 'admin' && (
          <aside className="w-60 bg-paper border-r border-pencil-line fixed top-16 bottom-0 left-0 hidden md:flex flex-col py-6 px-3 z-30">
            <div className="text-xs font-mono font-semibold text-graphite-soft uppercase tracking-wider px-3 mb-3">
              Admin Navigation
            </div>
            <nav className="flex-1 space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-sans text-sm transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-sheet-2 text-ink-navy font-bold border-l-3 border-ink-navy shadow-xs'
                        : 'text-graphite-soft hover:text-graphite hover:bg-sheet-2/60'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-ink-navy' : 'text-graphite-soft'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="px-3 pt-4 border-t border-pencil-line text-xs font-mono text-graphite-soft">
              Paper-and-Ink Edition v1.0
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 min-h-[calc(100vh-64px)] pb-16 md:pb-8 ${
            user.role === 'admin' ? 'md:ml-60' : ''
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation Tab Bar (Bottom 56px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-sheet border-t border-pencil-line flex items-center justify-around z-40 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded text-xs font-sans cursor-pointer ${
                isActive ? 'text-ink-navy font-bold' : 'text-graphite-soft'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
