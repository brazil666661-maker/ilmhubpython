export function sanitizePythonCode(source: string): string {
  if (typeof source !== 'string') return '';

  return source
    .replace(/\uFEFF/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u1680\u2000-\u200A\u202F\u205F\u3000\u200B-\u200D\u2060\u2028\u2029]/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}
