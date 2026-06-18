import React, { useState } from 'react';
import axios from 'axios';
import '../styles/discord-setup.css';

function DiscordSetup({ onCredsUpdated }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/discord/store-creds', {
        discordToken: token
      });
      setSuccess(response.data.message);
      setToken('');
      setTimeout(() => onCredsUpdated(), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to store credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>🔑 Add Discord Token</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Discord User Token</label>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your Discord token here"
            required
            disabled={loading}
            rows="4"
          />
          <small className="help-text">
            Your token is encrypted and stored securely. Never share it with anyone!
          </small>
        </div>

        <div className="instructions">
          <h3>How to get your Discord token:</h3>
          <ol>
            <li>Open Discord in your browser (discord.com)</li>
            <li>Press F12 to open Developer Tools</li>
            <li>Go to the Console tab</li>
            <li>Type: <code>window.localStorage.token</code></li>
            <li>Copy the output (without quotes)</li>
            <li>Paste it above and click "Save Token"</li>
          </ol>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : '💾 Save Token'}
        </button>
      </form>
    </div>
  );
}

export default DiscordSetup;