/**
 * ToolLoader - Dynamic tool loading
 */

import { readdir } from 'fs/promises';
import { join } from 'path';

export class ToolLoader {
  constructor(registry) {
    this.registry = registry;
  }

  async loadFromDirectory(dirPath) {
    const files = await readdir(dirPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));

    for (const file of jsFiles) {
      await this.loadFromFile(join(dirPath, file));
    }
  }

  async loadFromFile(filePath) {
    const module = await import(filePath);
    const tool = module.default || module;

    if (tool.name && typeof tool.execute === 'function') {
      this.registry.register(tool.name, tool);
    }
  }

  async loadFromConfig(config) {
    for (const [name, toolConfig] of Object.entries(config.tools || {})) {
      if (toolConfig.path) {
        const module = await import(toolConfig.path);
        this.registry.register(name, module.default || module);
      }
    }
  }
}
