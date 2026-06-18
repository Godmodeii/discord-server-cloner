import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/server-selector.css';

function ServerSelector() {
  const [guilds, setGuilds] = useState([]);
  const [sourceGuild, setSourceGuild] = useState('');
  const [destinationGuild, setDestinationGuild] = useState('');
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobProgress, setJobProgress] = useState([]);
  const [jobStatus, setJobStatus] = useState('');

  useEffect(() => {
    fetchGuilds();
  }, []);

  useEffect(() => {
    if (!currentJobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/discord/clone-job/${currentJobId}`);
        const job = response.data.job;
        setJobStatus(job.status);
        if (job.progress) {
          setJobProgress(JSON.parse(job.progress));
        }
        if (job.status === 'completed' || job.status === 'failed') {
          setCloning(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentJobId]);

  const fetchGuilds = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/discord/guilds');
      setGuilds(response.data.guilds);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch guilds');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!sourceGuild || !destinationGuild) {
      setError('Please select both source and destination servers');
      return;
    }

    if (sourceGuild === destinationGuild) {
      setError('Source and destination servers must be different');
      return;
    }

    setCloning(true);
    setJobProgress([]);
    setJobStatus('processing');

    try {
      const response = await axios.post('/api/discord/clone-job', {
        sourceGuildId: sourceGuild,
        destinationGuildId: destinationGuild
      });
      setCurrentJobId(response.data.jobId);
      setSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start clone job');
      setCloning(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your Discord servers...</p>
        </div>
      </div>
    );
  }

  if (cloning) {
    return (
      <div className="card">
        <div className="card-header">
          <h2>⏳ Cloning in Progress</h2>
        </div>

        <div className="progress-container">
          <div className={`status-badge status-${jobStatus}`}>
            {jobStatus === 'processing' ? '🔄 Processing' : jobStatus === 'completed' ? '✅ Completed' : '❌ Failed'}
          </div>

          <div className="progress-log">
            {jobProgress.map((line, idx) => (
              <div key={idx} className="log-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>🎯 Clone Discord Server</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleClone}>
        <div className="form-group">
          <label>Source Server (to copy from)</label>
          <select
            value={sourceGuild}
            onChange={(e) => setSourceGuild(e.target.value)}
            required
            disabled={cloning}
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
            disabled={cloning}
          >
            <option value="">-- Select destination server --</option>
            {guilds.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="alert alert-warning">
          <strong>⚠️ Warning:</strong> All channels in the destination server will be deleted and replaced. This cannot be undone!
        </div>

        <button type="submit" className="btn btn-primary" disabled={cloning}>
          {cloning ? '⏳ Cloning...' : '🚀 Start Cloning'}
        </button>
      </form>
    </div>
  );
}

export default ServerSelector;