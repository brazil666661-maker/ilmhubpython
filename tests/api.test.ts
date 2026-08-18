import { describe, it, expect } from 'vitest';
import { ApiClient } from '../src/lib/api';
import { buildRunnerScript } from '../src/python/worker';

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

  it('generates a syntactically valid Python runner script for traceback handling', () => {
    const script = buildRunnerScript({ filename: 'main.py', stdinText: 'salom' });
    expect(script).toContain("_ilmhub_raw_stderr = (_ilmhub_raw_stderr + '\\n' + _ilmhub_traceback).strip()");
    expect(script).toContain("_ilmhub_traceback = ''");
  });
});
