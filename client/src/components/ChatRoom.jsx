import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Image, Mic, Square, QrCode, Copy, Check, Users, Download, 
  Flame, ShieldCheck, X, MessageSquare
} from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import MessageItem from './MessageItem';
import QRCodeModal from './QRCodeModal';

export default function ChatRoom({ 
  room, 
  messages, 
  users, 
  currentUser, 
  typingUsers,
  onSendMessage, 
  onSendReaction, 
  onBurnMessage,
  onTypingStart, 
  onTypingStop, 
  onExpire,
  onLeave 
}) {
  const [inputText, setInputText] = useState('');
  const [burnNextMessage, setBurnNextMessage] = useState(room?.burnAfterRead || false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showUsersDrawer, setShowUsersDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const copyJoinLink = () => {
    const url = `${window.location.origin}/?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage({
      text: inputText.trim(),
      burnAfterRead: burnNextMessage
    });

    setInputText('');
    onTypingStop();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Image size limit is 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onSendMessage({
        text: '',
        media: event.target.result,
        type: 'image',
        burnAfterRead: burnNextMessage
      });
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onSendMessage({
            text: '🎤 Voice Note',
            media: reader.result,
            type: 'audio',
            burnAfterRead: burnNextMessage
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Audio recording error:", err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const exportChat = () => {
    const exportData = {
      roomCode: room.code,
      roomName: room.name,
      createdAt: new Date(room.createdAt).toISOString(),
      expiresAt: new Date(room.expiresAt).toISOString(),
      messages: messages.map(m => ({
        sender: m.sender?.name,
        time: new Date(m.timestamp).toISOString(),
        text: m.text
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SparkChat_${room.code}_Transcript.json`;
    a.click();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] max-w-7xl mx-auto px-2 sm:px-4 py-2">
      
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 mb-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-lg border border-zinc-800">
        
        {/* Left info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-black font-mono font-black text-sm flex items-center justify-center">
            {room.code.slice(-3)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base sm:text-lg text-white">
                {room.name}
              </h1>
              <span className="font-mono text-xs font-bold text-black bg-white px-2 py-0.5 rounded">
                {room.code}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5 font-mono">
              <button 
                onClick={copyJoinLink}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Share Link'}
              </button>

              <span>•</span>

              <button 
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" /> Mobile QR
              </button>

              <span>•</span>

              <button 
                onClick={() => setShowUsersDrawer(!showUsersDrawer)}
                className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors"
              >
                <Users className="w-3.5 h-3.5" /> {users.length} Active
              </button>
            </div>
          </div>
        </div>

        {/* Expiry Timer */}
        <div className="w-full md:w-auto min-w-[280px]">
          <CountdownTimer 
            expiresAt={room.expiresAt} 
            createdAt={room.createdAt} 
            onExpire={onExpire} 
          />
        </div>

      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-3 overflow-hidden relative">
        
        {/* Messages */}
        <div className="flex-1 glass-panel rounded-2xl p-4 flex flex-col justify-between overflow-hidden border border-zinc-800">
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            
            {/* Notice */}
            <div className="p-3 mb-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>EPHEMERAL ROOM • Auto-destructs after lifespan expiration.</span>
              </div>
              <button 
                onClick={exportChat}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors"
              >
                <Download className="w-3 h-3" /> Export
              </button>
            </div>

            {messages.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-600">
                <MessageSquare className="w-10 h-10 text-zinc-800 mb-2" />
                <p className="text-xs font-mono font-bold uppercase tracking-wider">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUser?.id}
                  onReaction={onSendReaction}
                  onBurnMessage={onBurnMessage}
                />
              ))
            )}

            {/* Typing */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-400 font-mono animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                <span>
                  {typingUsers.map(u => u.username).join(', ')} typing...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-2">
            
            <div className="flex items-center justify-between text-xs px-1 font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-zinc-400 hover:text-white">
                <Flame className={`w-3.5 h-3.5 ${burnNextMessage ? 'text-white animate-pulse' : 'text-zinc-600'}`} />
                <span className={burnNextMessage ? 'text-white font-bold' : ''}>
                  Burn next message
                </span>
                <input
                  type="checkbox"
                  checked={burnNextMessage}
                  onChange={(e) => setBurnNextMessage(e.target.checked)}
                  className="w-3.5 h-3.5 accent-white rounded cursor-pointer"
                />
              </label>

              {isRecording && (
                <span className="text-white font-mono font-bold animate-pulse">
                  🔴 Recording: {recordingTime}s
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              
              {/* Image Upload */}
              <label className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors">
                <Image className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>

              {/* Mic */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-3 rounded-xl border transition-all ${
                  isRecording 
                    ? 'bg-white text-black border-white animate-pulse' 
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                }`}
                title={isRecording ? "Stop & Send" : "Record Voice Note"}
              >
                {isRecording ? <Square className="w-4 h-4 fill-black" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value) onTypingStart();
                  else onTypingStop();
                }}
                placeholder={isRecording ? "Recording voice note..." : "Type message..."}
                disabled={isRecording}
                className="flex-1 px-4 py-3 rounded-xl glass-input text-sm placeholder-zinc-600"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isRecording}
                className="p-3 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:opacity-30 transition-all font-bold"
              >
                <Send className="w-4 h-4" />
              </button>

            </div>

          </form>

        </div>

        {/* Members Drawer */}
        {showUsersDrawer && (
          <div className="w-64 bg-zinc-950 rounded-2xl p-4 flex flex-col border border-zinc-800 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h3 className="font-extrabold text-xs uppercase font-mono tracking-wider text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-white" /> Members ({users.length})
              </h3>
              <button 
                onClick={() => setShowUsersDrawer(false)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {users.map((u) => (
                <div key={u.socketId} className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center text-xs">
                    {u.avatar || '⚡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate">
                      {u.username} {u.socketId === currentUser?.id && <span className="text-[10px] text-zinc-400 font-normal">(You)</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 mt-2">
              <button
                onClick={onLeave}
                className="w-full py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 font-mono font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Leave Group
              </button>
            </div>
          </div>
        )}

      </div>

      <QRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        roomCode={room.code}
        roomName={room.name}
      />

    </div>
  );
}
