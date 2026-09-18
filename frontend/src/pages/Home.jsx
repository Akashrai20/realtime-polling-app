import React, { useState } from 'react';
import { Search, Radio, Filter, Flame, Clock, CheckCircle2, Zap, Shield, PlusCircle } from 'lucide-react';
import { PollCard } from '../components/poll/PollCard';

export const Home = ({ polls, onSelectPoll, onCreateNew }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'live' | 'expired'

  const filteredPolls = polls.filter((poll) => {
    const matchesSearch =
      poll.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      poll.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const isLive = new Date(poll.expiresAt).getTime() > Date.now();

    if (activeTab === 'live') return matchesSearch && isLive;
    if (activeTab === 'expired') return matchesSearch && !isLive;
    return matchesSearch;
  });

  const totalVotesCast = polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0);
  const liveCount = polls.filter(p => new Date(p.expiresAt).getTime() > Date.now()).length;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative glass-card p-6 sm:p-10 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>High-Concurrency Real-Time Live Polling</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Instant Community Polls & <span className="gradient-text">Live Vote Visualizer</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Create interactive live polls backed by Go, Redis atomic vote incrementing (`INCR`), WebSockets pub/sub, and browser fingerprint fraud restriction.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl text-sm font-semibold text-white gradient-button"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Poll</span>
            </button>
          </div>
        </div>

        {/* Stats Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-800/80">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Polls</p>
            <p className="text-2xl font-bold text-slate-100 font-mono">{polls.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Active</p>
            <p className="text-2xl font-bold text-cyan-400 font-mono flex items-center space-x-2">
              <span>{liveCount}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Votes Cast</p>
            <p className="text-2xl font-bold text-violet-400 font-mono">{totalVotesCast.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fraud Protection</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono text-sm flex items-center space-x-1 pt-1">
              <Shield className="w-4 h-4" />
              <span>FingerprintJS</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search active polls..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input pl-10 text-xs"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Polls ({polls.length})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'live'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live ({liveCount})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'expired'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({polls.length - liveCount})
          </button>
        </div>
      </div>

      {/* Poll Cards Grid */}
      {filteredPolls.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll) => (
            <PollCard key={poll.id} poll={poll} onSelect={onSelectPoll} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">No matching polls found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or create a brand new live poll to kick off community voting.
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white gradient-button"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Poll Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
