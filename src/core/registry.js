/**
 * ToolRegistry - Tool registration and lookup
 */

export class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(name, tool) {
    if (this.tools.has(name)) {
      throw new Error(`Tool already registered: ${name}`);
    }

    this._validateTool(tool);
    this.tools.set(name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  has(name) {
    return this.tools.has(name);
  }

  list() {
    return Array.from(this.tools.keys());
  }

  unregister(name) {
    return this.tools.delete(name);
  }

  _validateTool(tool) {
    if (!tool || typeof tool.execute !== 'function') {
      throw new Error('Tool must have an execute method');
    }
  }
}
