import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import CreateRoomModal from './components/CreateRoomModal';
import JoinRoomModal from './components/JoinRoomModal';
import ChatRoom from './components/ChatRoom';
import SelfDestructOverlay from './components/SelfDestructOverlay';
import { getSocket } from './services/socket';
import { PlusCircle, LogIn, ShieldAlert, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://spark-riw4.onrender.com/api';

export default function App() {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingJoinRoomInfo, setPendingJoinRoomInfo] = useState(null);
  const [isSelfDestructed, setIsSelfDestructed] = useState(false);
  const [selfDestructReason, setSelfDestructReason] = useState('');

  // Global settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingCode, setLoadingCode] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const socketRef = useRef(null);

  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'join') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'message') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    if (code) {
      setRoomCodeInput(code.toUpperCase());
      handleCodeSearch(code.toUpperCase());
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('room-joined', ({ room, messages, users }) => {
      setActiveRoom(room);
      setMessages(messages || []);
      setUsers(users || []);
      setShowJoinModal(false);
      setShowCreateModal(false);
      playSound('join');

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#ffffff', '#a1a1aa']
      });
    });

    socket.on('users-updated', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on('new-message', (msg) => {
      setMessages((prev) => [...prev, msg]);
      playSound('message');
    });

    socket.on('system-message', (sysMsg) => {
      setMessages((prev) => [...prev, sysMsg]);
    });

    socket.on('message-reaction-updated', ({ messageId, reactions }) => {
      setMessages((prev) => 
        prev.map(m => m.id === messageId ? { ...m, reactions } : m)
      );
    });

    socket.on('message-burned', ({ messageId }) => {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    socket.on('user-typing', ({ socketId, username }) => {
      setTypingUsers((prev) => {
        if (prev.some(u => u.socketId === socketId)) return prev;
        return [...prev, { socketId, username }];
      });
    });

    socket.on('user-stopped-typing', ({ socketId }) => {
      setTypingUsers((prev) => prev.filter(u => u.socketId !== socketId));
    });

    socket.on('room-expired', ({ message }) => {
      setIsSelfDestructed(true);
      setSelfDestructReason(message);
      setActiveRoom(null);
    });

    socket.on('error-msg', (msg) => {
      alert(msg);
    });

    return () => {
      socket.off('room-joined');
      socket.off('users-updated');
      socket.off('new-message');
      socket.off('system-message');
      socket.off('message-reaction-updated');
      socket.off('message-burned');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('room-expired');
      socket.off('error-msg');
    };
  }, []);

  const handleCodeSearch = async (codeToSearch) => {
    const code = (codeToSearch || roomCodeInput).trim().toUpperCase();
    if (!code) return;

    setGlobalError('');
    setLoadingCode(true);

    try {
      const res = await fetch(`${API_URL}/rooms/${code}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Room not found or expired.');
      }

      setPendingJoinRoomInfo(data);
      setShowJoinModal(true);
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleCreateRoom = async ({ name, durationHours, password, maxUsers, burnAfterRead, user }) => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, durationHours, password, maxUsers, burnAfterRead })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not create room.');
      }

      const socket = socketRef.current || getSocket();
      if (!socket.connected) socket.connect();

      setCurrentUser({ id: socket.id, name: user.name, avatar: user.avatar, badgeColor: user.badgeColor });

      socket.emit('join-room', {
        roomCode: data.room.code,
        password,
        user
      });

    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinRoom = async ({ roomCode, password, user }) => {
    const socket = socketRef.current || getSocket();
    if (!socket.connected) socket.connect();

    setCurrentUser({ id: socket.id, name: user.name, avatar: user.avatar, badgeColor: user.badgeColor });

    socket.emit('join-room', {
      roomCode,
      password,
      user
    });
  };

  const handleSendMessage = ({ text, media, type, burnAfterRead }) => {
    if (!activeRoom) return;
    socketRef.current?.emit('send-message', {
      roomCode: activeRoom.code,
      text,
      media,
      type,
      burnAfterRead
    });
  };

  const handleSendReaction = (messageId, emoji) => {
    if (!activeRoom) return;
    socketRef.current?.emit('add-reaction', {
      roomCode: activeRoom.code,
      messageId,
      emoji
    });
  };

  const handleBurnMessage = (messageId) => {
    if (!activeRoom) return;
    socketRef.current?.emit('burn-message', {
      roomCode: activeRoom.code,
      messageId
    });
  };

  const handleTypingStart = () => {
    if (!activeRoom) return;
    socketRef.current?.emit('typing-start', { roomCode: activeRoom.code });
  };

  const handleTypingStop = () => {
    if (!activeRoom) return;
    socketRef.current?.emit('typing-stop', { roomCode: activeRoom.code });
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setActiveRoom(null);
    setMessages([]);
    setUsers([]);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white">
      
      <Header
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        roomCode={activeRoom?.code}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Main Container */}
      {isSelfDestructed ? (
        <SelfDestructOverlay
          reason={selfDestructReason}
          onHome={() => {
            setIsSelfDestructed(false);
            handleLeaveRoom();
          }}
        />
      ) : activeRoom ? (
        <ChatRoom
          room={activeRoom}
          messages={messages}
          users={users}
          currentUser={currentUser}
          typingUsers={typingUsers}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
          onBurnMessage={handleBurnMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          onExpire={() => {
            setIsSelfDestructed(true);
            setSelfDestructReason("Room lifespan reached 0:0:0. All chat data permanently purged.");
          }}
          onLeave={handleLeaveRoom}
        />
      ) : (
        /* Landing Page */
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative">
          
          <div className="max-w-4xl w-full text-center space-y-10">
            
            {/* Minimal Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-widest text-zinc-300">
                48h SELF-DESTRUCT CHAT GROUPS
              </span>
            </div>

            {/* Title: CREATE. CHAT. DUMP. */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-white font-mono uppercase">
                CREATE. CHAT. DUMP.
              </h1>
              <p className="text-sm sm:text-lg text-zinc-400 max-w-xl mx-auto font-mono leading-relaxed pt-2">
                Temporary group chat joining by code. Self-destructs and purges all data in 48 hours.
              </p>
            </div>

            {/* Action Card */}
            <div className="max-w-md mx-auto bg-zinc-950 p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
              
              {/* Code Search */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch()}
                  placeholder="Enter Code (e.g. SPK-9X82)..."
                  className="w-full px-4 py-3.5 rounded-2xl glass-input text-xs font-mono font-bold tracking-wider uppercase placeholder-zinc-600"
                />

                <button
                  onClick={() => handleCodeSearch()}
                  disabled={loadingCode || !roomCodeInput.trim()}
                  className="py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" /> JOIN
                </button>
              </div>

              {globalError && (
                <p className="text-xs text-zinc-400 font-mono flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-white" /> {globalError}
                </p>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono font-bold text-zinc-600 uppercase">OR</span>
                <div className="flex-grow border-t border-zinc-800"></div>
              </div>

              {/* Create Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full py-4 rounded-2xl bg-white text-black font-mono font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-[0.99] transition-all shadow-lg"
              >
                <PlusCircle className="w-4 h-4" /> CREATE ROOM
              </button>

            </div>

            {/* 3 Step Concept Cards: CREATE. CHAT. DUMP. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left max-w-3xl mx-auto">
              
              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2 hover:border-zinc-700 transition-colors">
                <span className="font-mono text-2xl font-black text-white">01.</span>
                <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">CREATE.</h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Generate a 6-character room code. Set room duration up to 48 hours.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2 hover:border-zinc-700 transition-colors">
                <span className="font-mono text-2xl font-black text-white">02.</span>
                <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">CHAT.</h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Real-time WebSockets text, voice notes, media, and burn messages.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2 hover:border-zinc-700 transition-colors">
                <span className="font-mono text-2xl font-black text-white">03.</span>
                <h3 className="font-mono font-black text-base text-white uppercase tracking-wider">DUMP.</h3>
                <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                  Timer hits 0:0:0. Server permanently erases all rooms & chat history.
                </p>
              </div>

            </div>

          </div>

        </main>
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateRoom}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        roomInfo={pendingJoinRoomInfo}
        onJoin={handleJoinRoom}
      />

    </div>
  );
}
