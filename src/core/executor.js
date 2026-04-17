/**
 * ToolExecutor - Core execution engine
 */

import { ToolRegistry } from './registry.js';
import { ExecutionContext } from './context.js';

export class ToolExecutor {
  constructor(options = {}) {
    this.registry = new ToolRegistry();
    this.options = {
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000,
      ...options
    };
  }

  async execute(toolName, params = {}, context = {}) {
    const tool = this.registry.get(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    const execContext = new ExecutionContext({
      toolName,
      params,
      ...context
    });

    try {
      const result = await this._executeWithRetry(tool, params, execContext);
      execContext.complete(result);
      return result;
    } catch (error) {
      execContext.fail(error);
      throw error;
    }
  }

  async _executeWithRetry(tool, params, context) {
    let lastError;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await this._executeWithTimeout(tool, params, context);
      } catch (error) {
        lastError = error;
        if (attempt < this.options.maxRetries) {
          await this._delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError;
  }

  async _executeWithTimeout(tool, params, context) {
    return Promise.race([
      tool.execute(params, context),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), this.options.timeout)
      )
    ]);
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  registerTool(name, tool) {
    this.registry.register(name, tool);
  }
}
