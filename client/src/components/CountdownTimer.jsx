import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Flame } from 'lucide-react';

export default function CountdownTimer({ expiresAt, createdAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
  const [progressPercent, setProgressPercent] = useState(100);

  useEffect(() => {
    if (!expiresAt) return;

    const totalDuration = expiresAt - (createdAt || Date.now());

    const updateTimer = () => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        setProgressPercent(0);
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalMs: diff });

      if (totalDuration > 0) {
        const pct = Math.max(0, Math.min(100, (diff / totalDuration) * 100));
        setProgressPercent(pct);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, createdAt, onExpire]);

  const isUrgent = timeLeft.totalMs < 10 * 60 * 1000;
  const isCritical = timeLeft.totalMs < 2 * 60 * 1000;

  return (
    <div className={`rounded-xl border transition-all p-3 ${
      isCritical 
        ? 'bg-zinc-950 border-white shadow-lg animate-pulse' 
        : isUrgent 
          ? 'bg-zinc-900 border-zinc-500' 
          : 'bg-zinc-900/80 border-zinc-800'
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            {isCritical ? 'CRITICAL EXPIRATION' : isUrgent ? 'EXPIRING SOON' : 'ROOM LIFESPAN'}
          </span>
        </div>

        {/* Formatted Numbers */}
        <div className="flex items-center gap-1 font-mono font-bold text-xs tracking-tight">
          <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-white">
            {String(timeLeft.hours).padStart(2, '0')}h
          </span>
          <span className="text-zinc-600">:</span>
          <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-white">
            {String(timeLeft.minutes).padStart(2, '0')}m
          </span>
          <span className="text-zinc-600">:</span>
          <span className="bg-white text-black px-2 py-0.5 rounded font-black border border-white">
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden border border-zinc-800">
        <div 
          className="h-full bg-white transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
