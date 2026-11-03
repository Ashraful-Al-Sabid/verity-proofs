export function createProgressService({ getState, getClient, getUser, saveState, updateXpDisplay, renderProgress, onSync, onSyncError = () => {} }) {
  const cloudUser = () => getClient() && getUser() && !getUser().isLocalFallback ? getUser() : null;
  async function checked(query) {
    const response = await query;
    if (response.error) throw response.error;
    return response.data;
  }
  async function run(operation) {
    try { return await operation(); }
    catch (error) { console.warn('Cloud sync failed:', error.message); onSyncError(error); return false; }
  }
  async function migrateGuestProgressToCloud(userId) {
    const user = cloudUser();
    if (!user || user.id !== userId) return false;
    const client = getClient();
    return run(async () => {
      const remote = await checked(client.from('user_progress').select('course_id,problem_id,status').eq('user_id', userId));
      if (cloudUser()?.id !== userId) return false;
      const existing = new Map((remote || []).map(row => [`${row.course_id}:${row.problem_id}`, row.status]));
      const rows = Object.entries(getState().courses).flatMap(([course_id, problems]) => Object.entries(problems)
        .filter(([, status]) => ['proved', 'reviewed'].includes(status))
        .map(([problem_id, status]) => ({ user_id: userId, course_id, problem_id,
          status: existing.get(`${course_id}:${problem_id}`) === 'proved' ? 'proved' : status,
          updated_at: new Date().toISOString() })));
      if (rows.length) await checked(client.from('user_progress').upsert(rows, { onConflict: 'user_id,course_id,problem_id' }));
      const favorites = Object.entries(getState().favorites).filter(([, value]) => value).map(([course_id]) => ({ user_id: userId, course_id }));
      if (favorites.length) await checked(client.from('user_favorites').upsert(favorites, { onConflict: 'user_id,course_id' }));
      const profile = await checked(client.from('profiles').select('total_xp').eq('id', userId).maybeSingle());
      if (cloudUser()?.id !== userId) return false;
      getState().xp = Math.max(getState().xp, profile?.total_xp || 0);
      // The signup trigger owns profile creation; RLS permits updating one's profile.
      await checked(client.from('profiles').update({ total_xp: getState().xp, updated_at: new Date().toISOString() }).eq('id', userId));
      saveState(); updateXpDisplay(); onSync();
      return true;
    });
  }
  async function fetchCloudState(userId) {
    if (cloudUser()?.id !== userId) return false;
    const client = getClient();
    return run(async () => {
      const [profile, progress, favorites] = await Promise.all([
        checked(client.from('profiles').select('*').eq('id', userId).maybeSingle()),
        checked(client.from('user_progress').select('*').eq('user_id', userId)),
        checked(client.from('user_favorites').select('course_id').eq('user_id', userId))
      ]);
      if (cloudUser()?.id !== userId) return false;
      const state = getState();
      state.xp = Math.max(state.xp, profile?.total_xp || 0);
      for (const row of progress || []) {
        if (!['proved', 'reviewed'].includes(row.status)) continue;
        state.courses[row.course_id] ??= {};
        if (state.courses[row.course_id][row.problem_id] !== 'proved') state.courses[row.course_id][row.problem_id] = row.status;
      }
      for (const row of favorites || []) state.favorites[row.course_id] = true;
      saveState(); updateXpDisplay(); renderProgress(); onSync();
      return true;
    });
  }
  async function saveStepToCloud(courseKey, problemId, result, gain, hintsUsed, proofText) {
    const user = cloudUser();
    if (!user) return false;
    const client = getClient();
    return run(async () => {
      await Promise.all([
        checked(client.from('user_progress').upsert({ user_id: user.id, course_id: courseKey, problem_id: problemId,
          status: 'proved', hints_used: hintsUsed, updated_at: new Date().toISOString() }, { onConflict: 'user_id,course_id,problem_id' })),
        checked(client.from('profiles').update({ total_xp: getState().xp, updated_at: new Date().toISOString() }).eq('id', user.id)),
        checked(client.from('proof_submissions').insert({ user_id: user.id, course_id: courseKey, problem_id: problemId,
          proof_text: proofText || '', engine: result.engine || 'local', model_name: result.modelName || null,
          status: result.status, score_done: result.done || 0, score_total: result.total || 0,
          feedback: result, hints_used: hintsUsed, xp_awarded: gain || 0 }))
      ]);
      if (cloudUser()?.id === user.id) onSync();
      return true;
    });
  }
  async function syncFavoriteToCloud(courseId, isFavorite) {
    const user = cloudUser();
    if (!user) return false;
    const client = getClient();
    return run(async () => {
      await checked(isFavorite ? client.from('user_favorites').upsert({ user_id: user.id, course_id: courseId })
        : client.from('user_favorites').delete().match({ user_id: user.id, course_id: courseId }));
      if (cloudUser()?.id === user.id) onSync();
      return true;
    });
  }
  return { migrateGuestProgressToCloud, fetchCloudState, saveStepToCloud, syncFavoriteToCloud };
}
