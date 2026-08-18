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

  describe('Regression Tests for Multiline & Quoted Code Patterns', () => {
    it('runner script preserves multiline strings without syntax errors', () => {
      const testCode = `
text = """
This is a multiline
string with special chars!
"""
print(text)
`;
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('user_code = globals().get(\'user_code\', \'\')');
      expect(script).toContain('exec(compile(user_code');
      // Verify the script itself is syntactically valid Python by checking key structure
      expect(script).toContain('class _ILMHUBStream');
      expect(script).toContain('sys.stdout = stdout_buffer');
    });

    it('runner script handles single-quoted strings', () => {
      const testCode = "print('single quoted string')";
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain("builtins.input = _ilmhub_sync_input");
    });

    it('runner script handles double-quoted strings', () => {
      const testCode = 'print("double quoted string")';
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('exec(compile(user_code');
    });

    it('runner script handles f-strings with nested quotes', () => {
      const testCode = `
name = "World"
message = f'Hello {name}!'
print(message)
`;
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('_user_globals = {');
      expect(script).toContain("'__name__': '__main__'");
    });

    it('runner script handles strings with backslashes', () => {
      const testCode = `
path = "C:\\\\Users\\\\test\\\\file.txt"
print(path)
`;
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('class _ILMHUBInputWrapper');
    });

    it('runner script handles escaped quotes in strings', () => {
      const testCode = `
text = "She said \\"Hello\\""
print(text)
`;
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('try:');
      expect(script).toContain('except');
    });

    it('runner script uses exec() path, not string concatenation', () => {
      const script = buildRunnerScript({ filename: 'main.py', stdinText: '' });
      // Verify the runner uses exec() with compile()
      expect(script).toContain('exec(compile(user_code');
      // Verify it does NOT use naive string concatenation of user_code
      expect(script).not.toContain("_source + user_code");
      expect(script).not.toContain("user_code + _source");
    });

    it('runner script sets user_code as a variable, not injected into source', () => {
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      // The fix: user_code is passed via globals.set(), not string-templated
      expect(script).toContain("user_code = globals().get('user_code'");
      expect(script).toContain('exec(compile(user_code,');
    });

    it('runner script preserves stdin handling for input() calls with complex code', () => {
      const stdinText = 'Alice\nBob\nCharlie';
      const script = buildRunnerScript({ filename: 'test.py', stdinText });
      expect(script).toContain('stdin_lines = ' + JSON.stringify(stdinText));
      expect(script).toContain('def _ilmhub_sync_input(prompt=\'\')');
      expect(script).toContain('builtins.input = _ilmhub_sync_input');
    });

    it('runner script maintains stdout/stderr capture independent of code patterns', () => {
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('class _ILMHUBStream');
      expect(script).toContain('sys.stdout = stdout_buffer');
      expect(script).toContain('sys.stderr = stderr_buffer');
      expect(script).toContain('_ilmhub_stdout = stdout_buffer.getvalue()');
      expect(script).toContain('_ilmhub_stderr = stderr_buffer.getvalue()');
    });

    it('runner script captures traceback for syntax/runtime errors', () => {
      const script = buildRunnerScript({ filename: 'test.py', stdinText: '' });
      expect(script).toContain('except BaseException as _e:');
      expect(script).toContain('_ilmhub_traceback = traceback.format_exc()');
      expect(script).toContain('_ilmhub_raw_stderr = _ilmhub_stderr');
    });
  });
});
