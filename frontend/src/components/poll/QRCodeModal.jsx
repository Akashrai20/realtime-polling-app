import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Download, Share2, ExternalLink } from 'lucide-react';

export const QRCodeModal = ({ isOpen, onClose, pollTitle, pollId }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pollUrl = `${window.location.origin}/#poll-${pollId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById(`qr-code-svg-${pollId}`);
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
      downloadLink.download = `poll-${pollId}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md glass-card p-6 border border-slate-700/80 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100">Share Live Poll</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 flex flex-col items-center space-y-5">
          <p className="text-xs text-slate-400 text-center line-clamp-2 px-2 font-medium">
            "{pollTitle}"
          </p>

          {/* QR Code Container */}
          <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center">
            <QRCodeSVG
              id={`qr-code-svg-${pollId}`}
              value={pollUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="text-[11px] text-slate-500 font-mono text-center">
            Scan with any mobile camera for instant voting
          </p>

          {/* Link box */}
          <div className="w-full flex items-center space-x-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <input
              type="text"
              readOnly
              value={pollUrl}
              className="flex-1 bg-transparent text-xs text-slate-300 font-mono px-2 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-cyan-400 hover:bg-slate-700 transition"
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

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleDownloadQR}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
