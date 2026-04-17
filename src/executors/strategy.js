/**
 * ExecutionStrategy - Different execution patterns
 */

export class ExecutionStrategy {
  static async sequential(executor, tasks) {
    const results = [];
    for (const task of tasks) {
      const result = await executor.execute(task.tool, task.params);
      results.push(result);
    }
    return results;
  }

  static async parallel(executor, tasks) {
    const promises = tasks.map(task =>
      executor.execute(task.tool, task.params)
    );
    return Promise.all(promises);
  }

  static async parallelSettled(executor, tasks) {
    const promises = tasks.map(task =>
      executor.execute(task.tool, task.params)
    );
    return Promise.allSettled(promises);
  }

  static async batch(executor, tasks, batchSize = 5) {
    const results = [];
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchResults = await ExecutionStrategy.parallel(executor, batch);
      results.push(...batchResults);
    }
    return results;
  }
}
