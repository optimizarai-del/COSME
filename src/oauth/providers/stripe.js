/**
 * Stripe OAuth Provider
 * Phase 4: Stripe Connect OAuth2 flow implementation
 */

export class StripeOAuthProvider {
  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.scopes = config.scopes || ['read_write'];
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: this.scopes.join(' '),
      redirect_uri: this.redirectUri,
      state: state || crypto.randomUUID()
    });

    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.clientSecret}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe token exchange failed: ${error.error_description}`);
    }

    const data = await response.json();

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      stripe_publishable_key: data.stripe_publishable_key,
      stripe_user_id: data.stripe_user_id,
      scope: data.scope,
      // Stripe tokens don't expire unless revoked
      expires_in: null,
      expires_at: null
    };
  }

  async refreshAccessToken(refreshToken) {
    // Stripe doesn't support refresh tokens
    // Access tokens are permanent until revoked
    throw new Error('Stripe tokens do not expire and cannot be refreshed');
  }

  async revokeToken(stripeUserId) {
    const response = await fetch('https://connect.stripe.com/oauth/deauthorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${this.clientSecret}`
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        stripe_user_id: stripeUserId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe revoke failed: ${error.error_description}`);
    }

    const data = await response.json();

    return {
      revoked: true,
      stripe_user_id: data.stripe_user_id
    };
  }

  async createApiKeyCredential(apiKey) {
    // Alternative to OAuth: Direct API key
    return {
      access_token: apiKey,
      token_type: 'api_key',
      provider: 'stripe',
      expires_in: null,
      expires_at: null
    };
  }

  getProviderInfo() {
    return {
      name: 'Stripe',
      authUrl: 'https://connect.stripe.com/oauth/authorize',
      tokenUrl: 'https://connect.stripe.com/oauth/token',
      scopes: this.scopes,
      supportsApiKey: true
    };
  }
}
