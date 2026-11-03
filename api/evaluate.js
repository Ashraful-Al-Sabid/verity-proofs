// Vercel Serverless Function: Ultra-Fast Gemini AI Proof Evaluator
// Automatically discovers the best/fastest available model for the API key, caches the winner,
// and uses hedged requests so proof evaluation completes in < 1 second.

const FALLBACK_FAST_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.5-flash'
];

let cachedKeySuffix = '';
let cachedVerifiedModel = '';
let cachedAvailableModels = [];
let cachedTimestamp = 0;

function scoreModelSpeed(id) {
  let score = 0;
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
  if (verMatch) score += parseFloat(verMatch[1]) * 20;
  return score;
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
    const validClient = clientModels
      .map(m => String(m).replace(/^models\//, '').trim())
      .filter(m => m.startsWith('gemini-') && !/3\.5|3\.6|3\.8/.test(m));
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
        if (!id.startsWith('gemini-')) return;
        if (/embedding|imagen|veo|aqa|audio|tts|image|vision|robotics|computer-use|learnlm|thinking|live/i.test(id)) return;
        usable.push(id);
      });
      usable.sort((a, b) => scoreModelSpeed(b) - scoreModelSpeed(a));
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
  return evalResult;
}

async function callSingleModel(apiKey, modelName, promptText, rubric) {
  const genConfig = {
    temperature: 0.1,
    maxOutputTokens: 350,
    responseMimeType: 'application/json'
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      throw new Error(`Model ${modelName} HTTP ${response.status}: ${errText}`);
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

  const apiKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server GEMINI_API_KEY is not configured in Vercel environment variables.',
      fallbackToLocal: true
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { userText, cumulativeText, problem, rubric, model, availableModels } = body;

    if (!userText || !problem) {
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

    const discovered = await getDiscoveredModels(apiKey, availableModels);
    const cleanReq = (model || '').replace(/^models\//, '').trim();

    // Build ordered candidate list starting with verified working model or valid requested model
    const candidates = [];
    if (cachedVerifiedModel && discovered.includes(cachedVerifiedModel)) {
      candidates.push(cachedVerifiedModel);
    }
    if (cleanReq && discovered.includes(cleanReq) && !candidates.includes(cleanReq)) {
      candidates.push(cleanReq);
    }
    discovered.forEach(m => {
      if (!candidates.includes(m)) candidates.push(m);
    });
    FALLBACK_FAST_MODELS.forEach(m => {
      if (!candidates.includes(m)) candidates.push(m);
    });

    const primaryModel = candidates[0];
    const secondaryModel = candidates[1] || 'gemini-2.0-flash';

    let winningResult = null;

    // Hedged execution: start primary model immediately; if it hasn't resolved in 1200ms or fails, race secondary model concurrently
    try {
      winningResult = await new Promise((resolve, reject) => {
        let settled = false;
        let errors = [];
        let activeCount = 1;
        let hedgeTimer = null;

        function handleSuccess(resObj) {
          if (settled) return;
          settled = true;
          if (hedgeTimer) clearTimeout(hedgeTimer);
          resolve(resObj);
        }

        function handleError(err, isPrimary) {
          errors.push(err);
          if (isPrimary && hedgeTimer) {
            clearTimeout(hedgeTimer);
            hedgeTimer = null;
            launchSecondary();
          }
          activeCount--;
          if (activeCount === 0 && !settled) {
            settled = true;
            reject(errors[0] || new Error('Primary and secondary models failed.'));
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
    } catch (_) {
      // Fallback to 3rd candidate if top 2 both failed
      if (candidates[2]) {
        winningResult = await callSingleModel(apiKey, candidates[2], promptText, rubric);
      } else {
        throw _;
      }
    }

    cachedVerifiedModel = winningResult.modelName;
    winningResult.availableModels = discovered;
    return res.status(200).json(winningResult);

  } catch (err) {
    console.error('Server Gemini evaluation error:', err);
    return res.status(500).json({
      error: err.message || 'Evaluation error',
      fallbackToLocal: true
    });
  }
}
