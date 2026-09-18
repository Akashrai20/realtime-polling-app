import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Radio, PlusCircle, Users, ChevronRight, Zap, Shield, Clock } from 'lucide-react';
import api from '../api/axios';
import { formatCountdown, getRemainingSeconds } from '../utils/formatters';

export const PollListPage = () => {
  const [polls, setPolls] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/polls')
      .then((res) => {
        setPolls(res.data.polls || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Backend offline, loading mock polls:', err.message);
        setLoading(false);
      });
  }, []);

  const filteredPolls = polls.filter((poll) =>
    poll.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poll.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative glass-card p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>High-Concurrency Real-Time Live Polling Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Live Community Polls & <span className="gradient-text">WebSocket Visualizer</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Backed by Go (Gin), Redis atomic `HINCRBY` counters, Pub/Sub channels, and browser fingerprint fraud protection.
          </p>

          <div className="pt-2">
            <Link
              to="/create"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-semibold text-white gradient-button"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Poll</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-10 text-xs"
          />
        </div>
      </div>

      {/* Poll Cards Grid */}
      {filteredPolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => {
            const total = poll.totalVotes || poll.options?.reduce((s, o) => s + (o.votes || 0), 0) || 0;
            return (
              <Link
                key={poll.id}
                to={`/poll/${poll.id}`}
                className="glass-card p-6 border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between group"
              >
                <div className="space-y-2 mb-6">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {poll.question}
                  </h3>
                  {poll.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {poll.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center space-x-1 font-mono">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-slate-200">{total} votes</span>
                  </span>

                  <span className="flex items-center space-x-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Vote / Results</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No active polls found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create a brand new live poll to kick off community voting.
          </p>
          <Link
            to="/create"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-button"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Poll Now</span>
          </Link>
        </div>
      )}
    </div>
  );
};
