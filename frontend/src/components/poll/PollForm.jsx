import React, { useState } from 'react';
import { Plus, Trash2, Shield, Fingerprint, Clock, Sparkles, AlertCircle } from 'lucide-react';

const DURATION_PRESETS = [
  { label: '15 Mins', value: 15 * 60 },
  { label: '1 Hour', value: 60 * 60 },
  { label: '24 Hours', value: 24 * 60 * 60 },
  { label: '7 Days', value: 7 * 24 * 60 * 60 },
];

export const PollForm = ({ onCreatePoll, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(24 * 60 * 60); // 24 hours default
  const [restrictFingerprint, setRestrictFingerprint] = useState(true);
  const [restrictIP, setRestrictIP] = useState(true);
  const [category, setCategory] = useState('General');
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a poll question or title.');
      return;
    }

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('Please provide at least 2 non-empty choices.');
      return;
    }

    const expiresAt = new Date(Date.now() + duration * 1000).toISOString();

    const newPoll = {
      id: `poll-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      expiresAt,
      options: validOptions.map((text, idx) => ({
        id: `opt-${idx + 1}`,
        text,
        votes: 0,
      })),
      totalVotes: 0,
      restrictFingerprint,
      restrictIP,
      category,
      isLive: true,
      creator: 'Current User',
    };

    onCreatePoll(newPoll);
  };

  return (
    <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 border border-slate-800 shadow-2xl">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-md">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Create a Live Poll</h2>
          <p className="text-xs text-slate-400">Setup instant real-time voting with duplicate restriction rules</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Poll Question / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Which backend framework should we adopt for 2026?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-input text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Description / Context (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Provide additional details or voting instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full glass-input text-sm resize-none"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Poll Choices (Min 2, Max 8)
            </label>
            <span className="text-xs text-slate-500">{options.length}/8 Choices</span>
          </div>

          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="w-6 text-xs text-slate-500 font-mono text-right">{idx + 1}.</span>
              <input
                type="text"
                required
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                className="flex-1 glass-input text-sm"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {options.length < 8 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 pt-1 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          )}
        </div>

        {/* Expiry Duration */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Poll Duration / Live Countdown
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDuration(preset.value)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition ${
                  duration === preset.value
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Security & Restrictions */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/60">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Security & Fraud Controls
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Fingerprint className="w-4 h-4 text-violet-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Browser Fingerprint Restriction</p>
                <p className="text-[10px] text-slate-400">Prevents multiple votes from the same device browser hash</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={restrictFingerprint}
              onChange={(e) => setRestrictFingerprint(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">IP Address Restriction</p>
                <p className="text-[10px] text-slate-400">Enforces atomic single vote per IP network address</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={restrictIP}
              onChange={(e) => setRestrictIP(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Submit / Cancel Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-900 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl text-xs font-semibold text-white gradient-button"
          >
            Launch Live Poll
          </button>
        </div>
      </form>
    </div>
  );
};
