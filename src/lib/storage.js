import { DEFAULT_GEMINI_MODEL, filterGeminiModels, isSupportedGeminiModel, normalizeGeminiModel } from './gemini-models.js';
﻿const STORAGE_KEY = 'verity-progress-v1';
const record = value => value && typeof value === 'object' && !Array.isArray(value);
export function initialState() {
  return { xp: 0, courses: {}, favorites: {}, lastCourse: null, activity: [], guestSubmissions: 0, geminiApiKey: '', geminiModel: DEFAULT_GEMINI_MODEL, geminiModels: [], supabaseUrl: '', supabaseAnonKey: '', serverGeminiActive: false, authUser: null };
}
export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!record(saved)) return initialState();
    const state = { ...initialState(), ...saved };
    state.xp = Number.isFinite(state.xp) ? Math.max(0, state.xp) : 0;
    state.courses = record(state.courses) ? Object.fromEntries(Object.entries(state.courses)
      .filter(([, value]) => record(value)).map(([key, value]) => [key, Object.fromEntries(Object.entries(value)
        .filter(([, status]) => ['proved', 'reviewed'].includes(status)))])) : {};
    state.favorites = record(state.favorites) ? state.favorites : {};
    state.activity = Array.isArray(state.activity) ? state.activity.filter(item => record(item) && Number.isFinite(item.t)).slice(-5000) : [];
    state.guestSubmissions = Number.isFinite(saved.guestSubmissions)
      ? Math.max(0, Math.floor(saved.guestSubmissions))
      : (!saved.authUser ? state.activity.length : 0);
    state.geminiModels = filterGeminiModels(state.geminiModels);
    for (const key of ['geminiApiKey', 'geminiModel', 'supabaseUrl', 'supabaseAnonKey']) {
      if (typeof state[key] !== 'string') state[key] = initialState()[key];
    }
    state.geminiModel = normalizeGeminiModel(state.geminiModel);
    if (!isSupportedGeminiModel(state.geminiModel) || /^gemini-3\.[1-9]|-pro/i.test(state.geminiModel)) {
      state.geminiModel = state.geminiModels[0] || DEFAULT_GEMINI_MODEL;
    }
    if (!record(state.authUser) || typeof state.authUser.id !== 'string') state.authUser = null;
    if (state.authUser) {
      if (typeof state.authUser.email !== 'string') state.authUser.email = '';
      if (!record(state.authUser.user_metadata)) state.authUser.user_metadata = {};
    }
    return state;
  } catch { return initialState(); }
}
export function persistState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Storage may be disabled. */ }
}
export function archiveProgress(state) {
  try { localStorage.setItem(`${STORAGE_KEY}:archive:${state.authUser?.id || 'guest'}`, JSON.stringify(state)); } catch { /* Storage unavailable. */ }
}
