# Discord Server Cloner 🤖

A fast, easy-to-use web application that safely clones Discord servers. This tool allows you to copy the structure (channels, categories, permissions) from one Discord server to another.

## ⚠️ Important Disclaimer

This tool is for **educational purposes only**. By using this tool, you agree that:
- You have proper authorization to use Discord accounts
- You understand Discord's Terms of Service
- You use this tool responsibly and legally
- You take full responsibility for any consequences

## Features

✨ **Fast & Easy** - Simple web interface
🔐 **Secure** - Credentials are encrypted
📋 **Complete Cloning** - Copies categories, channels, and permissions
⚡ **Real-time Status** - Live progress updates
🎯 **User-Friendly** - No complex setup required

## What Gets Cloned

- ✅ Channel categories
- ✅ Text channels with settings
- ✅ Voice channels with bitrate/user limits
- ✅ Channel permissions and role overwrites
- ✅ Channel topics and settings (slowmode, NSFW, etc.)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Discord account(s)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Godmodeii/discord-server-cloner.git
cd discord-server-cloner
```

2. **Install dependencies:**
```bash
npm install
cd client && npm install && cd ..
```

3. **Create `.env` file:**
```bash
cp .env.example .env
```

4. **Edit `.env` with your details:**
```
DISCORD_TOKEN=your_discord_bot_token_here
PORT=5000
NODE_ENV=development
ENCRYPTION_KEY=generate_a_32_character_key_here_12345678
```

**To generate a 32-character encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

5. **Build the React frontend:**
```bash
cd client
npm run build
cd ..
```

6. **Start the application:**
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Usage

1. **Login** - Enter your Discord email and password
2. **Select Servers** - Choose source and destination servers
3. **Clone** - Click "Start Cloning" and wait for completion
4. **Done!** - Your destination server now has the same structure as the source

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Your Discord user token (for authentication) |
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment (development/production) |
| `ENCRYPTION_KEY` | 32-character key for encrypting credentials |

## Security Notes

🔒 **How it works:**
- Credentials are encrypted with AES-256-CBC
- Encryption happens in-memory only
- Tokens are stored in encrypted sessions
- No credentials are stored on disk
- All HTTPS recommended in production

## Troubleshooting

### "Invalid Discord credentials"
- Verify email and password are correct
- Check if 2FA is enabled (may cause issues)
- Ensure you're not rate-limited

### "Permission denied" errors
- Ensure your Discord account has permission to manage the server
- Check if you own/have admin rights on the destination server

### Clone process hangs
- Check internet connection
- Verify Discord API is accessible
- Restart the application

## Development

### Run in development mode:
```bash
npm run dev
```

This uses nodemon to auto-restart on file changes.

### Project Structure
```
discord-server-cloner/
├── server.js              # Main Express server
├── routes/
│   ├── auth.js           # Authentication routes
│   └── cloner.js         # Cloning logic
├── client/
│   ├── public/           # Static files
│   └── src/
│       ├── App.js        # React main component
│       └── index.css     # Global styles
├── .env.example          # Environment variables template
└── package.json          # Dependencies
```

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React 18
- **Discord Library**: discord.js v14
- **Encryption**: crypto (Node.js built-in)
- **Database**: Session storage (in-memory)

## License

MIT License - See LICENSE file

## Disclaimer

This project is provided "as is" without any warranty. Users are responsible for:
- Ensuring they have permission to use Discord accounts
- Understanding and complying with Discord's Terms of Service
- Any data loss or account issues resulting from use
- Legal compliance in their jurisdiction

## Support

For issues or questions, please create an issue on GitHub.

---

**Made with ❤️ for educational purposes only**