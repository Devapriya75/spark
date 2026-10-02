const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'spark_data.json');

// In-Memory state for high speed
let data = {
  rooms: {},     // code -> { code, name, createdAt, expiresAt, durationHours, password, maxUsers, burnAfterRead, activeUsersCount }
  messages: {},  // roomCode -> [ { id, roomCode, sender, text, media, type, timestamp, burnAfterRead, reactions } ]
  users: {}      // socketId -> { socketId, roomCode, username, avatar, badgeColor }
};

// Load saved data if exists
function loadData() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      data.rooms = parsed.rooms || {};
      data.messages = parsed.messages || {};
      // Exclude volatile socket connections on reload
    }
  } catch (err) {
    console.error('Error loading DB file:', err);
  }
}

function saveData() {
  try {
    const toSave = {
      rooms: data.rooms,
      messages: data.messages
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving DB file:', err);
  }
}

// Generate unique 6-character room code (e.g., SPK-9X82)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SPK-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (data.rooms[code]) return generateRoomCode(); // ensure uniqueness
  return code;
}

// Room Operations
function createRoom({ name, durationHours = 48, password = null, maxUsers = 50, burnAfterRead = false }) {
  const code = generateRoomCode();
  const now = Date.now();
  // Duration in ms (max 48 hours)
  const safeDuration = Math.min(Math.max(parseFloat(durationHours) || 48, 0.1), 48);
  const expiresAt = now + Math.round(safeDuration * 60 * 60 * 1000);

  const room = {
    code,
    name: name || `Spark Group ${code}`,
    createdAt: now,
    expiresAt,
    durationHours: safeDuration,
    password: password ? String(password).trim() : null,
    maxUsers: parseInt(maxUsers, 10) || 50,
    burnAfterRead: Boolean(burnAfterRead),
    activeUsersCount: 0
  };

  data.rooms[code] = room;
  data.messages[code] = [];
  saveData();
  return room;
}

function getRoom(code) {
  if (!code) return null;
  const cleanCode = code.toUpperCase().trim();
  const room = data.rooms[cleanCode];
  if (!room) return null;

  // Check if expired
  if (Date.now() >= room.expiresAt) {
    deleteRoom(cleanCode);
    return null;
  }

  return room;
}

function deleteRoom(code) {
  const cleanCode = code.toUpperCase().trim();
  delete data.rooms[cleanCode];
  delete data.messages[cleanCode];

  // Remove users associated with room
  Object.keys(data.users).forEach(socketId => {
    if (data.users[socketId]?.roomCode === cleanCode) {
      delete data.users[socketId];
    }
  });

  saveData();
  console.log(`[PURGED] Room ${cleanCode} and all its messages have been destroyed.`);
}

// Message Operations
function addMessage(roomCode, { sender, text, media, type = 'text', burnAfterRead = false }) {
  const cleanCode = roomCode.toUpperCase().trim();
  if (!data.rooms[cleanCode]) return null;

  const message = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    roomCode: cleanCode,
    sender, // { id, name, avatar, badgeColor }
    text: text || '',
    media: media || null, // base64 or url
    type, // 'text', 'image', 'audio', 'system'
    timestamp: Date.now(),
    burnAfterRead: Boolean(burnAfterRead),
    reactions: {} // emoji -> array of usernames
  };

  if (!data.messages[cleanCode]) {
    data.messages[cleanCode] = [];
  }

  data.messages[cleanCode].push(message);
  saveData();
  return message;
}

function getMessages(roomCode) {
  const cleanCode = roomCode.toUpperCase().trim();
  return data.messages[cleanCode] || [];
}

function addReaction(roomCode, messageId, emoji, username) {
  const cleanCode = roomCode.toUpperCase().trim();
  const messages = data.messages[cleanCode] || [];
  const msg = messages.find(m => m.id === messageId);
  if (!msg) return null;

  if (!msg.reactions) msg.reactions = {};
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

  const userIdx = msg.reactions[emoji].indexOf(username);
  if (userIdx > -1) {
    msg.reactions[emoji].splice(userIdx, 1);
    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
  } else {
    msg.reactions[emoji].push(username);
  }

  saveData();
  return msg;
}

function deleteMessage(roomCode, messageId) {
  const cleanCode = roomCode.toUpperCase().trim();
  if (!data.messages[cleanCode]) return false;

  data.messages[cleanCode] = data.messages[cleanCode].filter(m => m.id !== messageId);
  saveData();
  return true;
}

// Active User Operations
function registerUser(socketId, roomCode, { username, avatar, badgeColor }) {
  const cleanCode = roomCode.toUpperCase().trim();
  const user = {
    socketId,
    roomCode: cleanCode,
    username: username || 'Anonymous Spark',
    avatar: avatar || '⚡',
    badgeColor: badgeColor || '#06b6d4',
    joinedAt: Date.now()
  };
  data.users[socketId] = user;
  return user;
}

function removeUser(socketId) {
  const user = data.users[socketId];
  if (user) {
    delete data.users[socketId];
  }
  return user;
}

function getRoomUsers(roomCode) {
  const cleanCode = roomCode.toUpperCase().trim();
  return Object.values(data.users).filter(u => u.roomCode === cleanCode);
}

// Background Expired Rooms Cleanup Engine
function startCleanupEngine(onRoomExpiredCallback) {
  setInterval(() => {
    const now = Date.now();
    const roomCodes = Object.keys(data.rooms);

    roomCodes.forEach(code => {
      const room = data.rooms[code];
      if (room && now >= room.expiresAt) {
        console.log(`[EXPIRED] Room ${code} time reached 0:0:0. Purging data.`);
        if (onRoomExpiredCallback) {
          onRoomExpiredCallback(code);
        }
        deleteRoom(code);
      }
    });
  }, 10000); // Check every 10 seconds
}

// Initialize
loadData();

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  addMessage,
  getMessages,
  addReaction,
  deleteMessage,
  registerUser,
  removeUser,
  getRoomUsers,
  startCleanupEngine
};
