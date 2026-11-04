// Only explicitly versioned Gemini 3+ text models may receive requests.
// Unversioned aliases are excluded because they can resolve to older models.
export const DEFAULT_GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3-flash-preview'];
export const DEFAULT_GEMINI_MODEL = DEFAULT_GEMINI_MODELS[0];

export function normalizeGeminiModel(value) {
  return typeof value === 'string' ? value.trim().replace(/^models\//, '') : '';
}

export function isSupportedGeminiModel(value) {
  const id = normalizeGeminiModel(value);
  const version = id.match(/^gemini-(\d+)(?:\.(\d+))?-(?:flash|pro)(?:-[a-z0-9]+)*$/);
  return !!version && Number(version[1]) >= 3 &&
    !/embedding|audio|tts|image|vision|robotics|computer-use|thinking|live/i.test(id);
}

export function scoreGeminiModel(value) {
  const id = normalizeGeminiModel(value);
  if (!isSupportedGeminiModel(id)) return -Infinity;
  const [, major, minor = '0'] = id.match(/^gemini-(\d+)(?:\.(\d+))?/);
  return Number(major) * 1000000 + Number(minor) * 10000 +
    (id.includes('flash-lite') ? 700 : id.includes('flash') ? 600 : 300) -
    (/exp|preview/.test(id) ? 50 : 0);
}

export function filterGeminiModels(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map(normalizeGeminiModel).filter(isSupportedGeminiModel))]
    .sort((a, b) => scoreGeminiModel(b) - scoreGeminiModel(a));
}
