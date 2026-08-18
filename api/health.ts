export default function handler(req: any, res: any) {
  res.status(200).json({
    ok: true,
    service: 'ilmhub-api',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}
