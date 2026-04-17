/**
 * ExecutionContext - Track execution state and metadata
 */

export class ExecutionContext {
  constructor(data) {
    this.toolName = data.toolName;
    this.params = data.params;
    this.startTime = Date.now();
    this.endTime = null;
    this.status = 'pending';
    this.result = null;
    this.error = null;
    this.metadata = data.metadata || {};
  }

  complete(result) {
    this.endTime = Date.now();
    this.status = 'completed';
    this.result = result;
  }

  fail(error) {
    this.endTime = Date.now();
    this.status = 'failed';
    this.error = error;
  }

  getDuration() {
    return this.endTime ? this.endTime - this.startTime : null;
  }

  toJSON() {
    return {
      toolName: this.toolName,
      status: this.status,
      duration: this.getDuration(),
      result: this.result,
      error: this.error?.message
    };
  }
}
