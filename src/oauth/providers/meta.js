/**
 * Meta (Facebook/Instagram) OAuth Provider
 * Phase 4: Meta OAuth2 flow implementation
 */

export class MetaOAuthProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.scopes = config.scopes || ['instagram_basic', 'instagram_content_publish', 'pages_show_list'];
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(','),
      response_type: 'code',
      state: state || crypto.randomUUID()
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta token exchange failed: ${error.error.message}`);
    }

    const data = await response.json();

    // Exchange short-lived token for long-lived token
    const longLivedToken = await this._getLongLivedToken(data.access_token);

    return {
      access_token: longLivedToken.access_token,
      token_type: 'bearer',
      expires_in: longLivedToken.expires_in,
      expires_at: Date.now() + (longLivedToken.expires_in * 1000)
    };
  }

  async _getLongLivedToken(shortLivedToken) {
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: shortLivedToken
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta long-lived token exchange failed: ${error.error.message}`);
    }

    return response.json();
  }

  async refreshAccessToken(accessToken) {
    // Meta uses token extension instead of refresh
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      fb_exchange_token: accessToken
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta token refresh failed: ${error.error.message}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      token_type: 'bearer',
      expires_in: data.expires_in,
      expires_at: Date.now() + (data.expires_in * 1000)
    };
  }

  async revokeToken(token) {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/permissions?access_token=${token}`,
      { method: 'DELETE' }
    );

    return {
      revoked: response.ok,
      status: response.status
    };
  }

  getProviderInfo() {
    return {
      name: 'Meta (Facebook/Instagram)',
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: this.scopes
    };
  }
}
