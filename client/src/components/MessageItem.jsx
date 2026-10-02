import React, { useState, useEffect } from 'react';
import { Flame, Eye, Smile, Sparkles } from 'lucide-react';

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '😂', '🎉', '🚀'];

export default function MessageItem({ message, currentUserId, onReaction, onBurnMessage }) {
  const [revealed, setRevealed] = useState(!message.burnAfterRead);
  const [burnTimer, setBurnTimer] = useState(10);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isSelf = message.sender?.id === currentUserId;
  const isSystem = message.type === 'system';

  useEffect(() => {
    if (message.burnAfterRead && revealed) {
      const interval = setInterval(() => {
        setBurnTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            if (onBurnMessage) onBurnMessage(message.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [message.burnAfterRead, revealed, message.id, onBurnMessage]);

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-white" /> {message.text}
        </span>
      </div>
    );
  }

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-2.5 my-3 group ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
      
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm shrink-0 select-none text-white">
        {message.sender?.avatar || '⚡'}
      </div>

      <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        
        {/* Username & Time */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-bold text-zinc-300">
            {message.sender?.name} {isSelf && <span className="text-[10px] text-zinc-400 font-normal">(You)</span>}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Bubble */}
        <div className={`relative p-3.5 rounded-2xl text-sm border shadow-md transition-all ${
          isSelf 
            ? 'bg-white text-black border-white rounded-tr-none font-medium' 
            : 'bg-zinc-900 text-zinc-100 border-zinc-800 rounded-tl-none'
        }`}>
          
          {/* Burn After Read Header */}
          {message.burnAfterRead && (
            <div className={`flex items-center gap-1.5 mb-2 pb-1.5 border-b text-[11px] font-mono font-semibold ${
              isSelf ? 'border-zinc-300 text-zinc-800' : 'border-zinc-800 text-zinc-400'
            }`}>
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>BURN MESSAGE {revealed && `(Purging in ${burnTimer}s)`}</span>
            </div>
          )}

          {/* Message Content */}
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs font-mono font-semibold flex items-center gap-2 hover:bg-zinc-800 transition-all"
            >
              <Eye className="w-4 h-4 text-white" /> Click to Reveal Message
            </button>
          ) : (
            <div>
              {/* Text */}
              {message.text && (
                <p className="whitespace-pre-wrap break-words leading-relaxed font-sans">
                  {message.text}
                </p>
              )}

              {/* Image Attachment */}
              {message.media && message.type === 'image' && (
                <div className="mt-2 rounded-xl overflow-hidden border border-zinc-700 shadow-md max-w-sm">
                  <img 
                    src={message.media} 
                    alt="Attachment" 
                    className="w-full max-h-64 object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => window.open(message.media, '_blank')}
                  />
                </div>
              )}

              {/* Audio Attachment */}
              {message.media && message.type === 'audio' && (
                <div className="mt-2 p-2 rounded-xl bg-black text-white border border-zinc-800 flex items-center gap-3">
                  <audio 
                    src={message.media} 
                    controls 
                    className="h-8 max-w-xs accent-white filter invert"
                  />
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-1 mt-2 pt-1">
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(message.reactions).map(([emoji, users]) => (
                  <button
                    key={emoji}
                    onClick={() => onReaction(message.id, emoji)}
                    className={`px-2 py-0.5 rounded-full border text-xs flex items-center gap-1 transition-colors ${
                      isSelf 
                        ? 'bg-zinc-100 border-zinc-300 text-black' 
                        : 'bg-zinc-950 border-zinc-800 text-white'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[10px] font-bold">{users.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Add Reaction */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded-full transition-all text-xs ${
                  isSelf ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                }`}
                title="Add Reaction"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-6 left-0 z-30 flex items-center gap-1 p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl">
                  {REACTION_EMOJIS.map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        onReaction(message.id, em);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1 hover:scale-125 transition-transform text-sm"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
