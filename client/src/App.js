import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [page, setPage] = useState('login'); // login, select, cloning
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [sourceGuild, setSourceGuild] = useState('');
  const [destinationGuild, setDestinationGuild] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState([]);
  const [user, setUser] = useState(null);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      setUser(response.data.user);
      
      // Fetch guilds
      const guildsResponse = await axios.get('/api/auth/guilds');
      setGuilds(guildsResponse.data.guilds);
      
      setPage('select');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Clone handler
  const handleClone = async (e) => {
    e.preventDefault();
    
    if (!sourceGuild || !destinationGuild) {
      setError('Please select both source and destination servers');
      return;
    }

    if (sourceGuild === destinationGuild) {
      setError('Source and destination servers must be different');
      return;
    }

    setError('');
    setStatus([]);
    setPage('cloning');
    setLoading(true);

    try {
      const response = await fetch('/api/cloner/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceGuildId: sourceGuild,
          destinationGuildId: destinationGuild
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(l => l);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            setStatus(prev => [...prev, data]);
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      setLoading(false);
    } catch (err) {
      setError('Cloning failed: ' + err.message);
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    setPage('login');
    setUser(null);
    setGuilds([]);
    setEmail('');
    setPassword('');
    setStatus([]);
  };

  // Login page
  if (page === 'login') {
    return (
      <div className="container">
        <h1>🤖 Discord Server Cloner</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Discord Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Discord Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={loading}
            />
          </div>
          <div className="info">
            ⚠️ Your credentials are encrypted and only used to authenticate with Discord. They are never stored permanently.
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to Discord'}
          </button>
        </form>
      </div>
    );
  }

  // Select servers page
  if (page === 'select') {
    return (
      <div className="container">
        <h1>🎯 Select Servers</h1>
        <div className="info">Logged in as: <strong>{user?.username}</strong></div>
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleClone}>
          <div className="form-group">
            <label>Source Server (to copy from)</label>
            <select
              value={sourceGuild}
              onChange={(e) => setSourceGuild(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Select source server --</option>
              {guilds.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Destination Server (to replace)</label>
            <select
              value={destinationGuild}
              onChange={(e) => setDestinationGuild(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">-- Select destination server --</option>
              {guilds.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div className="info">
            ⚠️ <strong>Warning:</strong> All channels in the destination server will be deleted and replaced with the source server's structure. This cannot be undone!
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Starting clone...' : 'Start Cloning'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{ marginTop: '10px', background: '#999' }}
          >
            Logout
          </button>
        </form>
      </div>
    );
  }

  // Cloning page
  if (page === 'cloning') {
    const isComplete = status.some(s => s.success);
    const hasError = status.some(s => s.error);

    return (
      <div className="container">
        <h1>⏳ Cloning in Progress</h1>
        
        <div className="status">
          {status.map((s, idx) => (
            <div key={idx} className={`status-line ${s.error ? 'error' : ''}`}>
              {s.status}
            </div>
          ))}
        </div>

        {isComplete && (
          <div style={{ marginTop: '20px' }}>
            <div className="info" style={{ background: '#c8e6c9', color: '#2e7d32' }}>
              ✅ Clone completed successfully!
            </div>
            <button
              onClick={() => {
                setPage('select');
                setStatus([]);
              }}
              style={{ background: '#4caf50' }}
            >
              Clone Another Server
            </button>
            <button
              onClick={handleLogout}
              style={{ marginTop: '10px', background: '#999' }}
            >
              Logout
            </button>
          </div>
        )}

        {hasError && !isComplete && (
          <div style={{ marginTop: '20px' }}>
            <div className="error">Some errors occurred during cloning</div>
            <button
              onClick={() => {
                setPage('select');
                setStatus([]);
              }}
            >
              Back to Server Selection
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default App;