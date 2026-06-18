const express = require('express');
const router = express.Router();
const { Client, GatewayIntentBits } = require('discord.js');
const crypto = require('crypto');

const encryptionKey = process.env.ENCRYPTION_KEY;

// Encryption utilities
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Create Discord client
    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });

    // Attempt login
    client.once('ready', () => {
      const encryptedToken = encrypt(client.token);
      const userId = client.user.id;
      const username = client.user.username;

      req.session.token = encryptedToken;
      req.session.userId = userId;
      req.session.username = username;

      res.json({
        success: true,
        message: 'Logged in successfully',
        user: { id: userId, username }
      });

      client.destroy();
    });

    client.login(process.env.DISCORD_TOKEN).catch(() => {
      res.status(401).json({ error: 'Invalid Discord credentials' });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user guilds
router.get('/guilds', async (req, res) => {
  try {
    if (!req.session.token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = decrypt(req.session.token);
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('ready', async () => {
      const guilds = client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        icon: g.iconURL({ dynamic: true })
      }));

      res.json({ guilds });
      client.destroy();
    });

    client.login(token).catch(() => {
      res.status(401).json({ error: 'Session expired' });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;