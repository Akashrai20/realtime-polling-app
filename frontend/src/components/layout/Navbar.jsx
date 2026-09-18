import React from 'react';
import { Radio, PlusCircle, LayoutDashboard, Zap, LogOut, User, LogIn, Activity } from 'lucide-react';
import { authService } from '../../services/api';

export const Navbar = ({ activeView, setActiveView, user, onLogout, wsStatus = 'disconnected' }) => {
  const currentUser = user || authService.getCurrentUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveView('home')}
          >
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all">
              <Radio className="w-5 h-5 animate-pulse-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight gradient-text">HCL LivePoll</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Go + Redis
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">Real-time Polling & Analytics</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveView('home')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'home'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Poll Dashboard</span>
            </button>

            <button
              onClick={() => setActiveView('create')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'create'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Create Poll</span>
            </button>

            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">{currentUser.username}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveView('auth')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeView === 'auth'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'gradient-button'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </nav>

          {/* System Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 border-l border-slate-800 pl-4">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Redis INCR</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
