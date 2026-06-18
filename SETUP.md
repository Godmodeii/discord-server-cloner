# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Step 1: Prerequisites
```bash
# Check if you have Node.js installed
node --version  # Should be v16 or higher
npm --version
```

If not installed, download from: https://nodejs.org/

### Step 2: Clone & Install
```bash
git clone https://github.com/Godmodeii/discord-server-cloner.git
cd discord-server-cloner
npm install
cd client && npm install && cd ..
```

### Step 3: Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the output (32 characters)

### Step 4: Create `.env` File
```bash
cp .env.example .env
```

Edit `.env`:
```
DISCORD_TOKEN=your_discord_token
PORT=5000
NODE_ENV=development
ENCRYPTION_KEY=paste_your_32_char_key_here
```

### Step 5: Build & Run
```bash
cd client && npm run build && cd ..
npm start
```

Open: http://localhost:5000

## 🐳 Using Docker (Even Faster)

```bash
# Create .env file with your credentials
echo "DISCORD_TOKEN=your_token" > .env
echo "ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")" >> .env

# Run with Docker
docker-compose up
```

Visit: http://localhost:5000

## ⚙️ Configuration

### Finding Your Discord Token

1. Open Discord in your browser
2. Press `F12` to open Developer Tools
3. Go to `Console` tab
4. Type: `window.localStorage.token`
5. Copy the token (remove quotes)
6. Paste into `.env` as `DISCORD_TOKEN`

⚠️ **IMPORTANT**: Never share your token publicly!

### Generating Encryption Key

The encryption key MUST be exactly 32 characters:

```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Or use this one-liner
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📝 Usage

### Login
- Email: Your Discord email
- Password: Your Discord password

### Select Servers
- Source Server: Server you want to copy FROM
- Destination Server: Server to copy TO (**all channels will be deleted**)

### Clone
- Click "Start Cloning"
- Watch real-time progress
- Done! Your destination server now matches the source

## 🐛 Common Issues

### "Cannot find module"
```bash
npm install
cd client && npm install && cd ..
```

### Port 5000 already in use
Edit `.env`:
```
PORT=3000
```

### Discord login fails
- Check email/password are correct
- Try logging in to discord.com manually first
- If using 2FA, you may need to temporarily disable it

### Clone takes forever
- Check internet connection
- Large servers with many channels take longer
- Discord API might be rate limiting

## 📦 Production Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
```bash
NODE_ENV=production npm start
```

Then set up with reverse proxy (nginx, Apache, etc.)

## 🔐 Security Checklist

- [ ] Change `ENCRYPTION_KEY` to a unique value
- [ ] Use HTTPS in production
- [ ] Keep `.env` file private (in `.gitignore`)
- [ ] Use strong Discord password
- [ ] Delete `.env` after setup for extra security
- [ ] Keep Node.js updated

## 📞 Need Help?

1. Check README.md for full documentation
2. Check troubleshooting section
3. Create an issue on GitHub

## 🎓 Educational Use Only

This tool is for learning purposes. Ensure you:
- Have authorization to access accounts
- Comply with Discord ToS
- Use responsibly
- Don't share credentials