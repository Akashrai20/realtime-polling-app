import React from 'react';
import { BarChart2, Users, ChevronRight, Fingerprint, Activity } from 'lucide-react';
import { CountdownTimer } from '../common/CountdownTimer';
import { formatRelativeTime } from '../../utils/formatters';

export const PollCard = ({ poll, onSelect }) => {
  const topOption = poll.options?.reduce(
    (max, opt) => (opt.votes > (max?.votes || 0) ? opt : max),
    null
  );

  return (
    <div
      onClick={() => onSelect(poll)}
      className="glass-card-hover p-6 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
          {poll.category || 'General'}
        </span>
        <CountdownTimer expiresAt={poll.expiresAt} />
      </div>

      {/* Main Content */}
      <div className="space-y-2 mb-6">
        <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2">
          {poll.title}
        </h3>
        {poll.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {poll.description}
          </p>
        )}
      </div>

      {/* Stats Footer */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {/* Top leading option preview */}
        {topOption && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/60">
            <span className="truncate max-w-[160px] text-slate-300">Leader: {topOption.text}</span>
            <span className="font-mono text-cyan-400 font-semibold">{topOption.votes} votes</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-200">{poll.totalVotes || 0}</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px]">{formatRelativeTime(poll.createdAt)}</span>
          </div>

          <span className="flex items-center space-x-1 text-cyan-400 font-semibold text-xs group-hover:translate-x-1 transition-transform">
            <span>Vote / View</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
};
