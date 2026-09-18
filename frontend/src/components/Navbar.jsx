import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Radio, PlusCircle, LayoutDashboard, LogIn, LogOut, User, Activity } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight gradient-text">HCL LivePoll</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Go + Redis
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Real-Time WebSocket Polling Engine</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                location.pathname === '/'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Polls</span>
            </Link>

            <Link
              to="/create"
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                location.pathname === '/create'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span>Create Poll</span>
            </Link>

            {/* Auth status & logout */}
            {token && user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold gradient-button"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
