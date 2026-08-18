import { describe, it, expect } from 'vitest';
import { parsePythonTraceback } from '../src/utils/errorParser';

describe('Python Traceback & Error Parser', () => {
  it('parses SyntaxError accurately with line number', () => {
    const traceback = `  File "main.py", line 3
    print("Hello"
                 ^
SyntaxError: '(' was never closed`;
    const parsed = parsePythonTraceback(traceback, 'main.py', 'en');
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('SyntaxError');
    expect(parsed?.line).toBe(3);
    expect(parsed?.message).toContain("'(' was never closed");
  });

  it('parses NameError accurately', () => {
    const traceback = `Traceback (most recent call last):
  File "main.py", line 5, in <module>
    print(unknown_var)
NameError: name 'unknown_var' is not defined`;
    const parsed = parsePythonTraceback(traceback, 'main.py', 'en');
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('NameError');
    expect(parsed?.line).toBe(5);
    expect(parsed?.message).toContain("name 'unknown_var' is not defined");
    expect(parsed?.simpleExplanation).toContain('could not find the variable or function');
  });

  it('parses ZeroDivisionError accurately', () => {
    const traceback = `Traceback (most recent call last):
  File "main.py", line 2, in <module>
    x = 10 / 0
ZeroDivisionError: division by zero`;
    const parsed = parsePythonTraceback(traceback, 'main.py', 'en');
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('ZeroDivisionError');
    expect(parsed?.line).toBe(2);
    expect(parsed?.message).toBe('division by zero');
  });

  it('parses IndentationError correctly', () => {
    const traceback = `  File "main.py", line 4
    print("bad indent")
IndentationError: unexpected indent`;
    const parsed = parsePythonTraceback(traceback, 'main.py', 'uz');
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('IndentationError');
    expect(parsed?.line).toBe(4);
    expect(parsed?.simpleExplanation).toContain('surilish');
  });

  it('parses multi-file import errors with target filename', () => {
    const traceback = `Traceback (most recent call last):
  File "main.py", line 1, in <module>
    from utils import divide
  File "utils.py", line 2, in divide
    return a / b
ZeroDivisionError: division by zero`;
    const parsed = parsePythonTraceback(traceback, 'main.py', 'en');
    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('ZeroDivisionError');
    expect(parsed?.file).toBe('utils.py');
    expect(parsed?.line).toBe(2);
  });
});
