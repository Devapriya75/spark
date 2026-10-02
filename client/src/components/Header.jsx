import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function Header({ soundEnabled, setSoundEnabled, roomCode, onLeaveRoom }) {
  return (
    <header className="w-full border-b border-zinc-900 bg-black/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Logo Spelled Out */}
        <div 
          onClick={onLeaveRoom}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="px-2.5 py-1 bg-white text-black font-mono font-black text-xl tracking-tighter rounded-lg group-hover:bg-zinc-200 transition-colors">
            spark.
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-zinc-500 uppercase tracking-widest font-semibold">
            48h ephemeral
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {roomCode && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>ROOM: {roomCode}</span>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
            title={soundEnabled ? "Mute sounds" : "Enable sounds"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-white" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-600" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
