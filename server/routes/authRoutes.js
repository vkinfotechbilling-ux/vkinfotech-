const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(`🔹 Login Attempt: Username="${username}", Origin="${req.get('Origin')}"`);

        if (!username || !password) {
            console.warn('❌ Login Failed: Missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const trimmedUsername = username.trim();
        const trimmedPassword = password.trim(); // Trim password as per requirements

        // Find user by username (case-insensitive and trimmed)
        const user = await User.findOne({
            username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') }
        });

        if (!user) {
            console.warn(`❌ Login Failed: User not found for username "${trimmedUsername}"`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        console.log(`✅ User Found: ${user.username} (Role: ${user.role})`);
        // console.log(`   DB Password: "${user.password}", Input Password: "${trimmedPassword}"`); // REMOVED FOR SECURITY

        // Check password (plain text)
        // TODO: Upgrade to bcrypt if requested, currently using plain text matching
        if (user.password !== trimmedPassword) {
            console.warn(`❌ Login Failed: Password mismatch for user "${user.username}"`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        console.log('✅ Login Successful');

        // Return user data (without password)
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name
        });
    } catch (err) {
        console.error('❌ Login Error:', err);
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
