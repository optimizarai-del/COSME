import test from 'node:test';
import assert from 'node:assert';
import { ToolExecutor } from './executor.js';
import { ExecutionContext } from './context.js';
import { ToolRegistry } from './registry.js';

test('ToolExecutor - Basic Execution', async (t) => {
  const executor = new ToolExecutor();

  executor.registerTool('greet', {
    execute: async (params) => `Hello, ${params.name}!`
  });

  const result = await executor.execute('greet', { name: 'World' });
  assert.strictEqual(result, 'Hello, World!');
});

test('ToolExecutor - Missing Tool Error', async (t) => {
  const executor = new ToolExecutor();

  await assert.rejects(
    () => executor.execute('nonexistent', {}),
    (err) => err.message.includes('Tool not found')
  );
});

test('ToolExecutor - Retry Logic on Failure', async (t) => {
  const executor = new ToolExecutor({ maxRetries: 2 });
  let attemptCount = 0;

  executor.registerTool('flaky', {
    execute: async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Transient failure');
      }
      return 'Success';
    }
  });

  const result = await executor.execute('flaky', {});
  assert.strictEqual(result, 'Success');
  assert.strictEqual(attemptCount, 3);
});

test('ToolExecutor - Timeout Handling', async (t) => {
  const executor = new ToolExecutor({ timeout: 100 });

  executor.registerTool('slow', {
    execute: async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return 'Done';
    }
  });

  await assert.rejects(
    () => executor.execute('slow', {}),
    (err) => err.message.includes('Execution timeout')
  );
});

test('ExecutionContext - Status Transitions', async (t) => {
  const context = new ExecutionContext({
    toolName: 'test',
    params: { foo: 'bar' }
  });

  assert.strictEqual(context.status, 'pending');

  context.complete('result');
  assert.strictEqual(context.status, 'completed');
  assert.strictEqual(context.result, 'result');

  const duration = context.getDuration();
  assert(duration >= 0);
});

test('ExecutionContext - Error Tracking', async (t) => {
  const context = new ExecutionContext({
    toolName: 'test',
    params: {}
  });

  const error = new Error('Test error');
  context.fail(error);

  assert.strictEqual(context.status, 'failed');
  assert.strictEqual(context.error, error);
});

test('ToolRegistry - Register and Retrieve', async (t) => {
  const registry = new ToolRegistry();
  const tool = { execute: async () => 'test' };

  registry.register('test', tool);
  assert.strictEqual(registry.get('test'), tool);
  assert(registry.has('test'));
});

test('ToolRegistry - Duplicate Registration Error', async (t) => {
  const registry = new ToolRegistry();
  const tool = { execute: async () => 'test' };

  registry.register('test', tool);

  assert.throws(
    () => registry.register('test', tool),
    (err) => err.message.includes('already registered')
  );
});

test('ToolRegistry - Tool Validation', async (t) => {
  const registry = new ToolRegistry();

  assert.throws(
    () => registry.register('bad', { notAnExecutable: true }),
    (err) => err.message.includes('must have an execute method')
  );
});

test('ToolRegistry - List and Unregister', async (t) => {
  const registry = new ToolRegistry();
  registry.register('tool1', { execute: async () => {} });
  registry.register('tool2', { execute: async () => {} });

  assert.deepStrictEqual(registry.list().sort(), ['tool1', 'tool2']);

  registry.unregister('tool1');
  assert.deepStrictEqual(registry.list(), ['tool2']);
});

test('ToolExecutor - ExecutionContext Passed to Tool', async (t) => {
  const executor = new ToolExecutor();
  let contextReceived;

  executor.registerTool('context-aware', {
    execute: async (params, context) => {
      contextReceived = context;
      return 'done';
    }
  });

  await executor.execute('context-aware', { test: 'param' });

  assert(contextReceived instanceof ExecutionContext);
  assert.strictEqual(contextReceived.toolName, 'context-aware');
  assert.deepStrictEqual(contextReceived.params, { test: 'param' });
});
