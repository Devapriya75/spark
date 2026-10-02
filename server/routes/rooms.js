const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/rooms - Create a new room
router.post('/rooms', (req, res) => {
  try {
    const { name, durationHours, password, maxUsers, burnAfterRead } = req.body;
    
    // Validate duration (max 48 hours)
    const duration = parseFloat(durationHours) || 48;
    if (duration <= 0 || duration > 48) {
      return res.status(400).json({ error: 'Duration must be between 0.1 and 48 hours.' });
    }

    const room = db.createRoom({
      name,
      durationHours: duration,
      password,
      maxUsers,
      burnAfterRead
    });

    return res.json({
      success: true,
      room: {
        code: room.code,
        name: room.name,
        expiresAt: room.expiresAt,
        durationHours: room.durationHours,
        hasPassword: Boolean(room.password),
        burnAfterRead: room.burnAfterRead,
        maxUsers: room.maxUsers
      }
    });
  } catch (err) {
    console.error('Error creating room:', err);
    return res.status(500).json({ error: 'Server error while creating room.' });
  }
});

// GET /api/rooms/:code - Fetch room metadata
router.get('/rooms/:code', (req, res) => {
  try {
    const roomCode = req.params.code;
    const room = db.getRoom(roomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found or has expired and been deleted.' });
    }

    const activeUsers = db.getRoomUsers(room.code);

    return res.json({
      code: room.code,
      name: room.name,
      expiresAt: room.expiresAt,
      createdAt: room.createdAt,
      durationHours: room.durationHours,
      hasPassword: Boolean(room.password),
      burnAfterRead: room.burnAfterRead,
      maxUsers: room.maxUsers,
      activeUsersCount: activeUsers.length
    });
  } catch (err) {
    console.error('Error getting room:', err);
    return res.status(500).json({ error: 'Server error retrieving room.' });
  }
});

// POST /api/rooms/:code/verify - Verify room password
router.post('/rooms/:code/verify', (req, res) => {
  try {
    const roomCode = req.params.code;
    const { password } = req.body;
    const room = db.getRoom(roomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found or expired.' });
    }

    if (room.password) {
      if (String(password).trim() !== String(room.password).trim()) {
        return res.status(401).json({ error: 'Incorrect room password.' });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error verifying room:', err);
    return res.status(500).json({ error: 'Server error verifying password.' });
  }
});

module.exports = router;
