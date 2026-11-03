// Vercel Serverless Function: Secure Gemini AI Proof Evaluator
// Keeps your private GEMINI_API_KEY hidden from browser clients.

const DEFAULT_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

function resolveRealModelName(model) {
  const clean = (model || 'gemini-2.5-flash').replace(/^models\//, '').trim();
  if (!clean || clean === 'gemini-3.8-flash' || clean === 'gemini-3.6-flash') {
    return 'gemini-2.5-flash';
  }
  return clean;
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
    const { userText, cumulativeText, problem, rubric, model } = body;

    if (!userText || !problem) {
      return res.status(400).json({ error: 'Missing required proof text or problem definition.' });
    }

    const canonicalSolution = problem.curatedSolution
      ? (typeof problem.curatedSolution === 'string'
          ? problem.curatedSolution
          : JSON.stringify(problem.curatedSolution))
      : '';
    const expectedClaim = rubric
      ? (rubric.answer === 'yes' ? 'Affirmative / Yes (possible)' : rubric.answer === 'no' ? 'Negative / No (impossible)' : rubric.answer === 'value' ? 'Exact value' : 'Direct proof')
      : 'Rigorous deductive proof';
    const rubricSteps = rubric && rubric.steps
      ? rubric.steps.map((s, i) => (i + 1) + '. ' + s.label).join('; ')
      : 'Deductive mathematical argument';

    const systemInstructions = "You are an elite Russian Mathematical Circles Olympiad mentor.\n" +
      "Assess student proof with Socratic rigor. NEVER reveal the solution, formula, or proof steps.\n" +
      "Problem: " + problem.title + "\n" +
      "Statement: " + problem.text + "\n" +
      "Target Claim: " + expectedClaim + "\n" +
      "Key Invariants: " + rubricSteps + "\n" +
      "Canonical Solution (DO NOT REVEAL): " + canonicalSolution + "\n\n" +
      "RULES:\n" +
      "- Contradictory/wrong claim: status='reconsider', ask them to test a minimal counterexample.\n" +
      "- Right direction with missing links: status='needs-work', list proven deductions in 'established', ask ONE sharp Socratic question in 'question'.\n" +
      "- Fully rigorous & complete: status='complete', explain why in 'success'.\n" +
      "Output strict JSON only:\n" +
      "{\"status\":\"complete\"|\"needs-work\"|\"reconsider\",\"title\":\"Short headline\",\"established\":[\"points\"],\"question\":\"question\",\"nudge\":\"hint\",\"success\":\"reason\",\"done\":1,\"total\":2}";

    const promptBody = 'STUDENT ATTEMPT:\n"""\n' + userText + '\n"""\n' +
      (cumulativeText && cumulativeText !== userText ? 'Prior draft context: ' + cumulativeText : '');

    const requestBodyJson = {
      contents: [{ role: 'user', parts: [{ text: systemInstructions + '\n\n' + promptBody }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      }
    };

    const targetModel = resolveRealModelName(model);
    const candidateModels = [targetModel, ...DEFAULT_MODELS.filter(m => m !== targetModel)];

    let activeRes = null;
    let respondedModel = targetModel;
    let lastError = null;

    for (const m of candidateModels.slice(0, 4)) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBodyJson)
        });

        if (response.ok) {
          activeRes = response;
          respondedModel = m;
          break;
        }

        const errText = await response.text();
        lastError = new Error(`Model ${m} returned HTTP ${response.status}: ${errText}`);
      } catch (err) {
        lastError = err;
      }
    }

    if (!activeRes) {
      throw lastError || new Error('All candidate Gemini models failed to respond.');
    }

    const json = await activeRes.json();
    const cand = json.candidates && json.candidates[0];
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

    return res.status(200).json(evalResult);

  } catch (err) {
    console.error('Server Gemini evaluation error:', err);
    return res.status(500).json({
      error: err.message || 'Evaluation error',
      fallbackToLocal: true
    });
  }
}
