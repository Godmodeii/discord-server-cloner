const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { dbGet, dbRun, dbAll } = require('../config/database');
const usersRouter = require('./users');
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const encryptionKey = process.env.ENCRYPTION_KEY;
const verifyToken = usersRouter.verifyToken;

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

// Store Discord credentials
router.post('/store-creds', verifyToken, async (req, res) => {
  try {
    const { discordToken, discordUserId, discordUsername } = req.body;

    if (!discordToken) {
      return res.status(400).json({ error: 'Discord token required' });
    }

    // Encrypt token
    const encryptedToken = encrypt(discordToken);
    const credsId = uuidv4();

    // Delete existing creds if any
    await dbRun('DELETE FROM discord_creds WHERE user_id = ?', [req.user.id]);

    // Store new creds
    await dbRun(
      'INSERT INTO discord_creds (id, user_id, encrypted_token, discord_user_id, discord_username) VALUES (?, ?, ?, ?, ?)',
      [credsId, req.user.id, encryptedToken, discordUserId, discordUsername]
    );

    res.json({ success: true, message: 'Discord credentials stored safely' });
  } catch (error) {
    console.error('Store creds error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's stored Discord credentials (metadata only, not token)
router.get('/my-creds', verifyToken, async (req, res) => {
  try {
    const creds = await dbGet(
      'SELECT id, discord_user_id, discord_username FROM discord_creds WHERE user_id = ?',
      [req.user.id]
    );

    if (!creds) {
      return res.json({ creds: null });
    }

    res.json({ creds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's guilds
router.get('/guilds', verifyToken, async (req, res) => {
  try {
    const creds = await dbGet(
      'SELECT encrypted_token FROM discord_creds WHERE user_id = ?',
      [req.user.id]
    );

    if (!creds) {
      return res.status(400).json({ error: 'Discord credentials not found. Please add your Discord token first.' });
    }

    const token = decrypt(creds.encrypted_token);
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.once('ready', async () => {
      try {
        const guilds = client.guilds.cache.map(g => ({
          id: g.id,
          name: g.name,
          icon: g.iconURL({ dynamic: true })
        }));

        res.json({ guilds });
        client.destroy();
      } catch (error) {
        res.status(500).json({ error: error.message });
        client.destroy();
      }
    });

    client.login(token).catch((error) => {
      res.status(401).json({ error: 'Failed to authenticate with Discord. Token may be invalid.' });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start clone job
router.post('/clone-job', verifyToken, async (req, res) => {
  try {
    const { sourceGuildId, destinationGuildId } = req.body;

    if (!sourceGuildId || !destinationGuildId) {
      return res.status(400).json({ error: 'Source and destination guild IDs required' });
    }

    if (sourceGuildId === destinationGuildId) {
      return res.status(400).json({ error: 'Source and destination must be different' });
    }

    const creds = await dbGet(
      'SELECT encrypted_token FROM discord_creds WHERE user_id = ?',
      [req.user.id]
    );

    if (!creds) {
      return res.status(400).json({ error: 'Discord credentials not found' });
    }

    // Create job record
    const jobId = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      'INSERT INTO clone_jobs (id, user_id, source_guild_id, destination_guild_id, status, created_at, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [jobId, req.user.id, sourceGuildId, destinationGuildId, 'processing', now, now]
    );

    // Start cloning in background
    performClone(jobId, req.user.id, sourceGuildId, destinationGuildId, creds.encrypted_token);

    res.json({ success: true, jobId, message: 'Cloning started! You can monitor progress below.' });
  } catch (error) {
    console.error('Clone job error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get clone job status
router.get('/clone-job/:jobId', verifyToken, async (req, res) => {
  try {
    const job = await dbGet(
      'SELECT * FROM clone_jobs WHERE id = ? AND user_id = ?',
      [req.params.jobId, req.user.id]
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all clone jobs for user
router.get('/clone-jobs', verifyToken, async (req, res) => {
  try {
    const jobs = await dbAll(
      'SELECT * FROM clone_jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Perform actual cloning
async function performClone(jobId, userId, sourceGuildId, destinationGuildId, encryptedToken) {
  try {
    const token = decrypt(encryptedToken);
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildChannels,
        GatewayIntentBits.DirectMessages
      ]
    });

    client.once('ready', async () => {
      try {
        const sourceGuild = await client.guilds.fetch(sourceGuildId);
        const destinationGuild = await client.guilds.fetch(destinationGuildId);

        const progressUpdates = [];

        // Update progress
        const updateProgress = async (message) => {
          progressUpdates.push(`[${new Date().toLocaleTimeString()}] ${message}`);
          await dbRun(
            'UPDATE clone_jobs SET progress = ? WHERE id = ?',
            [JSON.stringify(progressUpdates), jobId]
          );
        };

        await updateProgress('Starting clone process...');

        // Get channels
        const channels = sourceGuild.channels.cache.filter(c => c.type !== ChannelType.GuildDirectory);
        await updateProgress(`Found ${channels.size} channels to clone`);

        // Delete existing channels
        await updateProgress('Deleting existing channels in destination...');
        const destChannels = destinationGuild.channels.cache;
        for (const channel of destChannels.values()) {
          try {
            await channel.delete();
            await updateProgress(`✓ Deleted: ${channel.name}`);
          } catch (error) {
            await updateProgress(`✗ Failed to delete ${channel.name}: ${error.message}`);
          }
        }

        // Clone categories
        await updateProgress('Creating categories...');
        const categoryMap = {};
        const categories = Array.from(channels.values()).filter(c => c.type === ChannelType.GuildCategory);

        for (const category of categories) {
          try {
            const newCategory = await destinationGuild.channels.create({
              name: category.name,
              type: ChannelType.GuildCategory,
              permissionOverwrites: category.permissionOverwrites.cache
            });
            categoryMap[category.id] = newCategory.id;
            await updateProgress(`✓ Created category: ${category.name}`);
          } catch (error) {
            await updateProgress(`✗ Failed to create category ${category.name}`);
          }
        }

        // Clone channels
        await updateProgress('Creating channels...');
        const nonCategoryChannels = Array.from(channels.values()).filter(c => c.type !== ChannelType.GuildCategory);

        for (const channel of nonCategoryChannels) {
          try {
            const channelData = {
              name: channel.name,
              type: channel.type,
              parent: categoryMap[channel.parentId] || null,
              permissionOverwrites: channel.permissionOverwrites.cache
            };

            if (channel.type === ChannelType.GuildText) {
              channelData.topic = channel.topic;
              channelData.nsfw = channel.nsfw;
              channelData.rateLimitPerUser = channel.rateLimitPerUser;
            } else if (channel.type === ChannelType.GuildVoice) {
              channelData.bitrate = channel.bitrate;
              channelData.userLimit = channel.userLimit;
            }

            await destinationGuild.channels.create(channelData);
            const channelType = channel.type === ChannelType.GuildText ? 'text' : 'voice';
            await updateProgress(`✓ Created ${channelType} channel: ${channel.name}`);
          } catch (error) {
            await updateProgress(`✗ Failed to create ${channel.name}`);
          }
        }

        await updateProgress('✅ Clone completed successfully!');
        const now = new Date().toISOString();
        await dbRun(
          'UPDATE clone_jobs SET status = ?, completed_at = ? WHERE id = ?',
          ['completed', now, jobId]
        );

        client.destroy();
      } catch (error) {
        console.error('Clone error:', error);
        await dbRun(
          'UPDATE clone_jobs SET status = ?, error = ? WHERE id = ?',
          ['failed', error.message, jobId]
        );
        client.destroy();
      }
    });

    client.login(token).catch(async (error) => {
      await dbRun(
        'UPDATE clone_jobs SET status = ?, error = ? WHERE id = ?',
        ['failed', 'Invalid Discord token', jobId]
      );
    });
  } catch (error) {
    console.error('performClone error:', error);
    await dbRun(
      'UPDATE clone_jobs SET status = ?, error = ? WHERE id = ?',
      ['failed', error.message, jobId]
    );
  }
}

module.exports = router;