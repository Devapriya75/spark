const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const roomRoutes = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e7 // 10MB limit for image attachments & audio notes
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// REST Routes
app.use('/api', roomRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`[SOCKET CONNECTED] Socket ID: ${socket.id}`);

  // Join Room
  socket.on('join-room', ({ roomCode, password, user }) => {
    const room = db.getRoom(roomCode);
    if (!room) {
      return socket.emit('error-msg', 'Room not found or expired.');
    }

    // Verify Password if needed
    if (room.password && String(password).trim() !== String(room.password).trim()) {
      return socket.emit('error-msg', 'Incorrect room password.');
    }

    // Check Max Capacity
    const currentUsers = db.getRoomUsers(room.code);
    if (currentUsers.length >= room.maxUsers) {
      return socket.emit('error-msg', 'Room is currently at full capacity.');
    }

    const cleanCode = room.code;
    socket.join(cleanCode);

    // Register User
    const regUser = db.registerUser(socket.id, cleanCode, {
      username: user?.name || 'Spark User',
      avatar: user?.avatar || '⚡',
      badgeColor: user?.badgeColor || '#06b6d4'
    });

    console.log(`[USER JOINED] ${regUser.username} (${socket.id}) joined room ${cleanCode}`);

    // Send room history & active user list to the joining user
    const messages = db.getMessages(cleanCode);
    const updatedUsers = db.getRoomUsers(cleanCode);

    socket.emit('room-joined', {
      room: {
        code: room.code,
        name: room.name,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        durationHours: room.durationHours,
        burnAfterRead: room.burnAfterRead,
        maxUsers: room.maxUsers
      },
      messages,
      users: updatedUsers
    });

    // Notify room of new user join
    io.to(cleanCode).emit('users-updated', updatedUsers);
    io.to(cleanCode).emit('system-message', {
      id: 'sys_' + Date.now(),
      type: 'system',
      text: `${regUser.username} joined the chat`,
      timestamp: Date.now()
    });
  });

  // Send Message
  socket.on('send-message', ({ roomCode, text, media, type, burnAfterRead }) => {
    const room = db.getRoom(roomCode);
    if (!room) {
      return socket.emit('error-msg', 'Room is expired.');
    }

    const currentUser = db.getRoomUsers(roomCode).find(u => u.socketId === socket.id);
    if (!currentUser) {
      return socket.emit('error-msg', 'You are not active in this room.');
    }

    const msg = db.addMessage(roomCode, {
      sender: {
        id: socket.id,
        name: currentUser.username,
        avatar: currentUser.avatar,
        badgeColor: currentUser.badgeColor
      },
      text,
      media,
      type: type || (media ? 'image' : 'text'),
      burnAfterRead: burnAfterRead !== undefined ? burnAfterRead : room.burnAfterRead
    });

    if (msg) {
      io.to(room.code).emit('new-message', msg);
    }
  });

  // Typing Indicators
  socket.on('typing-start', ({ roomCode }) => {
    const user = db.getRoomUsers(roomCode).find(u => u.socketId === socket.id);
    if (user) {
      socket.to(roomCode).emit('user-typing', { socketId: socket.id, username: user.username });
    }
  });

  socket.on('typing-stop', ({ roomCode }) => {
    socket.to(roomCode).emit('user-stopped-typing', { socketId: socket.id });
  });

  // Emoji Reactions
  socket.on('add-reaction', ({ roomCode, messageId, emoji }) => {
    const user = db.getRoomUsers(roomCode).find(u => u.socketId === socket.id);
    if (!user) return;

    const updatedMsg = db.addReaction(roomCode, messageId, emoji, user.username);
    if (updatedMsg) {
      io.to(roomCode).emit('message-reaction-updated', { messageId, reactions: updatedMsg.reactions });
    }
  });

  // Burn message request
  socket.on('burn-message', ({ roomCode, messageId }) => {
    const success = db.deleteMessage(roomCode, messageId);
    if (success) {
      io.to(roomCode).emit('message-burned', { messageId });
    }
  });

  // Disconnect / Leave
  socket.on('disconnect', () => {
    const removedUser = db.removeUser(socket.id);
    if (removedUser) {
      const roomCode = removedUser.roomCode;
      console.log(`[USER LEFT] ${removedUser.username} left room ${roomCode}`);
      
      const updatedUsers = db.getRoomUsers(roomCode);
      io.to(roomCode).emit('users-updated', updatedUsers);
      io.to(roomCode).emit('system-message', {
        id: 'sys_' + Date.now(),
        type: 'system',
        text: `${removedUser.username} left the chat`,
        timestamp: Date.now()
      });
    }
  });
});

// Start Expiration Cleanup Timer
db.startCleanupEngine((expiredRoomCode) => {
  // Emit room-expired to all sockets in that room
  io.to(expiredRoomCode).emit('room-expired', {
    message: 'This 48-hour temporary room has reached its lifespan and all messages have been permanently purged.'
  });
  // Disconnect room sockets
  io.in(expiredRoomCode).socketsLeave(expiredRoomCode);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`⚡ SparkChat Server running on http://localhost:${PORT}`);
});
