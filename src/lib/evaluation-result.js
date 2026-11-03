export function validateEvaluation(value) {
  if (!value || typeof value !== 'object' || !['complete', 'needs-work', 'reconsider', 'incomplete', 'incorrect-claim'].includes(value.status)) {
    throw new Error('The mentor returned an invalid evaluation.');
  }
  const textFields = ['title', 'question', 'success', 'nudge'];
  for (const key of textFields) {
    if (value[key] != null && typeof value[key] !== 'string') throw new Error(`Invalid mentor ${key}.`);
  }
  if (value.status === 'complete' && !value.success?.trim()) throw new Error('The mentor returned no explanation for this proof.');
  value.established = Array.isArray(value.established) ? value.established.filter(item => typeof item === 'string') : [];
  value.total = Number.isFinite(value.total) ? Math.max(1, Math.floor(value.total)) : Math.max(1, value.established.length);
  value.done = Number.isFinite(value.done) ? Math.min(value.total, Math.max(0, Math.floor(value.done))) : Math.min(value.total, value.established.length);
  return value;
}
