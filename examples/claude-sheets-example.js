/**
 * Example: Claude with Google Sheets integration
 * Demonstrates Phase 1 (Claude function calling) + Phase 2 (Google Sheets tools)
 */

import { ClaudeExecutor } from '../src/core/claude-executor.js';
import { GoogleSheetsTools } from '../src/tools/google-sheets.js';
import { CredentialManager } from '../src/core/credential-manager.js';

async function main() {
  // Initialize credential manager
  const credManager = new CredentialManager({
    encryptionKey: Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32))
  });

  // Store Google OAuth credentials
  const credentialId = credManager.storeCredential('google-sheets-1', {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: ['http://localhost:3000/oauth/callback'],
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    onTokenRefresh: async (newTokens) => {
      credManager.refreshToken(credentialId, newTokens);
      console.log('Token refreshed successfully');
    }
  });

  // Get credentials and initialize Google Sheets tools
  const credentials = credManager.getCredential(credentialId);
  const sheetsTools = new GoogleSheetsTools(credentials);

  // Initialize Claude executor
  const executor = new ClaudeExecutor({
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-5-sonnet-20241022'
  });

  // Register Google Sheets tools
  for (const tool of sheetsTools.getAllTools()) {
    executor.registerTool(tool.name, tool);
  }

  // Execute a task with Claude
  const userMessage = `
    Create a new Google Spreadsheet called "Sales Report Q1 2024"
    with two sheets: "Revenue" and "Expenses".
    Then add the following data to the Revenue sheet:
    - Row 1: Month, Product, Amount
    - Row 2: January, Widget A, $5000
    - Row 3: February, Widget B, $7500
  `;

  try {
    const result = await executor.executeWithClaude(userMessage);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run example if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
