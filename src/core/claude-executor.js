/**
 * ClaudeExecutor - Claude API function calling integration
 * Phase 1: Tool Call Processing Loop
 */

import Anthropic from '@anthropic-ai/sdk';
import { ToolRegistry } from './registry.js';
import { ExecutionContext } from './context.js';

export class ClaudeExecutor {
  constructor(options = {}) {
    this.registry = new ToolRegistry();
    this.apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    this.client = new Anthropic({ apiKey: this.apiKey });
    this.model = options.model || 'claude-3-5-sonnet-20241022';
    this.maxIterations = options.maxIterations || 10;
    this.timeout = options.timeout || 300000;
  }

  async executeWithClaude(userMessage, context = {}) {
    const messages = [{ role: 'user', content: userMessage }];
    const tools = this._getToolDefinitions();

    const execContext = new ExecutionContext({
      toolName: 'claude-executor',
      params: { userMessage },
      ...context
    });

    try {
      const result = await this._functionCallingLoop(messages, tools, execContext);
      execContext.complete(result);
      return result;
    } catch (error) {
      execContext.fail(error);
      throw error;
    }
  }

  async _functionCallingLoop(messages, tools, context) {
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;

      const response = await this._callClaude(messages, tools);

      if (response.stop_reason === 'end_turn') {
        return this._extractFinalResponse(response);
      }

      if (response.stop_reason === 'tool_use') {
        const toolResults = await this._processToolCalls(response, context);

        messages.push({
          role: 'assistant',
          content: response.content
        });

        messages.push({
          role: 'user',
          content: toolResults
        });

        continue;
      }

      if (response.stop_reason === 'max_tokens') {
        throw new Error('Max tokens reached in conversation');
      }

      throw new Error(`Unexpected stop reason: ${response.stop_reason}`);
    }

    throw new Error(`Max iterations (${this.maxIterations}) reached`);
  }

  async _callClaude(messages, tools) {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages,
        tools
      });

      return response;
    } catch (error) {
      if (error.status === 529) {
        await this._delay(2000);
        return this._callClaude(messages, tools);
      }
      throw error;
    }
  }

  async _processToolCalls(response, context) {
    const toolUseBlocks = response.content.filter(
      block => block.type === 'tool_use'
    );

    const results = [];

    for (const toolUse of toolUseBlocks) {
      try {
        const tool = this.registry.get(toolUse.name);

        if (!tool) {
          results.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            is_error: true,
            content: `Tool not found: ${toolUse.name}`
          });
          continue;
        }

        const result = await tool.execute(toolUse.input, context);

        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: typeof result === 'string' ? result : JSON.stringify(result)
        });
      } catch (error) {
        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          is_error: true,
          content: error.message
        });
      }
    }

    return results;
  }

  _extractFinalResponse(response) {
    const textBlocks = response.content.filter(
      block => block.type === 'text'
    );

    return textBlocks.map(block => block.text).join('\n');
  }

  _getToolDefinitions() {
    const tools = [];

    for (const name of this.registry.list()) {
      const tool = this.registry.get(name);

      if (tool.schema) {
        tools.push({
          name,
          description: tool.description || `Execute ${name} tool`,
          input_schema: tool.schema
        });
      }
    }

    return tools;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  registerTool(name, tool) {
    this.registry.register(name, tool);
  }
}
