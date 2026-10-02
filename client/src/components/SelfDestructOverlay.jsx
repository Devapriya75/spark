import React, { useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SelfDestructOverlay({ reason, onHome }) {
  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#a1a1aa', '#52525b']
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-glitch">
      <div className="max-w-md w-full bg-zinc-950 rounded-3xl p-8 text-center border-2 border-white shadow-2xl">
        
        <div className="px-4 py-2 bg-white text-black font-mono font-black text-2xl tracking-tighter rounded-xl inline-block mb-6">
          spark.
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase font-mono">
          ROOM DUMPED & PURGED
        </h2>
        
        <p className="text-xs text-zinc-400 font-mono font-semibold uppercase tracking-widest mb-4 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-white" /> 48h Lifespan Reached
        </p>

        <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-6 bg-zinc-900 p-4 rounded-2xl border border-zinc-800">
          {reason || "This temporary chat group has reached its lifespan. All messages, media, and room data have been permanently dumped and erased."}
        </p>

        <button
          onClick={onHome}
          className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" /> Return to spark.
        </button>

      </div>
    </div>
  );
}
