// AI Configuration & Multi-Key / Multi-Provider Support

function splitKeys(val) {
  if (typeof val !== 'string' || !val.trim()) return [];
  return val
    .split(/[,;\n]/)
    .map(k => k.trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

export function getGeminiApiKeys() {
  const priorityVars = [
    process.env.GEMINI_API_KEYS,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GOOGLE_GEMINI_API_KEY,
    process.env.GOOGLE_GEMINI_API_KEY_2,
    process.env.GOOGLE_API_KEY
  ];

  const keys = [];
  const addKey = (clean) => {
    if (!clean || keys.includes(clean)) return;
    // Exclude keys that are clearly Groq (gsk_) or OpenAI/OpenRouter (sk-) keys
    if (/^(gsk_|sk-)/i.test(clean)) return;
    keys.push(clean);
  };

  priorityVars.forEach(val => {
    splitKeys(val).forEach(addKey);
  });

  // Also scan process.env for any custom-named GEMINI key variable (e.g. GEMINI_KEY_2, VITE_GEMINI_API_KEY, etc.)
  for (const [envName, envVal] of Object.entries(process.env || {})) {
    if (/gemini|google_ai/i.test(envName) && !/model|url/i.test(envName)) {
      splitKeys(envVal).forEach(addKey);
    }
  }

  return keys;
}

function extractFallbackKeys() {
  const groqKeys = [];
  const openAiKeys = [];
  const openRouterKeys = [];

  const addUnique = (arr, k) => {
    if (k && !arr.includes(k)) arr.push(k);
  };

  const groqVars = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEYS,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_KEY,
    process.env.VITE_GROQ_API_KEY
  ];
  groqVars.forEach(v => splitKeys(v).forEach(k => addUnique(groqKeys, k)));

  const openAiVars = [
    process.env.OPENAI_API_KEY,
    process.env.OPENAI_KEY,
    process.env.VITE_OPENAI_API_KEY
  ];
  openAiVars.forEach(v => splitKeys(v).forEach(k => addUnique(openAiKeys, k)));

  const openRouterVars = [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_KEY,
    process.env.VITE_OPENROUTER_API_KEY
  ];
  openRouterVars.forEach(v => splitKeys(v).forEach(k => addUnique(openRouterKeys, k)));

  // Scan process.env for any custom-named GROQ / OPENAI / OPENROUTER variables or misplaced gsk_ keys
  for (const [envName, envVal] of Object.entries(process.env || {})) {
    if (/groq/i.test(envName) && !/model|url/i.test(envName)) {
      splitKeys(envVal).forEach(k => addUnique(groqKeys, k));
    } else if (/openrouter/i.test(envName) && !/model|url/i.test(envName)) {
      splitKeys(envVal).forEach(k => addUnique(openRouterKeys, k));
    } else if (/openai/i.test(envName) && !/model|url/i.test(envName)) {
      splitKeys(envVal).forEach(k => addUnique(openAiKeys, k));
    } else if (/gemini|api_key/i.test(envName)) {
      splitKeys(envVal).forEach(k => {
        if (/^gsk_/i.test(k)) addUnique(groqKeys, k);
        else if (/^sk-or-/i.test(k)) addUnique(openRouterKeys, k);
      });
    }
  }

  return { groqKeys, openAiKeys, openRouterKeys };
}

export function hasFallbackAiKey() {
  const { groqKeys, openAiKeys, openRouterKeys } = extractFallbackKeys();
  return groqKeys.length > 0 || openAiKeys.length > 0 || openRouterKeys.length > 0;
}

export function getFallbackAiProvider() {
  const { groqKeys, openAiKeys, openRouterKeys } = extractFallbackKeys();

  if (groqKeys.length > 0) {
    return {
      provider: 'groq',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      key: groqKeys[0],
      allKeys: groqKeys,
      model: 'llama-3.3-70b-versatile',
      backupModel: 'llama-3.1-8b-instant'
    };
  }
  if (openAiKeys.length > 0) {
    return {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      key: openAiKeys[0],
      allKeys: openAiKeys,
      model: 'gpt-4o-mini'
    };
  }
  if (openRouterKeys.length > 0) {
    return {
      provider: 'openrouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      key: openRouterKeys[0],
      allKeys: openRouterKeys,
      model: 'meta-llama/llama-3.3-70b-instruct'
    };
  }
  return null;
}
