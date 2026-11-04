import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_MODELS, filterGeminiModels, isSupportedGeminiModel, scoreGeminiModel } from '../src/lib/gemini-models.js';
import { validateEvaluation } from '../src/lib/evaluation-result.js';
import { coursesData } from '../src/data/courses.js';
import { stepMeta } from '../src/data/rubrics.js';
import { getGeminiApiKeys, hasFallbackAiKey, getFallbackAiProvider, getFallbackAiProviders } from '../src/lib/ai-config.js';

export { getGeminiApiKeys };
// Vercel Serverless Function: Ultra-Fast Multi-Key Gemini + Fallback AI Proof Evaluator

const FALLBACK_FAST_MODELS = DEFAULT_GEMINI_MODELS;

let cachedKeySuffix = '';
let cachedVerifiedModel = '';
let cachedAvailableModels = [];
let cachedTimestamp = 0;
let lastWorkingKey = '';
let cachedFallbackModelByKey = {};

function normalizeEvaluationPayload(evalResult, rubric) {
  if (!evalResult || typeof evalResult !== 'object') {
    throw new Error('Evaluation response is not a JSON object.');
  }
  const validStatuses = ['complete', 'needs-work', 'reconsider', 'incomplete', 'incorrect-claim'];
  if (!validStatuses.includes(evalResult.status)) {
    const rawStatus = String(evalResult.status || '').toLowerCase();
    if (/complete|correct|valid|proved|pass|success/.test(rawStatus)) {
      evalResult.status = 'complete';
    } else if (/reconsider|wrong|incorrect|false|contradict/.test(rawStatus)) {
      evalResult.status = 'reconsider';
    } else {
      evalResult.status = 'needs-work';
    }
  }

  for (const key of ['title', 'question', 'success', 'nudge']) {
    if (evalResult[key] == null) {
      delete evalResult[key];
    } else if (typeof evalResult[key] !== 'string') {
      evalResult[key] = Array.isArray(evalResult[key])
        ? evalResult[key].join(' ')
        : String(evalResult[key]);
    }
  }

  if (!Array.isArray(evalResult.established)) {
    evalResult.established = typeof evalResult.established === 'string' && evalResult.established.trim()
      ? [evalResult.established.trim()]
      : [];
  } else {
    evalResult.established = evalResult.established
      .map(item => (typeof item === 'string' ? item : item != null ? String(item) : ''))
      .filter(Boolean);
  }

  if (evalResult.status === 'complete' && (!evalResult.success || !evalResult.success.trim())) {
    evalResult.success =
      evalResult.established.join(' ') ||
      evalResult.title ||
      'Your deductive argument establishes all required invariants rigorously.';
  }

  const defaultTotal = Math.max(1, (rubric && Array.isArray(rubric.steps) ? rubric.steps.length : 1) + 1);
  const parsedTotal = Number(evalResult.total);
  const parsedDone = Number(evalResult.done);
  evalResult.total = Number.isFinite(parsedTotal) && parsedTotal >= 1
    ? Math.floor(parsedTotal)
    : Math.max(evalResult.established.length, defaultTotal);
  evalResult.done = Number.isFinite(parsedDone) && parsedDone >= 0
    ? Math.min(evalResult.total, Math.floor(parsedDone))
    : Math.min(evalResult.total, evalResult.established.length);

  return validateEvaluation(evalResult);
}

async function getDiscoveredModels(apiKey, clientModels) {
  const keySuffix = apiKey.slice(-6);
  const now = Date.now();

  if (
    cachedKeySuffix === keySuffix &&
    cachedAvailableModels.length > 0 &&
    now - cachedTimestamp < 600000
  ) {
    return cachedAvailableModels;
  }

  if (Array.isArray(clientModels) && clientModels.length > 0) {
    const validClient = filterGeminiModels(clientModels);
    if (validClient.length > 0) {
      cachedKeySuffix = keySuffix;
      cachedAvailableModels = validClient;
      cachedTimestamp = now;
      return cachedAvailableModels;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1800);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { method: 'GET', signal: controller.signal }
    );
    if (res.ok) {
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
        cachedKeySuffix = keySuffix;
        cachedAvailableModels = usable.slice(0, 6);
        cachedTimestamp = now;
        return cachedAvailableModels;
      }
    }
  } catch (_) {
    // Use fallback fast models if discovery fails
  } finally {
    clearTimeout(timeoutId);
  }

  return FALLBACK_FAST_MODELS;
}

function extractJsonObject(rawText) {
  let cleaned = String(rawText || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

function parseGeminiResponseJson(json, rubric, respondedModel) {
  const cand = json && json.candidates && json.candidates[0];
  if (!cand) {
    throw new Error('Gemini returned no candidates.');
  }
  const parts = (cand.content && Array.isArray(cand.content.parts)) ? cand.content.parts : [];
  const textPart = parts.find(p => typeof p.text === 'string' && p.text.includes('{')) || parts.find(p => typeof p.text === 'string');
  const rawText = textPart && textPart.text;
  if (!rawText) {
    throw new Error('Empty text content from Gemini.');
  }

  const evalResult = extractJsonObject(rawText);
  evalResult.engine = 'gemini';
  evalResult.modelName = respondedModel;
  evalResult.isServerHosted = true;
  return normalizeEvaluationPayload(evalResult, rubric);
}

function scoreFallbackModelId(id) {
  const lower = String(id || '').toLowerCase();
  if (/whisper|tts|guard|safeguard|embed|moderation|dall-e|audio|realtime|transcribe|playai|orpheus|vision|rerank|tool-use/i.test(lower)) {
    return -1000;
  }
  let score = 0;
  if (lower.includes('llama-3.3-70b')) score += 500;
  else if (lower.includes('llama-4')) score += 480;
  else if (lower.includes('gpt-oss-120b')) score += 470;
  else if (lower.includes('gpt-4o-mini') || lower.includes('gpt-4.1-mini')) score += 460;
  else if (lower.includes('qwen3-32b') || lower.includes('qwen-qwq')) score += 440;
  else if (lower.includes('llama-3.1-8b')) score += 420;
  else if (lower.includes('gpt-oss-20b')) score += 410;
  else if (lower.includes('llama')) score += 350;
  else if (lower.includes('gpt')) score += 340;
  else if (lower.includes('qwen') || lower.includes('deepseek') || lower.includes('gemma') || lower.includes('mixtral')) score += 300;
  if (lower.includes('versatile') || lower.includes('instruct') || lower.includes('instant')) score += 50;
  return score;
}

async function discoverProviderModels(modelsEndpoint, key) {
  if (!modelsEndpoint || !key) return [];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(modelsEndpoint, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` },
      signal: controller.signal
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rawList = Array.isArray(data?.data) ? data.data : [];
    const candidates = rawList
      .filter(m => m && typeof m.id === 'string' && m.active !== false)
      .map(m => m.id)
      .filter(id => scoreFallbackModelId(id) >= 0);
    candidates.sort((a, b) => scoreFallbackModelId(b) - scoreFallbackModelId(a));
    return candidates.slice(0, 4);
  } catch (_) {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callSingleFallbackModel(endpoint, key, model, promptText, rubric) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const makePost = async (useJsonFormat) => {
      const payload = {
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an Olympiad mathematics proof mentor. Respond ONLY with a valid JSON object.'
          },
          { role: 'user', content: promptText }
        ],
        temperature: 0.1,
        max_tokens: 1024
      };
      if (useJsonFormat) {
        payload.response_format = { type: 'json_object' };
      }
      return fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    };

    let res = await makePost(true);
    if (res.status === 400) {
      res = await makePost(false);
    }

    if (!res.ok) {
      const txt = await res.text();
      const err = new Error(`Fallback AI (${model}) HTTP ${res.status}: ${txt.slice(0, 150)}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from fallback AI.');

    const evalResult = extractJsonObject(content);
    evalResult.engine = 'ai';
    evalResult.modelName = model;
    evalResult.isServerHosted = true;
    return normalizeEvaluationPayload(evalResult, rubric);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function callFallbackAi(promptText, rubric) {
  const providers = getFallbackAiProviders();
  if (providers.length === 0) return null;

  const fallbackErrors = [];

  for (const fb of providers) {
    const keysToTry = Array.isArray(fb.allKeys) && fb.allKeys.length > 0 ? fb.allKeys : [fb.key];

    for (const key of keysToTry) {
      const keyId = key.slice(-6);
      const cachedModel = cachedFallbackModelByKey[keyId];
      const initialModels = cachedModel
        ? [cachedModel, ...fb.candidateModels.filter(m => m !== cachedModel)]
        : [...(fb.candidateModels || [fb.model])];

      // 1. Try the primary model first
      const firstModel = initialModels[0];
      try {
        const res = await callSingleFallbackModel(fb.endpoint, key, firstModel, promptText, rubric);
        cachedFallbackModelByKey[keyId] = firstModel;
        return res;
      } catch (firstErr) {
        fallbackErrors.push(firstErr.message);
        // If 401/403 invalid API key, move to next key immediately
        if (firstErr.status === 401 || firstErr.status === 403) {
          continue;
        }
      }

      // 2. Dynamically discover which models this key actually has access to via GET /models
      const discoveredModels = await discoverProviderModels(fb.modelsEndpoint, key);
      const remainingToTry = [
        ...discoveredModels.filter(m => m !== firstModel),
        ...initialModels.slice(1).filter(m => !discoveredModels.includes(m))
      ].slice(0, 3);

      for (const nextModel of remainingToTry) {
        try {
          const res = await callSingleFallbackModel(fb.endpoint, key, nextModel, promptText, rubric);
          cachedFallbackModelByKey[keyId] = nextModel;
          return res;
        } catch (err) {
          fallbackErrors.push(err.message);
          if (err.status === 401 || err.status === 403) break;
        }
      }
    }
  }

  throw new Error(fallbackErrors[0] || 'Fallback AI evaluation failed.');
}

async function callSingleModel(apiKey, modelName, promptText, rubric, timeoutMs = 4500) {
  if (!isSupportedGeminiModel(modelName)) throw new Error('Only Gemini 3 or newer text models are supported.');
  const useZeroThinking = /^gemini-3-flash/i.test(modelName);
  const genConfig = {
    temperature: 0.1,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
    ...(useZeroThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {})
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: genConfig
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Model ${modelName} HTTP ${response.status}`;
      try {
        const j = JSON.parse(errText);
        if (j.error && j.error.message) msg += `: ${j.error.message}`;
      } catch (_) {
        if (errText) msg += `: ${errText.slice(0, 200)}`;
      }
      const error = new Error(msg);
      error.status = response.status;
      error.modelName = modelName;
      throw error;
    }

    const json = await response.json();
    return parseGeminiResponseJson(json, rubric, modelName);
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Model ${modelName} timed out after ${timeoutMs}ms`);
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function evaluateWithKey(apiKey, cleanReq, promptText, rubric, availableModels, fastFail = false) {
  const discovered = await getDiscoveredModels(apiKey, availableModels);

  const candidates = [];
  if (cachedVerifiedModel && discovered.includes(cachedVerifiedModel) && !/^gemini-3\.[1-9]|-pro/i.test(cachedVerifiedModel)) {
    candidates.push(cachedVerifiedModel);
  }
  // Always ensure DEFAULT_GEMINI_MODEL ('gemini-3-flash-preview') is the primary candidate before any '-pro' or '3.x' model
  if (!candidates.includes(DEFAULT_GEMINI_MODEL)) {
    candidates.push(DEFAULT_GEMINI_MODEL);
  }
  if (cleanReq && isSupportedGeminiModel(cleanReq) && !/^gemini-3\.[1-9]|-pro/i.test(cleanReq) && !candidates.includes(cleanReq)) {
    candidates.push(cleanReq);
  }
  discovered.forEach(m => {
    if (!candidates.includes(m)) candidates.push(m);
  });
  FALLBACK_FAST_MODELS.forEach(m => {
    if (!candidates.includes(m)) candidates.push(m);
  });

  const maxModels = fastFail ? Math.min(2, candidates.length) : 3;
  const candidatesToTry = candidates.slice(0, maxModels);
  const primaryModel = candidatesToTry[0];
  const perCallTimeout = fastFail ? 3800 : 5000;

  let winningResult = null;
  const errors = [];

  try {
    winningResult = await callSingleModel(apiKey, primaryModel, promptText, rubric, perCallTimeout);
  } catch (primaryErr) {
    errors.push(primaryErr.message || String(primaryErr));
    if (cachedVerifiedModel === primaryModel) {
      cachedVerifiedModel = '';
    }
    // Only fast-fail the entire key if the non-pro primary model hit a real quota (>0) or auth error
    const isZeroLimitPro = /limit:\s*0\b/i.test(primaryErr.message || '') || primaryModel.includes('-pro');
    const isKeyQuotaOrAuth = !isZeroLimitPro && (
      primaryErr.status === 429 || primaryErr.status === 400 || primaryErr.status === 403 ||
      /quota|429|resource_exhausted|rate_limit|exceeded|api_key_invalid/i.test(primaryErr.message || '')
    );
    if (fastFail && isKeyQuotaOrAuth) {
      throw primaryErr;
    }

    for (let i = 1; i < candidatesToTry.length; i++) {
      const nextModel = candidatesToTry[i];
      try {
        winningResult = await callSingleModel(apiKey, nextModel, promptText, rubric, perCallTimeout);
        if (winningResult) break;
      } catch (failErr) {
        errors.push(failErr.message || String(failErr));
      }
    }
  }

  if (!winningResult) {
    throw new Error(errors[0] || 'All candidate Gemini models failed to evaluate the proof.');
  }

  cachedVerifiedModel = winningResult.modelName;
  winningResult.availableModels = discovered;
  return winningResult;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rawGeminiKeys = getGeminiApiKeys();
  const hasFallback = hasFallbackAiKey();

  if (rawGeminiKeys.length === 0 && !hasFallback) {
    return res.status(500).json({
      error: 'No AI API key is configured. Please set GEMINI_API_KEY, GEMINI_API_KEY_2, GROQ_API_KEY, or OPENAI_API_KEY in Vercel environment variables.',
      fallbackToLocal: false
    });
  }

  const geminiKeys = [...rawGeminiKeys];
  if (lastWorkingKey && geminiKeys.includes(lastWorkingKey) && geminiKeys[0] !== lastWorkingKey) {
    geminiKeys.splice(geminiKeys.indexOf(lastWorkingKey), 1);
    geminiKeys.unshift(lastWorkingKey);
  }

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}); }
  catch { return res.status(400).json({ error: 'Invalid JSON body.' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Expected a JSON object.' });
  }
  try {
    const { userText, cumulativeText, problem: requestedProblem, model, availableModels } = body;
    const problem = Object.values(coursesData).flatMap(course => course.problems).find(item => item.id === requestedProblem?.id);
    const rubric = problem && stepMeta[problem.id]?.rubric;

    if (typeof userText !== 'string' || !userText.trim() || userText.length > 20000 ||
      !problem || typeof problem.title !== 'string' || typeof problem.text !== 'string' ||
      (model != null && typeof model !== 'string') ||
      (cumulativeText != null && (typeof cumulativeText !== 'string' || cumulativeText.length > 100000))) {
      return res.status(400).json({ error: 'Missing required proof text or problem definition.' });
    }

    const sol = problem.curatedSolution || {};
    const canonicalSolution = typeof sol === 'string'
      ? sol
      : [sol.technique, sol.setup, sol.steps, sol.conclusion].filter(Boolean).join(' ');

    const expectedClaim = rubric
      ? (rubric.answer === 'yes' ? 'Affirmative / Yes (possible)' : rubric.answer === 'no' ? 'Negative / No (impossible)' : rubric.answer === 'value' ? 'Exact value' : 'Direct proof')
      : 'Rigorous deductive proof';
    const rubricSteps = rubric && rubric.steps
      ? rubric.steps.map((s, i) => (i + 1) + '. ' + s.label).join('; ')
      : 'Deductive mathematical argument';

    const promptText =
      "You are an elite Russian Mathematical Circles Olympiad mentor.\n" +
      "Assess student proof with Socratic rigor. NEVER reveal the solution, formula, or proof steps.\n" +
      "Problem: " + (problem.title || '') + "\n" +
      "Statement: " + (problem.text || '') + "\n" +
      "Target Claim: " + expectedClaim + "\n" +
      "Key Invariants: " + rubricSteps + "\n" +
      "Reference (DO NOT REVEAL): " + canonicalSolution + "\n\n" +
      "RULES:\n" +
      "- Contradictory/wrong claim: status='reconsider', ask them to test a minimal counterexample.\n" +
      "- Right direction with missing links: status='needs-work', list proven deductions in 'established', ask ONE sharp Socratic question in 'question'.\n" +
      "- Fully rigorous & complete: status='complete', explain why in 'success'.\n" +
      "Output strict JSON only:\n" +
      "{\"status\":\"complete\"|\"needs-work\"|\"reconsider\",\"title\":\"Short headline\",\"established\":[\"points\"],\"question\":\"question\",\"nudge\":\"hint\",\"success\":\"reason\",\"done\":1,\"total\":2}\n\n" +
      'STUDENT ATTEMPT:\n"""\n' + userText + '\n"""\n' +
      (cumulativeText && cumulativeText !== userText ? 'Prior draft context: ' + cumulativeText : '');

    const cleanReq = (model || '').replace(/^models\//, '').trim();
    const hasMultipleRoutes = geminiKeys.length > 1 || hasFallback;
    let winningResult = null;
    const errors = [];
    const startTime = Date.now();

    // 1. Try Gemini key(s), rotating immediately on error or quota exhaustion
    for (let i = 0; i < geminiKeys.length; i++) {
      if (i > 0 && hasFallback && (Date.now() - startTime) > 4500) {
        break;
      }
      const apiKey = geminiKeys[i];
      try {
        winningResult = await evaluateWithKey(apiKey, cleanReq, promptText, rubric, availableModels, hasMultipleRoutes);
        if (winningResult) {
          lastWorkingKey = apiKey;
          break;
        }
      } catch (keyErr) {
        errors.push(`Gemini key ${i + 1}: ${keyErr.message}`);
      }
    }

    // 2. Fallback to alternative provider (Groq / OpenAI / OpenRouter) if Gemini keys are exhausted or failed
    if (!winningResult && hasFallback) {
      try {
        winningResult = await callFallbackAi(promptText, rubric);
      } catch (fbErr) {
        errors.push(`Fallback AI: ${fbErr.message}`);
      }
    }

    if (!winningResult) {
      throw new Error(errors.join(' | ') || 'All AI evaluators failed.');
    }

    return res.status(200).json(winningResult);

  } catch (err) {
    console.error('Server Gemini evaluation error:', err.message);
    return res.status(500).json({
      error: err.message || 'Evaluation error',
      fallbackToLocal: false
    });
  }
}
