const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const trimmedUsername = username ? username.trim() : '';

        // Find user by username (case-insensitive and trimmed)
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password (plain text for now — same as current hardcoded approach)
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Return user data (without password)
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name
        });
    } catch (err) {
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

// GET all users (admin only in future)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    }
});


module.exports = router;
