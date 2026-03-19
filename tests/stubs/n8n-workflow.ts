export class NodeApiError extends Error {
  constructor(_node: unknown, error: Record<string, unknown>) {
    super(String(error.message ?? 'Node API error'));
    this.name = 'NodeApiError';
  }
}

export class NodeOperationError extends Error {
  constructor(_node: unknown, message: string) {
    super(message);
    this.name = 'NodeOperationError';
  }
}
