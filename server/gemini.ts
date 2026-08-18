import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface FixCodeRequest {
  code: string;
  error: {
    type?: string;
    message?: string;
    line?: number;
    traceback?: string;
  };
  language?: string;
}

export interface ExplainCodeRequest {
  code: string;
  selectedCode?: string;
  language?: string;
}

export interface GenerateCodeRequest {
  prompt: string;
  language?: string;
}

export interface ReviewCodeRequest {
  code: string;
  language?: string;
}

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  currentCode?: string;
  currentError?: string;
  language?: string;
  model?: string;
  thinking?: boolean;
  searchGrounding?: boolean;
}

function getLanguageInstruction(lang = 'en'): string {
  switch (lang) {
    case 'uz':
      return 'Barcha tushuntirish va matnlarni sof, tushunarli o‘zbek tilida (lotin alifbosida) taqdim eting.';
    case 'uz-cyrl':
      return 'Барча тушунтириш ва матнларни соф, тушунарли ўзбек тилида (кирилл алифбосида) тақдим этинг.';
    case 'ru':
      return 'Предоставляйте все объяснения и тексты на чистом, понятном русском языке.';
    default:
      return 'Provide all explanations and guidance in clear, beginner-friendly English.';
  }
}

export async function explainPythonCode(req: ExplainCodeRequest) {
  const ai = getAIClient();
  const langPrompt = getLanguageInstruction(req.language);
  const targetCode = req.selectedCode || req.code;

  const prompt = `You are ILMHUB's expert Python Coding Assistant.
${langPrompt}

Analyze and explain the following Python code in an intuitive, beginner-friendly way:

\`\`\`python
${targetCode}
\`\`\`

Return a valid JSON object matching this schema:
{
  "overview": "Clear 1-3 sentence summary of what this code achieves",
  "lineByLine": [
    { "line": "1-2", "explanation": "What this line or block does" }
  ],
  "potentialIssues": ["Any edge cases or common bugs to be aware of"],
  "improvements": ["Practical ways to optimize or write cleaner Pythonic code"]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Explain AI error:', error);
    return {
      overview: 'Could not generate explanation at this moment. ' + (error?.message || ''),
      lineByLine: [],
      potentialIssues: [],
      improvements: [],
    };
  }
}

export async function fixPythonError(req: FixCodeRequest) {
  const ai = getAIClient();
  const langPrompt = getLanguageInstruction(req.language);

  const prompt = `You are ILMHUB's intelligent Python debugger and code fixer.
${langPrompt}

The user's Python code produced an error.
Error Type: ${req.error.type || 'Unknown'}
Error Line: ${req.error.line || 'Unknown'}
Error Message: ${req.error.message || ''}
Traceback:
${req.error.traceback || ''}

Code:
\`\`\`python
${req.code}
\`\`\`

Diagnose the exact root cause, explain it simply, and fix the code completely so it runs cleanly without errors.
Return ONLY a valid JSON object matching this schema:
{
  "explanation": "Clear, simple explanation of why the error happened and how it is fixed.",
  "error_type": "${req.error.type || 'Error'}",
  "fixed_code": "The complete, corrected, runnable Python code",
  "changes": ["Bullet point list of exact changes made to fix the code"]
} `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Fix AI error with Gemini 3.1 Pro:', error);
    // Fallback to flash if pro is unavailable
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      return JSON.parse(fallbackResponse.text || '{}');
    } catch (fallbackErr: any) {
      return {
        explanation: 'AI fixing service encountered an issue: ' + (fallbackErr?.message || ''),
        error_type: req.error.type || 'Error',
        fixed_code: req.code,
        changes: ['Unable to produce fix automatically.'],
      };
    }
  }
}

export async function generatePythonCode(req: GenerateCodeRequest) {
  const ai = getAIClient();
  const langPrompt = getLanguageInstruction(req.language);

  const prompt = `You are ILMHUB's Python generator.
${langPrompt}

The user wants to generate Python code for:
"${req.prompt}"

Write clean, modern, well-commented Python 3 code with example usage.
Return a valid JSON object matching this schema:
{
  "code": "The complete runnable Python code",
  "explanation": "How the code works and how to run it",
  "usageExample": "Sample expected output or how to test it"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Generate AI error:', error);
    return {
      code: `# Error generating code\n# ${error?.message || 'Please try again'}`,
      explanation: error?.message || 'Could not generate code.',
      usageExample: '',
    };
  }
}

export async function reviewPythonCode(req: ReviewCodeRequest) {
  const ai = getAIClient();
  const langPrompt = getLanguageInstruction(req.language);

  const prompt = `You are ILMHUB's senior Python code reviewer.
${langPrompt}

Perform a thorough code review for:
\`\`\`python
${req.code}
\`\`\`

Evaluate PEP 8 style, time/space complexity, readability, typing, and potential bugs.
Return a valid JSON object matching this schema:
{
  "score": 85, // integer from 0 to 100
  "summary": "High-level summary of code quality and structure",
  "suggestions": [
    {
      "line": 4,
      "issue": "Description of the problem or PEP 8 violation",
      "fix": "How to write it better",
      "severity": "warning" // "info", "warning", or "error"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error: any) {
    console.error('Review AI error:', error);
    return {
      score: 70,
      summary: 'Code review failed: ' + (error?.message || ''),
      suggestions: [],
    };
  }
}

export async function chatWithAI(req: ChatRequest) {
  const ai = getAIClient();
  const langPrompt = getLanguageInstruction(req.language);

  // Model selection based on user settings / parameters
  let selectedModel = req.model || 'gemini-3.7-flash';
  if (selectedModel !== 'gemini-3.1-pro-preview' && selectedModel !== 'gemini-3.1-flash-lite' && selectedModel !== 'gemini-3.7-flash') {
    selectedModel = 'gemini-3.7-flash';
  }

  const systemInstruction = `You are ILMHUB AI, an online Python coding mentor, debugger, and assistant.
${langPrompt}
You help programmers write, debug, understand, and optimize Python code.
When writing code, always format Python blocks nicely with \`\`\`python ... \`\`\`.
Keep responses structured, concise, and helpful.
Current Editor Code:
\`\`\`python
${req.currentCode || '# No code in editor'}
\`\`\`
${req.currentError ? `Current Execution Error: ${req.currentError}` : ''}`;

  const contents = req.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const config: any = {
    systemInstruction,
  };

  // Thinking level configuration for gemini-3.1-pro-preview
  if (selectedModel === 'gemini-3.1-pro-preview' || req.thinking) {
    selectedModel = 'gemini-3.1-pro-preview';
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  // Google Search grounding for gemini-3.7-flash
  if (req.searchGrounding && selectedModel === 'gemini-3.7-flash') {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config,
    });

    const replyText = response.text || '';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls = groundingChunks
      ?.map((c: any) => (c.web ? { title: c.web.title, uri: c.web.uri } : null))
      .filter(Boolean) || [];

    return {
      content: replyText,
      modelUsed: selectedModel,
      groundingUrls: urls,
    };
  } catch (error: any) {
    console.error('Chat AI error:', error);
    return {
      content: `Sorry, I encountered an issue connecting to the AI service: ${error?.message || 'Please try again.'}`,
      modelUsed: selectedModel,
      groundingUrls: [],
    };
  }
}
