import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/dashboard.css';
import DiscordSetup from '../components/DiscordSetup';
import ServerSelector from '../components/ServerSelector';
import CloneHistory from '../components/CloneHistory';

function DashboardPage({ user, token, onLogout }) {
  const [discordCreds, setDiscordCreds] = useState(null);
  const [activeTab, setActiveTab] = useState('clone');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchDiscordCreds();
  }, [refreshTrigger]);

  const fetchDiscordCreds = async () => {
    try {
      const response = await axios.get('/api/discord/my-creds');
      setDiscordCreds(response.data.creds);
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    }
  };

  const handleCredsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🤖 Discord Server Cloner</h1>
          <p>Welcome, {user?.username}!</p>
        </div>
        <div className="header-right">
          <button onClick={onLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-container">
        <nav className="dashboard-nav">
          <button
            className={`nav-btn ${activeTab === 'clone' ? 'active' : ''}`}
            onClick={() => setActiveTab('clone')}
          >
            ⚙️ Setup & Clone
          </button>
          <button
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📋 History
          </button>
          <button
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="dashboard-content">
          {activeTab === 'clone' && (
            <div className="tab-content">
              {!discordCreds ? (
                <DiscordSetup onCredsUpdated={handleCredsUpdated} />
              ) : (
                <ServerSelector discordCreds={discordCreds} />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="tab-content">
              <CloneHistory />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <h2>Account Settings</h2>
                </div>
                <div className="settings-content">
                  <div className="setting-item">
                    <label>Email:</label>
                    <span>{user?.email}</span>
                  </div>
                  <div className="setting-item">
                    <label>Username:</label>
                    <span>{user?.username}</span>
                  </div>
                  <div className="setting-item">
                    <label>Member Since:</label>
                    <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                  </div>
                  {discordCreds && (
                    <div className="setting-item">
                      <label>Discord Account:</label>
                      <span>{discordCreds.discord_username}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;