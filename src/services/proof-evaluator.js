import { stepMeta } from '../data/rubrics.js';

const NEG_RE = /\b(no|not|cannot|can't|cant|impossible|never|isn't|won't|doesn't|unable|nope)\b/;
const LEAD_NO_RE = /^\s*(no\b|nope|not possible|impossible|it is impossible|it's impossible|they cannot|they can't|cannot|can't)/;
const LEAD_YES_RE = /^\s*(yes|yeah|yep|possible|it is possible|it's possible|they can\b|it can\b|sure)/;
const YES_RE = /\b(yes|exists?|there (is|are|must be|will be)|must|always|guarantee[sd]?|can be|is possible|definitely)\b/;

function normalizeProof(text) {
  return ' ' + text.toLowerCase()
    .replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/[×✕]/g, 'x').replace(/[’‘]/g, "'")
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ') + ' ';
}

function evaluateProof(rawText, cumulativeRawText, problem) {
  const meta = stepMeta[problem.id];
  const rubric = meta && meta.rubric;
  const latestNorm = normalizeProof(rawText);
  const t = normalizeProof(cumulativeRawText || rawText);
  const lead = latestNorm.trim();
  const wordCount = (cumulativeRawText || rawText).trim().split(/\s+/).filter(Boolean).length;

  if (!rubric) {
    return { status: 'incomplete', title: 'Keep going', established: [], question: 'What is the key property that makes your claim true? Explain why it must hold in every case.', done: 0, total: 1, engine: 'local' };
  }

  // 1. Claim (latest attempt takes precedence if the learner changed their mind)
  let claimOk = true;
  let wrongClaim = false;
  if (rubric.answer === 'no') {
    wrongClaim = LEAD_YES_RE.test(lead) && !NEG_RE.test(latestNorm);
    claimOk = !wrongClaim && (NEG_RE.test(latestNorm) || NEG_RE.test(t));
  } else if (rubric.answer === 'yes') {
    wrongClaim = LEAD_NO_RE.test(lead);
    claimOk = !wrongClaim && (YES_RE.test(latestNorm) || LEAD_YES_RE.test(lead) || YES_RE.test(t));
  } else if (rubric.answer === 'value') {
    const latestHasRight = rubric.claimPattern.test(latestNorm);
    const firstNumber = (lead.match(/\b\d+\b/) || [])[0];
    wrongClaim = !latestHasRight && !!firstNumber && rawText.trim().split(/\s+/).length <= 40;
    claimOk = !wrongClaim && (latestHasRight || rubric.claimPattern.test(t));
  }

  // 2. Key ideas
  const found = rubric.steps.map(s => s.any.some(re => re.test(t)));
  const established = [];
  if (rubric.answer !== 'prove' && claimOk) established.push(rubric.claimLabel);
  rubric.steps.forEach((s, i) => { if (found[i]) established.push(s.label); });
  const total = rubric.steps.length + (rubric.answer === 'prove' ? 0 : 1);
  const done = established.length;
  const missing = found.indexOf(false);
  const anyIdea = found.some(Boolean);

  if (wrongClaim) {
    return { status: 'reconsider', title: 'Test that answer before committing', established, question: rubric.wrongQuestion, done, total, engine: 'local' };
  }

  // Examples are not proofs (for general statements)
  if (rubric.generalize && !found[0] && /\b\d+ ?\+ ?\d+ ?= ?\d+/.test(t)) {
    return { status: 'incomplete', title: 'Examples are evidence, not proof', established, question: 'Checking examples is a great way to build intuition, but a few cases can never cover every integer. How can you write a general odd (or even) number using a letter, so your argument works for all of them at once?', missingIdx: 0, done, total, engine: 'local' };
  }

  if (claimOk && missing === -1) {
    const minWords = Math.max(14, rubric.steps.length * 7);
    if (wordCount < minWords) {
      return { status: 'incomplete', title: 'Right ideas: now connect them', established, question: 'You have the key ideas. Now write them as one connected argument where each sentence follows from the last, using words like "because", "so" and "therefore". A reader should be able to follow it without guessing.', missingIdx: 'connect', done, total, engine: 'local' };
    }
    return { status: 'complete', title: 'Proof complete!', established, success: rubric.success, done: total, total, engine: 'local' };
  }

  if (!claimOk && missing === -1) {
    return { status: 'incomplete', title: 'State your conclusion', established, question: 'Your reasoning is all there, but what is your final answer? Say it plainly in one sentence, then make sure your argument leads to it.', missingIdx: 'claim', done, total, engine: 'local' };
  }

  if (!claimOk && !anyIdea) {
    return { status: 'incomplete', title: 'Start with a clear claim', established, question: rubric.claimQuestion, missingIdx: 'claim', done, total, engine: 'local' };
  }

  const step = rubric.steps[missing];
  if (!anyIdea) {
    return {
      status: 'incomplete',
      title: rubric.answer === 'prove' ? 'Where does the proof begin?' : 'That\'s a claim. Now prove it.',
      established,
      question: (rubric.answer === 'prove' ? '' : 'A claim needs a reason. ') + step.question,
      missingIdx: missing, done, total, engine: 'local'
    };
  }
  return { status: 'incomplete', title: 'Good progress: one idea is missing', established, question: step.question, missingIdx: missing, done, total, engine: 'local' };
}

export { evaluateProof, normalizeProof };
