const STORAGE_KEY = 'verity-progress-v1';
export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s && typeof s === 'object') {
      if (!s.geminiModel || /3\.5|3\.6|3\.8/.test(s.geminiModel)) {
        s.geminiModel = (Array.isArray(s.geminiModels) && s.geminiModels.length > 0)
          ? s.geminiModels[0]
          : 'gemini-2.5-flash-lite';
      }
      if (!Array.isArray(s.geminiModels)) s.geminiModels = [];
      return Object.assign({ xp: 0, courses: {}, favorites: {}, lastCourse: null, activity: [], geminiApiKey: '', geminiModel: 'gemini-2.5-flash-lite', geminiModels: [], supabaseUrl: '', supabaseAnonKey: '', serverGeminiActive: false, authUser: null }, s);
    }
  } catch (e) { /* ignore corrupted storage */ }
  return { xp: 0, courses: {}, favorites: {}, lastCourse: null, activity: [], geminiApiKey: '', geminiModel: 'gemini-2.5-flash-lite', geminiModels: [], supabaseUrl: '', supabaseAnonKey: '', serverGeminiActive: false, authUser: null };
}

export function persistState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage may be disabled. */ }
}
