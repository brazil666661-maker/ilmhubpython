import { describe, it, expect } from 'vitest';
import { ApiClient } from '../src/lib/api';

describe('ILMHUB API Client and Contract Tests', () => {
  it('handles client-side Pyodide execution fallback cleanly', async () => {
    // When called in Node/test environment, ApiClient gracefully handles without throwing uncaught exceptions
    const result = await ApiClient.executePython({
      code: 'print("Hello Test")',
      filename: 'main.py',
    });
    expect(result).toBeDefined();
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.execution_time).toBe('number');
  });

  it('handles execution stop request gracefully', async () => {
    const cancelled = await ApiClient.stopExecution('test_proc');
    expect(typeof cancelled).toBe('boolean');
  });
});
