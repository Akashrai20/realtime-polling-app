import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Clock, AlertTriangle, Fingerprint, RefreshCw, Zap } from 'lucide-react';
import api from '../api/axios';
import { getVisitorFingerprint } from '../utils/fingerprint';
import { formatCountdown, getRemainingSeconds } from '../utils/formatters';

const BAR_COLORS = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

export const PollViewPage = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [userVotedOptionId, setUserVotedOptionId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [fingerprint, setFingerprint] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting');
  const [remainingSecs, setRemainingSecs] = useState(0);

  const wsRef = useRef(null);

  // 1. Fetch Poll Details from Backend
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    api.get(`/polls/${id}`)
      .then((res) => {
        const pollData = res.data.poll;
        setPoll(pollData);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response?.data?.error || 'Failed to load poll details');
      });
  }, [id]);

  // 2. Load Visitor Fingerprint & Check Local Vote Status
  useEffect(() => {
    if (!id) return;

    getVisitorFingerprint().then((fp) => {
      setFingerprint(fp);
      const votedChoice = localStorage.getItem(`voted_poll_${id}`);
      if (votedChoice) {
        setHasVoted(true);
        setUserVotedOptionId(votedChoice);
      }
    });
  }, [id]);

  // 3. Countdown Timer tick
  useEffect(() => {
    if (!poll?.expiresAt) return;

    setRemainingSecs(getRemainingSeconds(poll.expiresAt));
    const interval = setInterval(() => {
      const secs = getRemainingSeconds(poll.expiresAt);
      setRemainingSecs(secs);
    }, 1000);

    return () => clearInterval(interval);
  }, [poll?.expiresAt]);

  // 4. Native WebSocket Connection
  useEffect(() => {
    if (!id) return;

    const defaultWsBase =
      typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:8081'
        : 'wss://hcl-polling-backend.onrender.com';
    const wsBase = import.meta.env.VITE_WS_BASE_URL || defaultWsBase;
    const wsUrl = `${wsBase}/api/polls/${id}/ws`;

    console.log(`[WebSocket] Connecting to ${wsUrl}`);
    setWsStatus('connecting');

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`[WebSocket] Connected to live stream for poll ${id}`);
        setWsStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'VOTE_UPDATE' && data.poll) {
            setPoll(data.poll);
          }
        } catch (err) {
          console.error('[WebSocket Error] Message parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebSocket Warning] Connection error:', err);
        setWsStatus('disconnected');
      };

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        setWsStatus('disconnected');
      };
    } catch (err) {
      console.warn('[WebSocket] Server unavailable, running client mode:', err);
      setWsStatus('disconnected');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [id]);

  // Cast Vote Handler
  const handleVoteSubmit = async () => {
    if (!selectedOptionId) {
      setError('Please select an option to vote.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await api.post(`/polls/${id}/vote`, {
        poll_id: id,
        option_id: selectedOptionId,
        voter_fingerprint: fingerprint || 'fp_fallback_' + Date.now(),
      });

      const { new_option_votes, total_votes } = response.data;

      // Update state locally
      setPoll((prev) => {
        if (!prev) return prev;
        const updatedOptions = prev.options.map((opt) => {
          if (opt.id === selectedOptionId) {
            return { ...opt, votes: new_option_votes || opt.votes + 1 };
          }
          return opt;
        });
        return {
          ...prev,
          totalVotes: total_votes || prev.totalVotes + 1,
          options: updatedOptions,
        };
      });

      setHasVoted(true);
      setUserVotedOptionId(selectedOptionId);
      localStorage.setItem(`voted_poll_${id}`, selectedOptionId);
      setSubmitting(false);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#10b981'],
      });
    } catch (err) {
      setSubmitting(false);
      const msg = err.response?.data?.error || err.message || 'Failed to submit vote.';
      setError(msg);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto pt-20 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Loading live poll stats...</p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="max-w-md mx-auto pt-16 glass-card p-6 text-center space-y-4 border border-rose-500/30">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">Unable to Load Poll</h3>
        <p className="text-xs text-slate-400">{error}</p>
      </div>
    );
  }

  const totalVotes = poll.totalVotes || poll.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;
  
  const leadingOption = poll.options?.reduce(
    (max, opt) => ((opt.votes || 0) > (max?.votes || 0) ? opt : max),
    null
  );

  const isExpired = remainingSecs <= 0 && poll.expiresAt;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="glass-card p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800">
          {/* Expiry Clock */}
          <div className="flex items-center space-x-2">
            {poll.expiresAt && (
              <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                isExpired
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-900 text-cyan-400 border-slate-800'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>{isExpired ? 'Poll Expired' : formatCountdown(remainingSecs)}</span>
              </span>
            )}
          </div>

          {/* WebSocket Live Status */}
          <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            wsStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <Zap className="w-3.5 h-3.5" />
            <span>{wsStatus === 'connected' ? 'WebSocket Live' : 'Polling Sync'}</span>
          </div>
        </div>

        {/* Question & Description */}
        <div className="py-6 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
            {poll.question}
          </h1>
          {poll.description && (
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {poll.description}
            </p>
          )}
        </div>

        {/* Security bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
          <span className="flex items-center space-x-1.5">
            <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
            <span>Fingerprint Protection: Active</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Redis Atomic Counter</span>
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Options & Progress Bars */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {hasVoted ? 'Live Results' : 'Select Option & Cast Vote'}
            </span>
            <span className="text-xs font-mono font-semibold text-slate-300">
              {totalVotes} Total {totalVotes === 1 ? 'Vote' : 'Votes'}
            </span>
          </div>

          <div className="space-y-4">
            {poll.options?.map((option, index) => {
              const votes = option.votes || 0;
              const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
              const isSelected = selectedOptionId === option.id;
              const isUserChoice = userVotedOptionId === option.id;
              const isLeader = leadingOption && leadingOption.id === option.id && votes > 0;
              const color = BAR_COLORS[index % BAR_COLORS.length];

              return (
                <div
                  key={option.id}
                  onClick={() => !hasVoted && !isExpired && setSelectedOptionId(option.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isUserChoice
                      ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md'
                      : isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg'
                      : hasVoted
                      ? 'bg-slate-950/60 border-slate-800/80 cursor-default'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                        isSelected || isUserChoice
                          ? 'border-cyan-400 bg-cyan-500'
                          : 'border-slate-600 bg-slate-900'
                      }`}>
                        {(isSelected || isUserChoice) && (
                          <div className="w-2 h-2 rounded-full bg-slate-950" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{option.text}</span>
                      {isUserChoice && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Your Vote</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-slate-400">{votes} votes</span>
                      <span className="font-bold text-slate-100 text-sm">{percentage}%</span>
                    </div>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out relative"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    >
                      {isLeader && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          {!hasVoted && !isExpired ? (
            <button
              onClick={handleVoteSubmit}
              disabled={!selectedOptionId || submitting}
              className={`w-full py-3.5 rounded-xl font-semibold text-xs transition shadow-lg ${
                selectedOptionId && !submitting
                  ? 'gradient-button'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              {submitting ? 'Submitting Vote...' : 'Submit Vote'}
            </button>
          ) : hasVoted ? (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
              <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Vote Recorded</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Live vote counts update automatically via WebSockets.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
