const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const clonerRoutes = require('./routes/cloner');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.ENCRYPTION_KEY || 'default_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cloner', clonerRoutes);

// Serve React frontend
app.use(express.static(path.join(__dirname, 'client/build')));

// Fallback to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});