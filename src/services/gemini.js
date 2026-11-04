import { DEFAULT_GEMINI_MODEL, DEFAULT_GEMINI_MODELS, filterGeminiModels, isSupportedGeminiModel, scoreGeminiModel } from '../lib/gemini-models.js';
import { validateEvaluation } from '../lib/evaluation-result.js';
import { stepMeta } from '../data/rubrics.js';

export function createGeminiService({ getState, saveState, updateAiStatusBadge }) {

  function formatModelLabel(m) {
    if (!m) return 'Gemini';
    const id = m.replace(/^models\//, '');
    if (id.includes('llama')) return 'Llama 3.3 (Groq AI)';
    if (id.includes('gpt-4o')) return 'GPT-4o Mini';
    return id
      .replace('gemini-', 'Gemini ')
      .replace('-flash-lite', ' Flash Lite')
      .replace('-flash', ' Flash')
      .replace('-pro', ' Pro');
  }


  async function fetchAvailableGeminiModels(apiKey) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + encodeURIComponent(apiKey);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      if (!res.ok) {
        const errText = await res.text();
        let msg = 'HTTP ' + res.status;
        try {
          const j = JSON.parse(errText);
          if (j.error && j.error.message) msg = j.error.message;
        } catch (_) {}
        throw new Error(msg);
      }
      const data = await res.json();
      const rawModels = (data && Array.isArray(data.models)) ? data.models : [];
      const usable = [];
      rawModels.forEach(m => {
        const methods = Array.isArray(m.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
        if (!methods.includes('generateContent')) return;
        const id = (m.name || '').replace(/^models\//, '');
        if (!isSupportedGeminiModel(id)) return;
        if (/embedding|imagen|veo|aqa|audio|tts|image|vision|robotics|computer-use|learnlm|thinking-exp|live/i.test(id)) return;
        usable.push(id);
      });
      usable.sort((a, b) => scoreGeminiModel(b) - scoreGeminiModel(a));
      if (usable.length > 0) {
        getState().geminiModels = usable;
        if (!getState().geminiModel || !usable.includes(getState().geminiModel)) {
          getState().geminiModel = usable[0];
        }
        saveState();
        updateAiStatusBadge();
      }
      return usable;
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('Key validation timed out (>12s). Check your internet connection.');
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function probeSingleModel(apiKey, modelId) {
    const cleanName = (modelId || '').replace(/^models\//, '');
    if (!isSupportedGeminiModel(cleanName)) throw new Error('Only Gemini 3 or newer text models are supported.');
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cleanName) + ':generateContent?key=' + encodeURIComponent(apiKey);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with OK' }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8 }
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errText = await res.text();
        let msg = 'HTTP ' + res.status;
        try {
          const j = JSON.parse(errText);
          if (j.error && j.error.message) msg = j.error.message;
        } catch (_) {}
        const e = new Error(msg);
        e.status = res.status;
        throw e;
      }
      return cleanName;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function testGeminiApiKey(apiKey, preferredModel, onProgress) {
    const discovered = await fetchAvailableGeminiModels(apiKey);
    const cleanPref = (preferredModel || '').replace(/^models\//, '');

    // Build ordered candidate list to probe so we verify a model that actually responds 200 OK
    const candidates = [];
    if (isSupportedGeminiModel(cleanPref) && (!discovered.length || discovered.includes(cleanPref))) {
      candidates.push(cleanPref);
    }
    discovered.forEach(m => {
      if (!candidates.includes(m)) candidates.push(m);
    });
    DEFAULT_GEMINI_MODELS.forEach(m => {
      if (!candidates.includes(m)) candidates.push(m);
    });

    const toProbe = candidates.slice(0, 6);
    const errors = [];

    for (let i = 0; i < toProbe.length; i++) {
      const candidate = toProbe[i];
      if (typeof onProgress === 'function') {
        onProgress('Testing model ' + candidate + ' (' + (i + 1) + '/' + toProbe.length + ')…');
      }
      try {
        await probeSingleModel(apiKey, candidate);
        return { workingModel: candidate, models: discovered.length ? discovered : DEFAULT_GEMINI_MODELS };
      } catch (err) {
        errors.push(candidate + ': ' + (err.message || 'failed'));
        // If the API key itself is invalid (400 API_KEY_INVALID or 403), stop probing immediately
        if (/API key not valid|API_KEY_INVALID|permission_denied|referer/i.test(err.message || '')) {
          throw err;
        }
      }
    }

    // If key is valid (models list succeeded) but all probed models had temporary 503 demand spikes, still return best discovered model
    if (discovered.length > 0) {
      const chosen = (cleanPref && discovered.includes(cleanPref)) ? cleanPref : discovered[0];
      return {
        workingModel: chosen,
        models: discovered,
        warning: 'Key is valid, but Google servers reported temporary load during probe (' + errors[0] + '). Will retry automatically on proof check.'
      };
    }

    throw new Error(errors.join(' | ') || 'No working Gemini model found for this key.');
  }

  async function callGeminiEvaluation(userText, cumulativeText, problem, apiKey, model, onStatusUpdate) {
    const meta = stepMeta[problem.id];
    const rubric = meta && meta.rubric;

    const sol = problem.curatedSolution || {};
    const canonicalSolution = typeof sol === 'string'
      ? sol
      : [sol.technique, sol.setup, sol.steps, sol.conclusion].filter(Boolean).join(' ');
    const expectedClaim = rubric ? (rubric.answer === 'yes' ? 'Affirmative / Yes (possible)' : rubric.answer === 'no' ? 'Negative / No (impossible)' : rubric.answer === 'value' ? 'Exact value' : 'Direct proof') : 'Rigorous deductive proof';
    const rubricSteps = rubric && rubric.steps ? rubric.steps.map((s, i) => (i + 1) + '. ' + s.label).join('; ') : 'Deductive mathematical argument';

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

    const baseContents = [
      {
        role: 'user',
        parts: [{ text: systemInstructions + '\n\n' + promptBody }]
      }
    ];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    async function postToModel(mName, maxRetries) {
      const cleanName = (mName || DEFAULT_GEMINI_MODEL).replace(/^models\//, '');
      if (!isSupportedGeminiModel(cleanName)) throw new Error('Only Gemini 3 or newer text models are supported.');
      const targetUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cleanName) + ':generateContent?key=' + encodeURIComponent(apiKey);
      const retries = typeof maxRetries === 'number' ? maxRetries : 1;
      let usePlain = false;

      for (let attempt = 0; attempt <= retries; attempt++) {
        const genConfig = usePlain
          ? { temperature: 0.1, maxOutputTokens: 1500 }
          : { temperature: 0.1, maxOutputTokens: 1500, responseMimeType: 'application/json' };
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: baseContents, generationConfig: genConfig }),
          signal: controller.signal
        });
        if (!res.ok) {
          const errText = await res.text();
          let msg = 'Gemini HTTP ' + res.status;
          try {
            const errJson = JSON.parse(errText);
            if (errJson.error && errJson.error.message) msg = errJson.error.message;
          } catch (_) {}

          if (res.status === 400 && !usePlain && /mime|json|invalid_argument|generation_config/i.test(msg)) {
            usePlain = true;
            attempt--;
            continue;
          }

          const isDemandSpike = res.status === 503 || res.status === 429 || /high demand|spikes in demand|overloaded|unavailable|resource_exhausted/i.test(msg);
          if (isDemandSpike && attempt < retries) {
            const waitMs = 800;
            if (typeof onStatusUpdate === 'function') {
              onStatusUpdate('✨ High demand on ' + cleanName + ' — retrying…');
            }
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }

          const error = new Error(msg);
          error.status = res.status;
          error.modelName = cleanName;
          throw error;
        }
        return { res, activeModel: cleanName };
      }
    }

    try {
      getState().geminiModels = filterGeminiModels(getState().geminiModels);
      // Ensure we have discovered real models for this key
      if (!Array.isArray(getState().geminiModels) || getState().geminiModels.length === 0) {
        try {
          await fetchAvailableGeminiModels(apiKey);
        } catch (_) {}
      }

      const knownModels = (Array.isArray(getState().geminiModels) && getState().geminiModels.length > 0)
        ? getState().geminiModels
        : DEFAULT_GEMINI_MODELS;

      let rawModel = (model || getState().geminiModel || knownModels[0] || DEFAULT_GEMINI_MODEL).replace(/^models\//, '');
      if (!knownModels.includes(rawModel)) {
        rawModel = knownModels[0] || DEFAULT_GEMINI_MODEL;
      }

      const candidateModels = [rawModel];
      knownModels.forEach(m => {
        const clean = m.replace(/^models\//, '');
        if (!candidateModels.includes(clean)) candidateModels.push(clean);
      });
      DEFAULT_GEMINI_MODELS.forEach(m => {
        const clean = m.replace(/^models\//, '');
        if (!candidateModels.includes(clean)) candidateModels.push(clean);
      });

      let activeRes = null;
      let respondedModel = rawModel;
      const modelErrors = [];

      for (let i = 0; i < Math.min(candidateModels.length, 6); i++) {
        const m = candidateModels[i];
        if (i > 0 && typeof onStatusUpdate === 'function') {
          onStatusUpdate('✨ Switching to ' + formatModelLabel(m) + '…');
        }
        try {
          const result = await postToModel(m, 0);
          activeRes = result.res;
          respondedModel = result.activeModel;
          break;
        } catch (err) {
          modelErrors.push(m + ' (' + (err.message || 'error') + ')');
          if (/API key not valid|API_KEY_INVALID|permission_denied/i.test(err.message || '')) {
            throw err;
          }
        }
      }

      if (!activeRes) {
        throw new Error(modelErrors[0] || 'All Gemini models failed to respond.');
      }

      // Persist working model if a fallback model succeeded so future checks are instant
      if (respondedModel !== getState().geminiModel) {
        getState().geminiModel = respondedModel;
        saveState();
        updateAiStatusBadge();
      }

      const json = await activeRes.json();
      const cand = json.candidates && json.candidates[0];
      if (!cand) {
        const reason = json.promptFeedback ? JSON.stringify(json.promptFeedback) : 'No candidate returned';
        throw new Error('Gemini returned no response: ' + reason);
      }
      const rawText = cand.content && cand.content.parts && cand.content.parts[0] && cand.content.parts[0].text;
      if (!rawText) throw new Error('Empty text content in Gemini response (finishReason: ' + (cand.finishReason || 'unknown') + ')');

      let cleaned = rawText.trim();
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      let evalResult;
      try {
        evalResult = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Gemini raw response:', rawText);
        throw new Error('Invalid JSON from Gemini: ' + parseErr.message);
      }

      if (!Array.isArray(evalResult.established)) evalResult.established = [];
      if (typeof evalResult.done !== 'number') evalResult.done = evalResult.established.length;
      if (typeof evalResult.total !== 'number') evalResult.total = Math.max(evalResult.done, (rubric && rubric.steps ? rubric.steps.length : 2) + 1);
      evalResult.engine = 'gemini';
      evalResult.modelName = respondedModel;
      return validateEvaluation(evalResult);
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Gemini request timed out after 50s. Check network connection.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function callServerGeminiEvaluation(userText, cumulativeText, problem, model, onStatusUpdate) {
    if (typeof onStatusUpdate === 'function') {
      onStatusUpdate('✨ Analyzing proof logic…');
    }
    const meta = stepMeta[problem.id];
    const rubric = meta && meta.rubric;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText,
          cumulativeText,
          problem: {
            id: problem.id,
            title: problem.title,
            text: problem.text,
            curatedSolution: problem.curatedSolution
          },
          rubric,
          model: filterGeminiModels([model, getState().geminiModel])[0] || DEFAULT_GEMINI_MODEL,
          availableModels: filterGeminiModels(getState().geminiModels)
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || ('Server returned HTTP ' + res.status));
      }

      const data = await res.json();
      let stateUpdated = false;
      if (Array.isArray(data.availableModels) && data.availableModels.length > 0) {
        getState().geminiModels = filterGeminiModels(data.availableModels);
        stateUpdated = true;
      }
      if (data.modelName && data.modelName !== getState().geminiModel) {
        if (isSupportedGeminiModel(data.modelName) || !data.modelName.startsWith('gemini-')) {
          getState().geminiModel = data.modelName;
          stateUpdated = true;
        }
      }
      if (stateUpdated) {
        saveState();
        updateAiStatusBadge();
      }
      return validateEvaluation(data);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { DEFAULT_GEMINI_MODELS, formatModelLabel, fetchAvailableGeminiModels, testGeminiApiKey, callGeminiEvaluation, callServerGeminiEvaluation };
}
