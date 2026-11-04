import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_MODELS, filterGeminiModels, isSupportedGeminiModel, scoreGeminiModel } from '../src/lib/gemini-models.js';
import { validateEvaluation } from '../src/lib/evaluation-result.js';
import { coursesData } from '../src/data/courses.js';
import { stepMeta } from '../src/data/rubrics.js';
import { getGeminiApiKeys, hasFallbackAiKey, getFallbackAiProvider } from '../src/lib/ai-config.js';

export { getGeminiApiKeys };
// Vercel Serverless Function: Ultra-Fast Gemini AI Proof Evaluator
// Automatically discovers the best/fastest available model for the API key, caches the winner,
// and uses hedged requests so proof evaluation completes in < 1 second.

const FALLBACK_FAST_MODELS = DEFAULT_GEMINI_MODELS;

let cachedKeySuffix = '';
let cachedVerifiedModel = '';
let cachedAvailableModels = [];
let cachedTimestamp = 0;


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
  const timeoutId = setTimeout(() => controller.abort(), 3000);
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

function parseGeminiResponseJson(json, rubric, respondedModel) {
  const cand = json && json.candidates && json.candidates[0];
  if (!cand) {
    throw new Error('Gemini returned no candidates.');
  }
  const rawText = cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text;
  if (!rawText) {
    throw new Error('Empty text content from Gemini.');
  }

  let cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const evalResult = JSON.parse(cleaned);
  if (!Array.isArray(evalResult.established)) evalResult.established = [];
  if (typeof evalResult.done !== 'number') evalResult.done = evalResult.established.length;
  if (typeof evalResult.total !== 'number') evalResult.total = Math.max(evalResult.done, (rubric && rubric.steps ? rubric.steps.length : 2) + 1);
  evalResult.engine = 'gemini';
  evalResult.modelName = respondedModel;
  evalResult.isServerHosted = true;
  return validateEvaluation(evalResult);
}

export async function callFallbackAi(promptText, rubric) {
  const fb = getFallbackAiProvider();
  if (!fb) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(fb.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fb.key}`
      },
      body: JSON.stringify({
        model: fb.model,
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Fallback AI (${fb.model}) HTTP ${res.status}: ${txt.slice(0, 150)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty response from fallback AI.');

    let cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    const evalResult = JSON.parse(cleaned);
    if (!Array.isArray(evalResult.established)) evalResult.established = [];
    if (typeof evalResult.done !== 'number') evalResult.done = evalResult.established.length;
    if (typeof evalResult.total !== 'number') evalResult.total = Math.max(evalResult.done, (rubric?.steps ? rubric.steps.length : 2) + 1);
    evalResult.engine = 'ai';
    evalResult.modelName = fb.model;
    evalResult.isServerHosted = true;
    return validateEvaluation(evalResult);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function evaluateWithKey(apiKey, cleanReq, promptText, rubric, availableModels) {
  const discovered = await getDiscoveredModels(apiKey, availableModels);

  const candidates = [];
  if (cachedVerifiedModel && discovered.includes(cachedVerifiedModel)) {
    candidates.push(cachedVerifiedModel);
  }
  if (cleanReq && isSupportedGeminiModel(cleanReq) && !candidates.includes(cleanReq)) {
    candidates.push(cleanReq);
  }
  discovered.forEach(m => {
    if (!candidates.includes(m)) candidates.push(m);
  });
  FALLBACK_FAST_MODELS.forEach(m => {
    if (!candidates.includes(m)) candidates.push(m);
  });

  const candidatesToTry = candidates.slice(0, 6);
  const primaryModel = candidatesToTry[0];
  const secondaryModel = candidatesToTry[1] || primaryModel;

  let winningResult = null;
  const errors = [];

  try {
    winningResult = await new Promise((resolve, reject) => {
      let settled = false;
      let hedgeTimer = null;
      let activeCount = 1;
      const hedgeErrors = [];

      function handleSuccess(resObj) {
        if (settled) return;
        settled = true;
        if (hedgeTimer) clearTimeout(hedgeTimer);
        resolve(resObj);
      }

      function handleError(err, isPrimary) {
        hedgeErrors.push(err);
        if (isPrimary && hedgeTimer) {
          clearTimeout(hedgeTimer);
          hedgeTimer = null;
          launchSecondary();
        }
        activeCount--;
        if (activeCount === 0 && !settled) {
          settled = true;
          reject(hedgeErrors[0] || new Error('Primary and secondary models failed.'));
        }
      }

      let secondaryLaunched = false;
      function launchSecondary() {
        if (secondaryLaunched || settled || !secondaryModel || secondaryModel === primaryModel) return;
        secondaryLaunched = true;
        activeCount++;
        callSingleModel(apiKey, secondaryModel, promptText, rubric)
          .then(handleSuccess)
          .catch(e => handleError(e, false));
      }

      hedgeTimer = setTimeout(launchSecondary, 1200);

      callSingleModel(apiKey, primaryModel, promptText, rubric)
        .then(handleSuccess)
        .catch(e => handleError(e, true));
    });
  } catch (topErr) {
    errors.push(topErr.message || String(topErr));
    if (cachedVerifiedModel === primaryModel || cachedVerifiedModel === secondaryModel) {
      cachedVerifiedModel = '';
    }
    for (let i = 2; i < candidatesToTry.length; i++) {
      const nextModel = candidatesToTry[i];
      try {
        winningResult = await callSingleModel(apiKey, nextModel, promptText, rubric);
        if (winningResult) break;
      } catch (failErr) {
        errors.push(failErr.message || String(failErr));
      }
    }
    if (!winningResult) {
      throw new Error(errors[0] || 'All candidate Gemini models failed to evaluate the proof.');
    }
  }

  cachedVerifiedModel = winningResult.modelName;
  winningResult.availableModels = discovered;
  return winningResult;
}

async function callSingleModel(apiKey, modelName, promptText, rubric) {
  if (!isSupportedGeminiModel(modelName)) throw new Error('Only Gemini 3 or newer text models are supported.');
  const genConfig = {
    temperature: 0.1,
    maxOutputTokens: 1500,
    responseMimeType: 'application/json'
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

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
  } finally {
    clearTimeout(timeoutId);
  }
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

  const geminiKeys = getGeminiApiKeys();
  const hasFallback = hasFallbackAiKey();

  if (geminiKeys.length === 0 && !hasFallback) {
    return res.status(500).json({
      error: 'No AI API key is configured. Please set GEMINI_API_KEY, GEMINI_API_KEY_2, GROQ_API_KEY, or OPENAI_API_KEY in Vercel environment variables.',
      fallbackToLocal: false
    });
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
    let winningResult = null;
    const errors = [];

    // 1. Try Gemini key(s), rotating to next key if 429 quota or 503 error occurs
    for (let i = 0; i < geminiKeys.length; i++) {
      const apiKey = geminiKeys[i];
      try {
        winningResult = await evaluateWithKey(apiKey, cleanReq, promptText, rubric, availableModels);
        if (winningResult) break;
      } catch (keyErr) {
        errors.push(`Gemini key ${i + 1}: ${keyErr.message}`);
        if (i < geminiKeys.length - 1 && (/quota|429|resource_exhausted|rate_limit|exceeded|503/i.test(keyErr.message) || keyErr.status === 429 || keyErr.status === 503)) {
          continue;
        }
        if (geminiKeys.length === 1 && !hasFallback) {
          throw keyErr;
        }
      }
    }

    // 2. Fallback to alternative provider (Groq / OpenAI / OpenRouter) if Gemini keys are exhausted
    if (!winningResult && hasFallback) {
      try {
        winningResult = await callFallbackAi(promptText, rubric);
      } catch (fbErr) {
        errors.push(`Fallback AI: ${fbErr.message}`);
      }
    }

    if (!winningResult) {
      throw new Error(errors[0] || 'All AI evaluators failed.');
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
