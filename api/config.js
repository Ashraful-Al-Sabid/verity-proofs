// Vercel Serverless Function: Public App Configuration & Auto Model Discovery
// Automatically discovers the fastest working Gemini model for the configured GEMINI_API_KEY.

let cachedDiscovery = {
  keySuffix: '',
  bestModel: '',
  availableModels: [],
  timestamp: 0
};

function scoreGeminiModelForSpeed(id) {
  let score = 0;
  // Prioritize ultra-low-latency flash-lite and flash models for instant interactive feedback
  if (id === 'gemini-2.5-flash-lite') score += 1000;
  else if (id === 'gemini-2.0-flash') score += 950;
  else if (id === 'gemini-2.0-flash-lite') score += 920;
  else if (id === 'gemini-1.5-flash') score += 880;
  else if (id === 'gemini-2.5-flash') score += 850;
  else if (id.includes('flash-lite') || id.includes('-lite')) score += 700;
  else if (id.includes('flash')) score += 600;
  else if (id.includes('pro')) score += 300;

  if (/exp|preview|\d{2}-\d{2}|\d{4}|001|002|8b/i.test(id)) score -= 50;
  if (id.endsWith('-latest')) score += 15;

  const verMatch = id.match(/gemini-(\d+(?:\.\d+)?)/);
  if (verMatch) {
    score += parseFloat(verMatch[1]) * 20;
  }
  return score;
}

async function discoverModelsForKey(apiKey) {
  if (!apiKey) return { bestModel: 'gemini-2.0-flash', availableModels: [] };

  const keySuffix = apiKey.slice(-6);
  const now = Date.now();
  if (
    cachedDiscovery.keySuffix === keySuffix &&
    cachedDiscovery.bestModel &&
    cachedDiscovery.availableModels.length > 0 &&
    now - cachedDiscovery.timestamp < 600000
  ) {
    return {
      bestModel: cachedDiscovery.bestModel,
      availableModels: cachedDiscovery.availableModels
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { method: 'GET', signal: controller.signal }
    );
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    const data = await res.json();
    const rawModels = (data && Array.isArray(data.models)) ? data.models : [];
    const usable = [];

    rawModels.forEach(m => {
      const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
      if (!methods.includes('generateContent')) return;
      const id = (m.name || '').replace(/^models\//, '');
      if (!id.startsWith('gemini-')) return;
      if (/embedding|imagen|veo|aqa|audio|tts|image|vision|robotics|computer-use|learnlm|thinking|live/i.test(id)) return;
      usable.push(id);
    });

    usable.sort((a, b) => scoreGeminiModelForSpeed(b) - scoreGeminiModelForSpeed(a));

    if (usable.length > 0) {
      cachedDiscovery = {
        keySuffix,
        bestModel: usable[0],
        availableModels: usable.slice(0, 8),
        timestamp: now
      };
      return {
        bestModel: cachedDiscovery.bestModel,
        availableModels: cachedDiscovery.availableModels
      };
    }
  } catch (_) {
    // Fallback to known fast defaults if discovery times out
  } finally {
    clearTimeout(timeoutId);
  }

  return {
    bestModel: 'gemini-2.0-flash',
    availableModels: ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash', 'gemini-2.5-flash']
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();

  const supabaseAnonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  const geminiApiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  const hasServerGemini = !!geminiApiKey;
  let bestModel = 'gemini-2.0-flash';
  let availableModels = [];

  if (hasServerGemini) {
    const discovered = await discoverModelsForKey(geminiApiKey);
    bestModel = discovered.bestModel;
    availableModels = discovered.availableModels;
  }

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    hasServerGemini,
    bestModel,
    availableModels
  });
}
