import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { getRemainingSeconds, formatCountdown } from '../../utils/formatters';

export const CountdownTimer = ({ expiresAt, onExpire }) => {
  const [secondsLeft, setSecondsLeft] = useState(() => getRemainingSeconds(expiresAt));

  useEffect(() => {
    setSecondsLeft(getRemainingSeconds(expiresAt));

    const interval = setInterval(() => {
      const remaining = getRemainingSeconds(expiresAt);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isExpired = secondsLeft <= 0;
  const isUrgent = secondsLeft > 0 && secondsLeft < 300; // Less than 5 minutes

  if (isExpired) {
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Poll Expired</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
      isUrgent
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
        : 'bg-slate-900 text-cyan-400 border-slate-800'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{formatCountdown(secondsLeft)}</span>
    </span>
  );
};
