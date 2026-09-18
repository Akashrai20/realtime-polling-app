import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, BarChart3, List, CheckCircle2 } from 'lucide-react';
import { calculatePercentages } from '../../utils/formatters';

const BAR_COLORS = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
];

export const PollChart = ({ options = [], totalVotes = 0, userVotedOptionId }) => {
  const [chartView, setChartView] = useState('bars'); // 'bars' | 'chart'

  const formattedOptions = calculatePercentages(options);
  const leadingOption = formattedOptions.reduce(
    (max, opt) => (opt.votes > (max?.votes || 0) ? opt : max),
    null
  );

  return (
    <div className="space-y-6">
      {/* Chart Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Live Results ({totalVotes} {totalVotes === 1 ? 'Vote' : 'Votes'})
          </span>
          {leadingOption && leadingOption.votes > 0 && (
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Trophy className="w-3 h-3" />
              <span>Leader: {leadingOption.text}</span>
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setChartView('bars')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              chartView === 'bars'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Progress Bars</span>
          </button>
          <button
            onClick={() => setChartView('chart')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              chartView === 'chart'
                ? 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Recharts Bar</span>
          </button>
        </div>
      </div>

      {/* View 1: Recharts Animated Bar Chart */}
      {chartView === 'chart' ? (
        <div className="h-64 w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedOptions} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                dataKey="text" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                interval={0}
                tickFormatter={(val) => (val.length > 15 ? `${val.substring(0, 15)}...` : val)}
              />
              <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} votes`, 'Votes']}
              />
              <Bar dataKey="votes" radius={[8, 8, 0, 0]}>
                {formattedOptions.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={BAR_COLORS[index % BAR_COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* View 2: Detailed Animated Progress Bars */
        <div className="space-y-4">
          {formattedOptions.map((option, index) => {
            const isUserSelection = userVotedOptionId === option.id;
            const isLeader = leadingOption && leadingOption.id === option.id && leadingOption.votes > 0;
            const colorClass = BAR_COLORS[index % BAR_COLORS.length];

            return (
              <div key={option.id} className="group relative space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-300">{option.text}</span>
                    {isUserSelection && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Your Vote</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3 font-mono">
                    <span className="text-slate-400">{option.votes} votes</span>
                    <span className="font-bold text-slate-100 text-sm">{option.percentage}%</span>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/60">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out relative"
                    style={{
                      width: `${option.percentage}%`,
                      backgroundColor: colorClass,
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
      )}
    </div>
  );
};
