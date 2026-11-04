// AI Configuration & Multi-Key / Multi-Provider Provider Support

export function getGeminiApiKeys() {
  const envVars = [
    process.env.GEMINI_API_KEYS,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GOOGLE_GEMINI_API_KEY,
    process.env.GOOGLE_GEMINI_API_KEY_2
  ];
  const keys = [];
  envVars.forEach(val => {
    if (typeof val === 'string' && val.trim()) {
      val.split(/[,;\n]/).forEach(k => {
        const clean = k.trim().replace(/^["']|["']$/g, '').trim();
        if (clean && !keys.includes(clean)) keys.push(clean);
      });
    }
  });
  return keys;
}

export function hasFallbackAiKey() {
  const groqKey = (process.env.GROQ_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const openAiKey = (process.env.OPENAI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  return !!(groqKey || openAiKey || openRouterKey);
}

export function getFallbackAiProvider() {
  const groqKey = (process.env.GROQ_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const openAiKey = (process.env.OPENAI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const openRouterKey = (process.env.OPENROUTER_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (groqKey) {
    return {
      provider: 'groq',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKey,
      model: 'llama-3.3-70b-versatile'
    };
  }
  if (openAiKey) {
    return {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      key: openAiKey,
      model: 'gpt-4o-mini'
    };
  }
  if (openRouterKey) {
    return {
      provider: 'openrouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKey,
      model: 'meta-llama/llama-3.3-70b-instruct'
    };
  }
  return null;
}

