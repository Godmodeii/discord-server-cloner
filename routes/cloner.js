const express = require('express');
const router = express.Router();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');
const crypto = require('crypto');

const encryptionKey = process.env.ENCRYPTION_KEY;

const decrypt = (text) => {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
  let decrypted = decipher.update(parts[1], 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Clone server endpoint
router.post('/clone', async (req, res) => {
  try {
    if (!req.session.token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { sourceGuildId, destinationGuildId } = req.body;

    if (!sourceGuildId || !destinationGuildId) {
      return res.status(400).json({ error: 'Source and destination guild IDs required' });
    }

    const token = decrypt(req.session.token);
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

        res.setHeader('Content-Type', 'application/json');

        // Start cloning process
        res.write(JSON.stringify({ status: 'Starting clone process...' }) + '\n');

        // Get all channels from source guild
        const channels = sourceGuild.channels.cache.filter(c => c.type !== ChannelType.GuildDirectory);
        res.write(JSON.stringify({ status: `Found ${channels.size} channels to clone` }) + '\n');

        // Delete all channels in destination guild
        res.write(JSON.stringify({ status: 'Deleting existing channels...' }) + '\n');
        const destChannels = destinationGuild.channels.cache;
        
        for (const channel of destChannels.values()) {
          try {
            await channel.delete();
            res.write(JSON.stringify({ status: `Deleted channel: ${channel.name}` }) + '\n');
          } catch (error) {
            res.write(JSON.stringify({ status: `Failed to delete ${channel.name}: ${error.message}`, error: true }) + '\n');
          }
        }

        // Clone categories and channels
        res.write(JSON.stringify({ status: 'Creating categories and channels...' }) + '\n');

        const categoryMap = {};

        // First, create categories
        const categories = Array.from(channels.values()).filter(c => c.type === ChannelType.GuildCategory);
        
        for (const category of categories) {
          try {
            const newCategory = await destinationGuild.channels.create({
              name: category.name,
              type: ChannelType.GuildCategory,
              permissionOverwrites: category.permissionOverwrites.cache
            });
            categoryMap[category.id] = newCategory.id;
            res.write(JSON.stringify({ status: `Created category: ${category.name}` }) + '\n');
          } catch (error) {
            res.write(JSON.stringify({ status: `Failed to create category ${category.name}: ${error.message}`, error: true }) + '\n');
          }
        }

        // Then create channels
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
            res.write(JSON.stringify({ status: `Created ${channel.type === ChannelType.GuildText ? 'text' : 'voice'} channel: ${channel.name}` }) + '\n');
          } catch (error) {
            res.write(JSON.stringify({ status: `Failed to create channel ${channel.name}: ${error.message}`, error: true }) + '\n');
          }
        }

        res.write(JSON.stringify({ status: 'Clone completed successfully!', success: true }) + '\n');
        res.end();
        client.destroy();

      } catch (error) {
        res.write(JSON.stringify({ status: `Error: ${error.message}`, error: true }) + '\n');
        res.end();
        client.destroy();
      }
    });

    client.login(token).catch((error) => {
      res.status(401).json({ error: 'Session expired or invalid token' });
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;