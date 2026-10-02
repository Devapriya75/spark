import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Check, QrCode, Share2 } from 'lucide-react';

export default function QRCodeModal({ isOpen, onClose, roomCode, roomName }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen || !roomCode) return null;

  const joinUrl = `${window.location.origin}/?room=${roomCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-zinc-950 rounded-3xl p-6 text-center border border-zinc-800 text-zinc-100 shadow-2xl">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-extrabold text-white mb-1">Scan to Join</h3>
        <p className="text-xs text-zinc-400 mb-4">{roomName || `Spark Group ${roomCode}`}</p>

        {/* QR Code */}
        <div className="p-4 bg-white rounded-2xl inline-block shadow-xl mb-4 border border-zinc-300">
          <QRCodeSVG
            value={joinUrl}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
          />
        </div>

        {/* Room Code */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-1">Room Join Code</span>
          <div className="font-mono text-2xl font-black text-white tracking-wider bg-zinc-900 py-2 rounded-xl border border-zinc-800">
            {roomCode}
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={copyToClipboard}
          className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-black" /> Link Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" /> Copy Share Link
            </>
          )}
        </button>

      </div>
    </div>
  );
}
