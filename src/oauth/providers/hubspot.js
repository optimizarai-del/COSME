/**
 * HubSpot OAuth Provider
 * Phase 4: HubSpot OAuth2 flow implementation
 */

export class HubSpotOAuthProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.scopes = config.scopes || ['crm.objects.contacts.read', 'crm.objects.contacts.write'];
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      state: state || crypto.randomUUID()
    });

    return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HubSpot token exchange failed: ${error.message}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type
    };
  }

  async refreshAccessToken(refreshToken) {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`HubSpot token refresh failed: ${error.message}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000),
      token_type: data.token_type
    };
  }

  async revokeToken(token) {
    // HubSpot doesn't have a revoke endpoint
    // Tokens expire naturally or can be revoked in HubSpot dashboard
    return { revoked: true };
  }

  getProviderInfo() {
    return {
      name: 'HubSpot',
      authUrl: 'https://app.hubspot.com/oauth/authorize',
      tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
      scopes: this.scopes
    };
  }
}
