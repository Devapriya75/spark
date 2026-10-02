import React, { useState } from 'react';
import { Lock, X, User, ArrowRight, ShieldAlert } from 'lucide-react';

const AVATARS = ['⚡', '🔥', '🚀', '🔮', '👾', '🦊', '🐱', '🐼', '🤖', '👑', '💎', '🛡️'];

export default function JoinRoomModal({ isOpen, onClose, roomInfo, onJoin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('⚡');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !roomInfo) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setErrorMsg('');
    setLoading(true);

    try {
      await onJoin({
        roomCode: roomInfo.code,
        password: password.trim() || undefined,
        user: {
          name: username.trim(),
          avatar,
          badgeColor: '#ffffff'
        }
      });
    } catch (err) {
      setErrorMsg(err.message || 'Could not join room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-950 rounded-3xl p-6 sm:p-8 border border-zinc-800 text-zinc-100 shadow-2xl">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <span className="font-mono text-xs font-bold text-white bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 inline-block mb-2">
            JOIN ROOM: {roomInfo.code}
          </span>
          <h2 className="text-xl font-black text-white">{roomInfo.name}</h2>
          <p className="text-xs text-zinc-400 mt-1">Set display nickname & enter access code</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {roomInfo.hasPassword && (
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5 text-white" /> Room Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-xl glass-input text-sm placeholder-zinc-600"
              />
            </div>
          )}

          {/* Nickname */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
              <User className="w-3.5 h-3.5 text-white" /> Display Nickname
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full px-4 py-3 rounded-xl glass-input text-sm placeholder-zinc-600"
            />
          </div>

          {/* Avatar Choice */}
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

          {/* Join Button */}
          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all mt-2"
          >
            {loading ? 'Joining...' : <>Enter Group Chat <ArrowRight className="w-4 h-4" /></>}
          </button>

        </form>

      </div>
    </div>
  );
}
