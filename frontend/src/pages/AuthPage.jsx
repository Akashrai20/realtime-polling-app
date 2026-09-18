import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, LogIn, UserPlus, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

export const AuthPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    if (activeTab === 'register' && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = activeTab === 'register' ? '/auth/register' : '/auth/login';
      const response = await api.post(endpoint, {
        username: username.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('token', token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      setSuccess(activeTab === 'register' ? 'Account registered successfully!' : 'Login successful!');

      setTimeout(() => {
        navigate('/create');
      }, 600);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Authentication request failed.';
      setError(msg);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-8">
      <div className="glass-card p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Top Glow bar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-b-full shadow-lg shadow-cyan-500/50" />

        {/* Title */}
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {activeTab === 'login'
              ? 'Enter your credentials to access live polling'
              : 'Register to create real-time Redis polls'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'login'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'register'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full glass-input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input pl-10 text-xs"
              />
            </div>
            {activeTab === 'register' && (
              <p className="text-[10px] text-slate-500 mt-1">
                Must be at least 6 characters (hashed with bcrypt)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-semibold text-white gradient-button mt-2"
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>JWT tokens stored safely in localStorage</span>
        </div>
      </div>
    </div>
  );
};
