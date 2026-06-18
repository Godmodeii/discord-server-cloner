import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/clone-history.css';

function CloneHistory() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/discord/clone-jobs');
      setJobs(response.data.jobs);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>📋 Clone History</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {jobs.length === 0 ? (
        <div className="empty-state">
          <p>No clones yet. Start your first clone!</p>
        </div>
      ) : (
        <div className="history-table">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id}>
                  <td>{job.source_guild_name || 'Unknown'}</td>
                  <td>{job.destination_guild_name || 'Unknown'}</td>
                  <td>
                    <span className={`status-badge status-${job.status}`}>
                      {job.status === 'completed' ? '✅' : job.status === 'failed' ? '❌' : '🔄'} {job.status}
                    </span>
                  </td>
                  <td>{new Date(job.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CloneHistory;