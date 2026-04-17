/**
 * OAuth Manager
 * Phase 4: Centralized OAuth provider management
 */

import { HubSpotOAuthProvider } from './providers/hubspot.js';
import { MetaOAuthProvider } from './providers/meta.js';
import { StripeOAuthProvider } from './providers/stripe.js';
import { GenericOAuthProvider } from './providers/generic.js';

export class OAuthManager {
  constructor() {
    this.providers = new Map();
  }

  registerHubSpot(config) {
    const provider = new HubSpotOAuthProvider(config);
    this.providers.set('hubspot', provider);
    return provider;
  }

  registerMeta(config) {
    const provider = new MetaOAuthProvider(config);
    this.providers.set('meta', provider);
    return provider;
  }

  registerStripe(config) {
    const provider = new StripeOAuthProvider(config);
    this.providers.set('stripe', provider);
    return provider;
  }

  registerGeneric(name, config) {
    const provider = new GenericOAuthProvider({ ...config, name });
    this.providers.set(name, provider);
    return provider;
  }

  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`OAuth provider not found: ${name}`);
    }
    return provider;
  }

  listProviders() {
    return Array.from(this.providers.keys());
  }

  getProviderInfo(name) {
    const provider = this.getProvider(name);
    return provider.getProviderInfo();
  }

  getAllProvidersInfo() {
    const info = {};
    for (const [name, provider] of this.providers) {
      info[name] = provider.getProviderInfo();
    }
    return info;
  }
}
