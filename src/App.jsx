import React, { useState, useEffect } from 'react';

export default function App() {
  const [activeTab, setActiveTab] = useState('credentials');
  const [orgId, setOrgId] = useState(localStorage.getItem('selectedOrg') || 'test-org');
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [providers, setProviders] = useState([]);

  const API_BASE = window.location.origin;

  // Check health on mount
  useEffect(() => {
    checkHealth();
    loadProviders();
    handleOAuthCallback();
  }, []);

  // Persist org selection
  useEffect(() => {
    localStorage.setItem('selectedOrg', orgId);
  }, [orgId]);

  // Handle OAuth callback
  const handleOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    const oauthSuccess = params.get('oauth_success');
    const provider = params.get('provider');
    const state = params.get('state');
    const credentialId = params.get('credentialId');
    const error = params.get('error');

    if (error) {
      showMessage(`OAuth error: ${error}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (oauthSuccess === 'true' && provider && state) {
      const savedState = sessionStorage.getItem(`oauth_state_${provider}`);
      if (savedState === state) {
        showMessage(`✓ Successfully connected with ${provider}${credentialId ? ` - ID: ${credentialId}` : ''}`, 'success');
        sessionStorage.removeItem(`oauth_state_${provider}`);
        loadCredentials(); // Refresh credential list
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        showMessage('OAuth state validation failed (CSRF check)', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const checkHealth = async () => {
    try {
      await fetch(`${API_BASE}/health`);
    } catch (e) {
      showMessage('API server disconnected', 'error');
    }
  };

  const loadProviders = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/oauth/providers`);
      const data = await resp.json();
      setProviders(data.providers || []);
    } catch (e) {
      console.error('Failed to load providers:', e);
    }
  };

  const createCredential = async (e) => {
    e.preventDefault();
    const form = e.target;
    const provider = form.provider.value;
    const accessToken = form.accessToken.value;
    const refreshToken = form.refreshToken.value;
    const expiresAt = form.expiresAt.value;

    if (!provider || !accessToken) {
      showMessage('Please fill required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const credentials_obj = { access_token: accessToken };
      if (refreshToken) credentials_obj.refresh_token = refreshToken;
      if (expiresAt) credentials_obj.expires_at = parseInt(expiresAt);

      const resp = await fetch(`${API_BASE}/api/orgs/${orgId}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, credentials: credentials_obj })
      });

      const data = await resp.json();
      if (resp.ok) {
        showMessage(`✓ Credential created: ${data.id}`, 'success');
        form.reset();
        loadCredentials();
      } else {
        showMessage(`✗ ${data.error}`, 'error');
      }
    } catch (e) {
      showMessage(`✗ ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/orgs/${orgId}/credentials`);
      const data = await resp.json();
      setCredentials(data.credentials || []);
      if (data.count === 0) {
        showMessage(`No credentials for org: ${orgId}`, 'info');
      }
    } catch (e) {
      showMessage(`✗ ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteCredential = async (credId) => {
    if (!confirm('Delete this credential permanently?')) return;

    try {
      const resp = await fetch(`${API_BASE}/api/orgs/${orgId}/credentials/${credId}`, {
        method: 'DELETE'
      });

      if (resp.ok) {
        showMessage('✓ Credential deleted', 'success');
        loadCredentials();
      } else {
        showMessage('✗ Failed to delete', 'error');
      }
    } catch (e) {
      showMessage(`✗ ${e.message}`, 'error');
    }
  };

  const refreshToken = async (credId) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/orgs/${orgId}/credentials/${credId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: 'refreshed_' + Date.now(),
          expires_at: Date.now() + 3600000
        })
      });

      if (resp.ok) {
        showMessage('✓ Token refreshed', 'success');
        loadCredentials();
      } else {
        showMessage('✗ Failed to refresh', 'error');
      }
    } catch (e) {
      showMessage(`✗ ${e.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startOAuthFlow = (provider) => {
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem(`oauth_state_${provider}`, state);
    const redirectUri = `${API_BASE}/api/oauth/${provider}/authorize?orgId=${orgId}&state=${state}`;
    window.location.href = redirectUri;
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>🔐 COSME Credential Manager</h1>
          <p style={styles.subtitle}>Dynamic Tool Executor Engine - Admin Dashboard</p>

          <div style={styles.controls}>
            <input
              type="text"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              placeholder="Organization ID"
              style={styles.orgInput}
            />
            <span style={styles.orgDisplay}>Org: {orgId}</span>
          </div>
        </header>

        {message.text && (
          <div style={{ ...styles.message, ...styles[`message_${message.type}`] }}>
            {message.text}
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(activeTab === 'credentials' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('credentials')}
            >
              Credentials
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'oauth' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('oauth')}
            >
              OAuth
            </button>
            <button
              style={{ ...styles.tab, ...(activeTab === 'create' ? styles.tabActive : {}) }}
              onClick={() => setActiveTab('create')}
            >
              Create
            </button>
          </div>

          {activeTab === 'create' && (
            <form onSubmit={createCredential} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Provider</label>
                <select name="provider" style={styles.input}>
                  <option value="hubspot">HubSpot</option>
                  <option value="stripe">Stripe</option>
                  <option value="meta">Meta</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Access Token *</label>
                <input type="password" name="accessToken" placeholder="Enter access token" style={styles.input} required />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Refresh Token</label>
                <input type="password" name="refreshToken" placeholder="Enter refresh token" style={styles.input} />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Expires At (timestamp)</label>
                <input type="number" name="expiresAt" placeholder="e.g., 1704067200000" style={styles.input} />
              </div>

              <button type="submit" disabled={loading} style={styles.submitButton}>
                {loading ? 'Creating...' : 'Create Credential'}
              </button>
            </form>
          )}

          {activeTab === 'oauth' && (
            <div style={styles.oauthContainer}>
              <h3 style={styles.oauthTitle}>Connect with OAuth Providers</h3>
              <div style={styles.oauthGrid}>
                {['hubspot', 'stripe', 'meta'].map(provider => (
                  <button
                    key={provider}
                    onClick={() => startOAuthFlow(provider)}
                    style={styles.oauthButton}
                  >
                    Connect with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div style={styles.credentialsSection}>
              <button onClick={loadCredentials} disabled={loading} style={styles.reloadButton}>
                {loading ? 'Loading...' : 'Reload Credentials'}
              </button>

              {credentials.length > 0 ? (
                <div style={styles.credentialsList}>
                  {credentials.map(cred => (
                    <div key={cred.id} style={styles.credentialItem}>
                      <div style={styles.credentialInfo}>
                        <strong>{cred.provider}</strong>
                        <div style={styles.credentialId}>{cred.id}</div>
                        <div style={styles.credentialMeta}>
                          Created: {new Date(cred.createdAt).toLocaleDateString()}
                          {cred.hasRefreshToken && ' • Has refresh token'}
                        </div>
                      </div>
                      <div style={styles.credentialActions}>
                        <button onClick={() => refreshToken(cred.id)} style={styles.refreshButton}>
                          Refresh
                        </button>
                        <button onClick={() => deleteCredential(cred.id)} style={styles.deleteButton}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <p>No credentials found for this organization</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: '20px',
    margin: 0
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    background: 'white',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#333',
    margin: '0 0 10px 0',
    fontSize: '28px'
  },
  subtitle: {
    color: '#666',
    margin: '0 0 15px 0'
  },
  controls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  orgInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  orgDisplay: {
    color: '#667eea',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  message: {
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  message_success: {
    background: '#d1fae5',
    color: '#065f46',
    border: '1px solid #6ee7b7'
  },
  message_error: {
    background: '#fee2e2',
    color: '#7f1d1d',
    border: '1px solid #fca5a5'
  },
  message_info: {
    background: '#dbeafe',
    color: '#1e3a8a',
    border: '1px solid #93c5fd'
  },
  card: {
    background: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #e0e0e0'
  },
  tab: {
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    fontWeight: '500',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    fontSize: '14px'
  },
  tabActive: {
    color: '#667eea',
    borderBottomColor: '#667eea'
  },
  form: {
    display: 'grid',
    gap: '16px'
  },
  formGroup: {
    display: 'grid',
    gap: '6px'
  },
  label: {
    color: '#555',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit'
  },
  submitButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  oauthContainer: {
    padding: '20px'
  },
  oauthTitle: {
    color: '#333',
    marginBottom: '16px'
  },
  oauthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px'
  },
  oauthButton: {
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  credentialsSection: {
    display: 'grid',
    gap: '16px'
  },
  reloadButton: {
    padding: '10px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  credentialsList: {
    display: 'grid',
    gap: '12px'
  },
  credentialItem: {
    border: '1px solid #e0e0e0',
    padding: '16px',
    borderRadius: '6px',
    background: '#fafafa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  credentialInfo: {
    flex: 1
  },
  credentialId: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  credentialMeta: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px'
  },
  credentialActions: {
    display: 'flex',
    gap: '8px',
    marginLeft: '16px'
  },
  refreshButton: {
    padding: '8px 12px',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  deleteButton: {
    padding: '8px 12px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  }
};
