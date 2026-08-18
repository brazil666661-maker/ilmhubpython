export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { code, stdin, timeoutMs, fileName, files } = req.body || {};

  if (typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      status: 'error',
      errorType: 'ValidationError',
      message: 'Field "code" must be a string',
      stdout: '',
      stderr: 'Field "code" must be a string',
      exitCode: 1,
      durationMs: 0,
    });
  }

  // If remote executor URL is provided in environment variables, proxy to it safely
  if (process.env.PYTHON_EXECUTOR_URL) {
    try {
      const remoteResp = await fetch(`${process.env.PYTHON_EXECUTOR_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin, timeoutMs, fileName, files }),
      });
      const remoteData = await remoteResp.json();
      return res.status(200).json(remoteData);
    } catch (proxyErr: any) {
      console.warn('Proxy to remote executor failed:', proxyErr.message);
    }
  }

  // Default response indicating execution runs client-side inside WebAssembly Worker
  return res.status(200).json({
    success: true,
    status: 'webassembly-runtime',
    stdout: '',
    stderr: '',
    exitCode: 0,
    durationMs: 0,
    message: 'Browser Pyodide WebAssembly runtime handles execution directly.',
  });
}
