import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, Share2, Play, AlertTriangle, Fingerprint, RefreshCw } from 'lucide-react';
import { CountdownTimer } from '../common/CountdownTimer';
import { QRCodeModal } from './QRCodeModal';
import { PollChart } from './PollChart';
import { getVisitorFingerprint } from '../../utils/fingerprint';
import { useWebSocket } from '../../hooks/useWebSocket';

export const VotePollCard = ({ initialPoll, onPollUpdate }) => {
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [userVotedOptionId, setUserVotedOptionId] = useState(null);
  const [visitorId, setVisitorId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if initialPoll changes
  useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  // Hook into WebSocket stream or fallback simulator
  const { status: wsStatus, simulateLiveVote } = useWebSocket(poll.id, (updatedPoll) => {
    setPoll(updatedPoll);
    if (onPollUpdate) onPollUpdate(updatedPoll);
  });

  // Load visitor fingerprint & local storage vote state
  useEffect(() => {
    getVisitorFingerprint().then((id) => {
      setVisitorId(id);
      const votedKey = `voted_${poll.id}_${id}`;
      const savedVotedOpt = localStorage.getItem(votedKey);

      if (savedVotedOpt) {
        setHasVoted(true);
        setUserVotedOptionId(savedVotedOpt);
      }
    });
  }, [poll.id]);

  const handleCastVote = async () => {
    if (!selectedOptionId) {
      setVoteError('Please select an option before casting your vote.');
      return;
    }

    setVoteError('');
    setIsSubmitting(true);

    // Duplicate vote check via FingerprintJS
    if (hasVoted && poll.restrictFingerprint) {
      setVoteError('Duplicate Vote Blocked: Your device fingerprint has already recorded a vote for this poll.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      const updatedOptions = poll.options.map((opt) => {
        if (opt.id === selectedOptionId) {
          return { ...opt, votes: (opt.votes || 0) + 1 };
        }
        return opt;
      });

      const updatedPoll = {
        ...poll,
        totalVotes: (poll.totalVotes || 0) + 1,
        options: updatedOptions,
      };

      setPoll(updatedPoll);
      setHasVoted(true);
      setUserVotedOptionId(selectedOptionId);
      setIsSubmitting(false);

      if (visitorId) {
        localStorage.setItem(`voted_${poll.id}_${visitorId}`, selectedOptionId);
      }

      if (onPollUpdate) {
        onPollUpdate(updatedPoll);
      }

      // Trigger celebration confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#8b5cf6', '#10b981'],
      });
    }, 400);
  };

  const handleSimulateVote = () => {
    simulateLiveVote(poll, (updated) => {
      setPoll(updated);
      if (onPollUpdate) onPollUpdate(updated);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/30">
              {poll.category || 'General'}
            </span>
            <CountdownTimer expiresAt={poll.expiresAt} />
          </div>

          <div className="flex items-center space-x-2">
            {/* Share QR Button */}
            <button
              onClick={() => setIsQRModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share & QR</span>
            </button>

            {/* Live Vote Simulator Button */}
            <button
              onClick={handleSimulateVote}
              title="Simulate incoming real-time vote from another remote client"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Simulate Live Vote</span>
            </button>
          </div>
        </div>

        {/* Poll Title & Description */}
        <div className="py-6 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
              {poll.description}
            </p>
          )}
        </div>

        {/* Fraud Restriction Banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-violet-400" />
              <span>Fingerprint Check: {poll.restrictFingerprint ? 'Enabled' : 'Disabled'}</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atomic INCR: Active</span>
            </span>
          </div>
          {visitorId && (
            <span className="font-mono text-slate-500 text-[10px]">
              ID: {visitorId.substring(0, 10)}...
            </span>
          )}
        </div>

        {/* Error message */}
        {voteError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{voteError}</span>
          </div>
        )}

        {/* Main Grid: Voting Options vs Live Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Column 1: Options Form */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {hasVoted ? 'Your Selection' : 'Cast Your Vote'}
            </h3>

            <div className="space-y-2.5">
              {poll.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isVotedChoice = userVotedOptionId === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => !hasVoted && setSelectedOptionId(option.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isVotedChoice
                        ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                        : isSelected
                        ? 'bg-slate-900 border-cyan-500/60 shadow-lg'
                        : hasVoted
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-75 cursor-default'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                        isSelected || isVotedChoice
                          ? 'border-cyan-400 bg-cyan-500'
                          : 'border-slate-600 bg-slate-900'
                      }`}>
                        {(isSelected || isVotedChoice) && (
                          <div className="w-2 h-2 rounded-full bg-slate-950" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-200">{option.text}</span>
                    </div>

                    {isVotedChoice && (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-cyan-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Voted</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cast Vote Button */}
            {!hasVoted ? (
              <button
                onClick={handleCastVote}
                disabled={!selectedOptionId || isSubmitting}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                  selectedOptionId && !isSubmitting
                    ? 'gradient-button'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Recording Vote...</span>
                  </span>
                ) : (
                  'Submit Vote'
                )}
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
                <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Vote Successfully Recorded</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Thank you! Live results below will update dynamically as other users vote.
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Live Visual Chart */}
          <div>
            <PollChart
              options={poll.options}
              totalVotes={poll.totalVotes}
              userVotedOptionId={userVotedOptionId}
            />
          </div>
        </div>
      </div>

      {/* QR Code Dialog Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        pollTitle={poll.title}
        pollId={poll.id}
      />
    </div>
  );
};
