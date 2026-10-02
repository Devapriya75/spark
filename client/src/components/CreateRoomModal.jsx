import React, { useState } from 'react';
import { X, Clock, Lock, Users, Flame, User, ArrowRight } from 'lucide-react';

const AVATARS = ['⚡', '🔥', '🚀', '🔮', '👾', '🦊', '🐱', '🐼', '🤖', '👑', '💎', '🛡️'];

export default function CreateRoomModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [durationHours, setDurationHours] = useState('48');
  const [password, setPassword] = useState('');
  const [maxUsers, setMaxUsers] = useState(50);
  const [burnAfterRead, setBurnAfterRead] = useState(false);
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    await onCreate({
      name: name.trim() || undefined,
      durationHours: parseFloat(durationHours) || 48,
      password: password.trim() || undefined,
      maxUsers: parseInt(maxUsers, 10) || 50,
      burnAfterRead,
      user: {
        name: username.trim(),
        avatar,
        badgeColor: '#ffffff'
      }
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-800 text-zinc-100 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-black">
            ⚡
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide">Create Ephemeral Group</h2>
            <p className="text-xs text-zinc-400">Set room parameters & self-destruct timer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Group Name */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Group Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Chat, Event Group..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm placeholder-zinc-600"
            />
          </div>

          {/* Expiration Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-white" /> Room Lifespan
              </label>
              <span className="text-xs font-mono font-bold text-white bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                {durationHours} Hours Max
              </span>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '1h', value: '1' },
                { label: '6h', value: '6' },
                { label: '12h', value: '12' },
                { label: '24h', value: '24' },
                { label: '48h', value: '48' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationHours(opt.value)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    durationHours === opt.value
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Password & Capacity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" /> Room Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Optional pass..."
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-zinc-600"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" /> Capacity Limit
              </label>
              <select
                value={maxUsers}
                onChange={(e) => setMaxUsers(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-input text-sm bg-zinc-900 text-white"
              >
                <option value={10}>Max 10 Users</option>
                <option value={25}>Max 25 Users</option>
                <option value={50}>Max 50 Users</option>
                <option value={100}>Max 100 Users</option>
              </select>
            </div>
          </div>

          {/* Burn After Reading Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-zinc-300" />
              <div>
                <p className="text-xs font-bold text-white">Burn Messages Mode</p>
                <p className="text-[11px] text-zinc-400">Purge messages 10s after reading</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={burnAfterRead}
              onChange={(e) => setBurnAfterRead(e.target.checked)}
              className="w-4 h-4 accent-white cursor-pointer rounded"
            />
          </div>

          {/* User Profile */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5 text-white" /> Your Nickname
            </label>

            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm placeholder-zinc-600 mb-3"
            />

            {/* Avatar Selection */}
            <div>
              <span className="block text-[11px] text-zinc-400 mb-1.5 font-medium">Avatar:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 text-base rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      avatar === av ? 'bg-white text-black font-bold scale-110 shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-sm uppercase tracking-wider hover:bg-zinc-200 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Creating Group...' : 'Launch Ephemeral Group'}
          </button>
        </form>

      </div>
    </div>
  );
}
