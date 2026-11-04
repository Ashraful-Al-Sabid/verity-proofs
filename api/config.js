import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_MODELS, isSupportedGeminiModel, scoreGeminiModel } from '../src/lib/gemini-models.js';
import { sanitizeSupabaseConfig } from '../src/lib/supabase-config.js';
import { getGeminiApiKeys, hasFallbackAiKey, getFallbackAiProvider } from '../src/lib/ai-config.js';
// Vercel Serverless Function: Public App Configuration & Auto Model Discovery
// Automatically discovers the fastest working Gemini model for the configured GEMINI_API_KEY.

let cachedDiscovery = {
  keySuffix: '',
  bestModel: '',
  availableModels: [],
  timestamp: 0
};


async function discoverModelsForKey(apiKey) {
  if (!apiKey) return { bestModel: DEFAULT_GEMINI_MODEL, availableModels: [] };

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
      if (!isSupportedGeminiModel(id)) return;
      if (/embedding|imagen|veo|aqa|audio|tts|image|vision|robotics|computer-use|learnlm|thinking|live/i.test(id)) return;
      usable.push(id);
    });

    usable.sort((a, b) => scoreGeminiModel(b) - scoreGeminiModel(a));

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
    bestModel: DEFAULT_GEMINI_MODEL,
    availableModels: DEFAULT_GEMINI_MODELS
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawSupabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  );

  const rawSupabaseKey = (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  );

  const { url: supabaseUrl, key: supabaseAnonKey } = sanitizeSupabaseConfig(rawSupabaseUrl, rawSupabaseKey);

  const geminiKeys = getGeminiApiKeys();
  const hasFallback = hasFallbackAiKey();
  const hasServerGemini = geminiKeys.length > 0 || hasFallback;
  let bestModel = DEFAULT_GEMINI_MODEL;
  let availableModels = [];

  if (geminiKeys.length > 0) {
    const discovered = await discoverModelsForKey(geminiKeys[0]);
    bestModel = discovered.bestModel;
    availableModels = discovered.availableModels;
  } else if (hasFallback) {
    const fb = getFallbackAiProvider();
    if (fb) {
      bestModel = fb.model;
      availableModels = [fb.model];
    }
  }

  return res.status(200).json({
    supabaseUrl,
    supabaseAnonKey,
    hasServerGemini,
    bestModel,
    availableModels
  });
}
