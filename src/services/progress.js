export function createProgressService({ getState, getClient, getUser, saveState, updateXpDisplay, renderProgress, onSync }) {
  async function migrateGuestProgressToCloud(userId) {
    if (!getClient() || !userId) return;
    try {
      const progressRows = [];
      Object.keys(getState().courses || {}).forEach(cKey => {
        const courseObj = getState().courses[cKey] || {};
        Object.keys(courseObj).forEach(pId => {
          if (courseObj[pId]) {
            progressRows.push({
              user_id: userId,
              course_id: cKey,
              problem_id: pId,
              status: courseObj[pId],
              updated_at: new Date().toISOString()
            });
          }
        });
      });

      if (progressRows.length > 0) {
        await getClient().from('user_progress').upsert(progressRows, { onConflict: 'user_id,course_id,problem_id' });
      }

      const favRows = [];
      Object.keys(getState().favorites || {}).forEach(cKey => {
        if (getState().favorites[cKey]) {
          favRows.push({ user_id: userId, course_id: cKey });
        }
      });
      if (favRows.length > 0) {
        await getClient().from('user_favorites').upsert(favRows, { onConflict: 'user_id,course_id' });
      }

      const { data: profile } = await getClient().from('profiles').select('total_xp').eq('id', userId).maybeSingle();
      const cloudXp = (profile && typeof profile.total_xp === 'number') ? profile.total_xp : 0;
      const finalXp = Math.max(getState().xp || 0, cloudXp);
      getState().xp = finalXp;
      saveState();
      updateXpDisplay();

      await getClient().from('profiles').upsert({
        id: userId,
        email: getUser() ? getUser().email : '',
        display_name: getUser()?.user_metadata?.full_name || getUser()?.email?.split('@')[0] || 'Learner',
        total_xp: finalXp,
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Guest migration notice:', err);
    }
  }

  async function fetchCloudState(userId) {
    if (!getClient() || !userId) return;
    try {
      const { data: profile } = await getClient().from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profile && typeof profile.total_xp === 'number') {
        getState().xp = Math.max(getState().xp, profile.total_xp);
      }

      const { data: progressRows } = await getClient().from('user_progress').select('*').eq('user_id', userId);
      if (Array.isArray(progressRows)) {
        progressRows.forEach(row => {
          if (!getState().courses[row.course_id]) getState().courses[row.course_id] = {};
          if (row.status === 'proved') {
            getState().courses[row.course_id][row.problem_id] = 'proved';
          } else if (!getState().courses[row.course_id][row.problem_id]) {
            getState().courses[row.course_id][row.problem_id] = row.status;
          }
        });
      }

      const { data: favRows } = await getClient().from('user_favorites').select('course_id').eq('user_id', userId);
      if (Array.isArray(favRows)) {
        favRows.forEach(row => {
          getState().favorites[row.course_id] = true;
        });
      }

      saveState();
      updateXpDisplay();
      renderProgress();
      onSync();
    } catch (err) {
      console.warn('Fetch cloud state notice:', err);
    }
  }

  async function saveStepToCloud(courseKey, problemId, result, gain, hintsUsed, proofText) {
    if (!getUser() || !getClient()) return;
    try {
      await Promise.all([
        getClient().from('user_progress').upsert({
          user_id: getUser().id,
          course_id: courseKey,
          problem_id: problemId,
          status: 'proved',
          hints_used: hintsUsed,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,course_id,problem_id' }),

        getClient().from('profiles').update({
          total_xp: getState().xp,
          updated_at: new Date().toISOString()
        }).eq('id', getUser().id),

        getClient().from('proof_submissions').insert({
          user_id: getUser().id,
          course_id: courseKey,
          problem_id: problemId,
          proof_text: proofText || '',
          engine: result.engine || 'local',
          model_name: result.modelName || null,
          status: result.status,
          score_done: result.done || 0,
          score_total: result.total || 0,
          feedback: result,
          hints_used: hintsUsed,
          xp_awarded: gain || 0
        })
      ]);
      onSync();
    } catch (err) {
      console.warn('Save step to cloud notice:', err);
    }
  }

  async function syncFavoriteToCloud(courseId, isFav) {
    if (!getUser() || !getClient()) return;
    try {
      if (isFav) {
        await getClient().from('user_favorites').upsert({
          user_id: getUser().id,
          course_id: courseId
        });
      } else {
        await getClient().from('user_favorites').delete().match({
          user_id: getUser().id,
          course_id: courseId
        });
      }
    } catch (err) {
      console.warn('Sync favorite notice:', err);
    }
  }


  return { migrateGuestProgressToCloud, fetchCloudState, saveStepToCloud, syncFavoriteToCloud };
}
