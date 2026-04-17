/**
 * Integration Test Example
 * Tests the complete COSME API flow end-to-end
 * Run with: node examples/integration-test.js
 */

import http from 'http';

const BASE_URL = process.env.COSME_URL || 'http://localhost:3000';
const ORG_ID = 'test-org-' + Date.now();

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test(description, fn) {
  try {
    await fn();
    console.log(`✓ ${description}`);
    return true;
  } catch (error) {
    console.error(`✗ ${description}`);
    console.error(`  Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   COSME Integration Test Suite         ║`);
  console.log(`╚════════════════════════════════════════╝\n`);

  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  if (await test('Health check endpoint returns OK', async () => {
    const { status, body } = await makeRequest('GET', '/health');
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (body.status !== 'ok') throw new Error('Status is not ok');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Create Credential
  let credentialId;
  if (await test('Create credential via POST', async () => {
    const { status, body } = await makeRequest(
      'POST',
      `/api/orgs/${ORG_ID}/credentials`,
      {
        provider: 'hubspot',
        credentials: {
          access_token: 'test-token-123',
          refresh_token: 'test-refresh-456',
          expires_at: Date.now() + 3600000
        }
      }
    );
    if (status !== 201) throw new Error(`Expected 201, got ${status}`);
    if (!body.id) throw new Error('No credential ID returned');
    credentialId = body.id;
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: List Credentials
  if (await test('List credentials for organization', async () => {
    const { status, body } = await makeRequest(
      'GET',
      `/api/orgs/${ORG_ID}/credentials`
    );
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (!Array.isArray(body.credentials)) throw new Error('No credentials array');
    if (body.count !== 1) throw new Error(`Expected 1 credential, got ${body.count}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Get Specific Credential
  if (await test('Get specific credential (sanitized)', async () => {
    const { status, body } = await makeRequest(
      'GET',
      `/api/orgs/${ORG_ID}/credentials/${credentialId}`
    );
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (body.hasAccessToken !== true) throw new Error('hasAccessToken should be true');
    if (body.hasRefreshToken !== true) throw new Error('hasRefreshToken should be true');
    // Verify tokens are NOT returned
    if (body.access_token) throw new Error('access_token should not be returned');
    if (body.refresh_token) throw new Error('refresh_token should not be returned');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Update Credential
  if (await test('Update credential (refresh token)', async () => {
    const { status, body } = await makeRequest(
      'PATCH',
      `/api/orgs/${ORG_ID}/credentials/${credentialId}`,
      {
        access_token: 'new-token-789',
        expires_at: Date.now() + 7200000
      }
    );
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (body.updated !== true) throw new Error('Update not confirmed');
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 6: Create Multiple Credentials
  let secondCredId;
  if (await test('Create multiple credentials in same org', async () => {
    const { status, body } = await makeRequest(
      'POST',
      `/api/orgs/${ORG_ID}/credentials`,
      {
        provider: 'stripe',
        credentials: {
          access_token: 'stripe-token',
          expires_at: Date.now() + 3600000
        }
      }
    );
    if (status !== 201) throw new Error(`Expected 201, got ${status}`);
    secondCredId = body.id;

    // Verify both are listed
    const list = await makeRequest('GET', `/api/orgs/${ORG_ID}/credentials`);
    if (list.body.count !== 2) throw new Error(`Expected 2 credentials, got ${list.body.count}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 7: Organization Isolation
  if (await test('Organization isolation (different org sees no creds)', async () => {
    const { status, body } = await makeRequest(
      'GET',
      `/api/orgs/different-org/credentials`
    );
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (body.count !== 0) throw new Error(`Expected 0 credentials for different org, got ${body.count}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 8: Delete Credential
  if (await test('Delete credential', async () => {
    const { status, body } = await makeRequest(
      'DELETE',
      `/api/orgs/${ORG_ID}/credentials/${secondCredId}`
    );
    if (status !== 200) throw new Error(`Expected 200, got ${status}`);
    if (body.deleted !== true) throw new Error('Deletion not confirmed');

    // Verify deletion
    const list = await makeRequest('GET', `/api/orgs/${ORG_ID}/credentials`);
    if (list.body.count !== 1) throw new Error(`Expected 1 credential after deletion, got ${list.body.count}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 9: Error Handling - Missing Fields
  if (await test('Error: missing required fields', async () => {
    const { status } = await makeRequest(
      'POST',
      `/api/orgs/${ORG_ID}/credentials`,
      { provider: 'hubspot' } // missing credentials
    );
    if (status !== 400) throw new Error(`Expected 400, got ${status}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Test 10: Error Handling - Not Found
  if (await test('Error: credential not found', async () => {
    const { status } = await makeRequest(
      'GET',
      `/api/orgs/${ORG_ID}/credentials/nonexistent`
    );
    if (status !== 404) throw new Error(`Expected 404, got ${status}`);
  })) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Test Results                         ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
