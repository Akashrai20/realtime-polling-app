import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Shield, Fingerprint, Clock, Sparkles, AlertCircle, Copy, Check, Download, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const DURATION_PRESETS = [
  { label: '15 Mins', value: 15 },
  { label: '1 Hour', value: 60 },
  { label: '24 Hours', value: 1440 },
  { label: '7 Days', value: 10080 },
];

export const CreatePollPage = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationMinutes, setDurationMinutes] = useState(1440);
  const [restrictFingerprint, setRestrictFingerprint] = useState(true);
  const [restrictIP, setRestrictIP] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Created poll state for success screen
  const [createdPoll, setCreatedPoll] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) {
      setError('Please enter a poll question.');
      return;
    }

    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      setError('At least 2 non-empty choices are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/polls', {
        question: question.trim(),
        description: description.trim(),
        options: validOptions,
        duration_minutes: durationMinutes,
        restrict_fingerprint: restrictFingerprint,
        restrict_ip: restrictIP,
      });

      const pollObj = response.data.poll;
      setCreatedPoll(pollObj);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Failed to create poll.';
      setError(msg);
    }
  };

  const shareableUrl = createdPoll
    ? `${window.location.origin}/poll/${createdPoll.id}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById(`qr-created-${createdPoll.id}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `poll-${createdPoll.id}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Success view with Shareable Link & QR Code
  if (createdPoll) {
    return (
      <div className="max-w-xl mx-auto pt-6 space-y-6">
        <div className="glass-card p-6 sm:p-8 border border-emerald-500/40 shadow-2xl text-center space-y-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-100">Live Poll Created!</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your real-time poll is now published and ready for audience votes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Question</span>
            <p className="text-sm font-semibold text-cyan-300">{createdPoll.question}</p>
          </div>

          {/* QR Code Container */}
          <div className="py-2 flex flex-col items-center space-y-3">
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
              <QRCodeSVG
                id={`qr-created-${createdPoll.id}`}
                value={shareableUrl}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Scan with mobile camera to vote instantly
            </p>
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold text-slate-300">
              Shareable Link
            </label>
            <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-transparent text-xs text-slate-300 font-mono px-2 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-400 hover:bg-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleDownloadQR}
              className="w-full sm:w-1/2 flex items-center justify-center space-x-2 py-3 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download QR</span>
            </button>

            <button
              onClick={() => navigate(`/poll/${createdPoll.id}`)}
              className="w-full sm:w-1/2 flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-semibold text-white gradient-button"
            >
              <span>View Live Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Poll Form View
  return (
    <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8 border border-slate-800 shadow-2xl">
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-md">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100">Create a Poll</h2>
          <p className="text-xs text-slate-400">Setup dynamic choices with Redis atomic vote counters</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Poll Question *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Which Go HTTP framework is your favorite?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full glass-input text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Description / Context (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Provide context or instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full glass-input text-sm resize-none"
          />
        </div>

        {/* Dynamic Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Choices (Min 2, Max 8)
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
            Poll Expiry Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setDurationMinutes(preset.value)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition ${
                  durationMinutes === preset.value
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

        {/* Fraud Restrictions */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800/60">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Security Controls
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Fingerprint className="w-4 h-4 text-violet-400" />
              <div>
                <p className="text-xs font-medium text-slate-200">Browser Fingerprint Restriction</p>
                <p className="text-[10px] text-slate-400">Enforces single vote per device hash</p>
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
                <p className="text-[10px] text-slate-400">Limits one vote per IP network address</p>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-xs font-semibold text-white gradient-button"
        >
          {loading ? 'Creating Poll...' : 'Publish Poll & Generate QR Code'}
        </button>
      </form>
    </div>
  );
};
