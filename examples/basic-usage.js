/**
 * Basic usage example
 */

import { ToolExecutor } from '../src/index.js';

// Create executor
const executor = new ToolExecutor({
  maxRetries: 3,
  timeout: 10000
});

// Register a simple tool
executor.registerTool('greet', {
  name: 'greet',
  execute: async (params) => {
    return `Hello, ${params.name || 'World'}!`;
  }
});

// Execute tool
const result = await executor.execute('greet', { name: 'Claude' });
console.log(result);
