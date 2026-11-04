import { DEFAULT_GEMINI_MODEL, filterGeminiModels, isSupportedGeminiModel } from './lib/gemini-models.js';
import { guestLoginRequired } from './lib/guest-access.js';
import { trapDialogFocus } from './lib/dialog.js';
import { validateEvaluation } from './lib/evaluation-result.js';
import { authenticate } from './services/auth.js';
import { renderSettings } from './views/dialogs/settings.js';
import { renderAbout } from './views/dialogs/about.js';
import { renderHelp } from './views/dialogs/help.js';
import { renderAuth } from './views/dialogs/auth.js';
import { renderGuestGate } from './views/dialogs/guestGate.js';
import { createClient } from '@supabase/supabase-js';
import { coursesData } from './data/courses.js';
import { stepMeta } from './data/rubrics.js';
import { loadState, persistState, archiveProgress } from './lib/storage.js';
import { escapeHtml } from './lib/html.js';
import { celebrateProof, stopCelebration } from './lib/celebration.js';
import { evaluateProof } from './services/proof-evaluator.js';
import { createGeminiService } from './services/gemini.js';
import { createProgressService } from './services/progress.js';
import './styles/index.css';

let state = loadState();
const saveState = () => persistState(state);
const { DEFAULT_GEMINI_MODELS, formatModelLabel, fetchAvailableGeminiModels, testGeminiApiKey, callGeminiEvaluation, callServerGeminiEvaluation } = createGeminiService({ getState: () => state, saveState, updateAiStatusBadge });
const { migrateGuestProgressToCloud, fetchCloudState, saveStepToCloud, syncFavoriteToCloud } = createProgressService({
  getState: () => state, getClient: () => supabaseClient, getUser: () => currentUser,
  saveState, updateXpDisplay, renderProgress,
  onSyncError() {
    if (navSyncPill) { navSyncPill.style.display = 'inline'; navSyncPill.textContent = 'Sync failed'; navSyncPill.title = 'Progress is saved on this device. Cloud synchronization failed.'; }
  },
  onSync() {
    document.querySelectorAll('.star-btn').forEach(btn => {
      const id = btn.closest('.topic-row')?.id;
      if (id) btn.classList.toggle('favorited', !!state.favorites[id]);
    });
    if (navSyncPill) { navSyncPill.style.display = 'inline'; navSyncPill.textContent = '☁️'; navSyncPill.title = 'Saved to Supabase Cloud'; }
  }
});

// ==========================================
// PERSISTENT PROGRESS (localStorage)
// ==========================================
// Every checked proof is logged (ok = proof complete, first = first time this step was proved) for the "You" page.
function logActivity(courseKey, id, ok, first) {
  if (!Array.isArray(state.activity)) state.activity = [];
  state.activity.push({ t: Date.now(), c: courseKey, id: id, ok: !!ok, first: !!first });
  if (state.activity.length > 5000) state.activity.splice(0, state.activity.length - 5000);
  saveState();
}
function courseProgress(key) {
  if (!state.courses[key]) state.courses[key] = {};
  return state.courses[key];
}
function stepStatus(key, id) { return courseProgress(key)[id] || null; } // 'proved' | 'reviewed' | null
function setStepStatus(key, id, status) {
  const cp = courseProgress(key);
  if (cp[id] === 'proved') return; // never downgrade an independent proof
  cp[id] = status;
  saveState();
}
function currentStepIndex(key) {
  const ps = coursesData[key].problems;
  return ps.findIndex(p => stepStatus(key, p.id) !== 'proved'); // -1 when every step is proved
}
function provedCount(key) {
  return coursesData[key].problems.filter(p => stepStatus(key, p.id) === 'proved').length;
}


// ==========================================
// APP STATE
// ==========================================
let activeCourseKey = 'parity';
let selectedStep = 0;
let currentStep = 0;
let evaluationGeneration = 0;
let evaluating = false;
let checkMode = 'submit'; // 'submit' | 'advance' | 'close'

// In-memory session data per problem id
const session = { attempts: {}, hints: {}, lastSubmitted: {}, drafts: {}, history: {}, missingHistory: {}, results: {} };

// ==========================================
// DOM ELEMENTS
// ==========================================
const homeView = document.getElementById('home-view');
const topicsView = document.getElementById('topics-view');
const courseView = document.getElementById('course-view');
const youView = document.getElementById('you-view');
const navHome = document.getElementById('nav-home');
const navTopics = document.getElementById('nav-topics');
const navYou = document.getElementById('nav-you');
const brandLink = document.getElementById('brand-link');
const backToTopics = document.getElementById('back-to-topics');

const crumbCategory = document.getElementById('crumb-category');
const crumbCourseTitle = document.getElementById('crumb-course-title');
const courseCardImg = document.getElementById('course-card-img');
const courseCardTitle = document.getElementById('course-card-title');
const courseCardDesc = document.getElementById('course-card-desc');
const courseCardSections = document.getElementById('course-card-sections');
const courseCardChallenges = document.getElementById('course-card-challenges');
const pathBannerLevel = document.getElementById('path-banner-level');
const pathBannerTitle = document.getElementById('path-banner-title');
const pathTrack = document.querySelector('.winding-path-track');
const pathSvg = document.querySelector('.tortuous-svg-trail');
const dynamicPathNodes = document.getElementById('dynamic-path-nodes');
const popupNodeMeta = document.getElementById('popup-node-meta');
const popupNodeTitle = document.getElementById('popup-node-title');
const popupNodeDesc = document.getElementById('popup-node-desc');
const startLessonBtn = document.getElementById('start-lesson-btn');

const exerciseModal = document.getElementById('exercise-modal');
const exerciseClose = document.getElementById('exercise-close');
const checkBtn = document.getElementById('check-btn');
const stepBadge = document.getElementById('lesson-step-badge');
const lessonCategoryLabel = document.getElementById('lesson-category-label');
const questionHeadline = document.getElementById('question-headline');
const questionText = document.getElementById('question-text');
const questionVisual = document.getElementById('question-visual');
const progressFill = document.getElementById('exercise-progress-fill');
const progressDots = document.getElementById('exercise-progress-dots');
const feedbackMessage = document.getElementById('feedback-message');
const feedbackIcon = document.getElementById('feedback-icon');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackExplanation = document.getElementById('feedback-explanation');
const exerciseScore = document.getElementById('exercise-score');
const materialBox = document.getElementById('material-box');
const answeringBox = document.getElementById('answering-box');
const lessonComplete = document.getElementById('lesson-complete');

const attemptBadge = document.getElementById('attempt-badge');
const btnAiStatus = document.getElementById('btn-ai-status');
const aiStatusDot = document.getElementById('ai-status-dot');
const aiStatusLabel = document.getElementById('ai-status-label');
const btnRequestHint = document.getElementById('btn-request-hint');
const btnViewSolution = document.getElementById('btn-view-solution');
const curatedHintBox = document.getElementById('curated-hint-box');
const curatedHintText = document.getElementById('curated-hint-text');
const btnCloseHint = document.getElementById('btn-close-hint');
const solutionModal = document.getElementById('solution-modal');
const solutionModalHeading = document.getElementById('solution-modal-heading');
const solutionModalContent = document.getElementById('solution-modal-content');
const btnCloseSolutionModal = document.getElementById('btn-close-solution-modal');
const btnDismissSolution = document.getElementById('btn-dismiss-solution');
const btnSolutionProceed = document.getElementById('btn-solution-proceed');
const proofInput = document.getElementById('user-proof-input');
const charCount = document.getElementById('char-count');

function updateXpDisplay() { exerciseScore.textContent = state.xp; }
updateXpDisplay();

if (btnAiStatus) {
  btnAiStatus.addEventListener('click', () => {
    openAppModal('settings');
  });
}

// ==========================================
// COURSE PAGE: zigzag path generated from the steps
// ==========================================
const NODE_GAP = 100;
const NODE_TOP = 34;
function nodeLeft(i) { return i === 0 ? 150 : (i % 2 === 1 ? 50 : 190); }

function pedestalSvg(variant, idx) {
  const palettes = {
    grey: ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8'],
    done: ['#fef3c7', '#fcd34d', '#f59e0b', '#d97706'],
    reviewed: ['#f8fafc', '#fde7d4', '#fdba74', '#fb923c']
  };
  const c = palettes[variant];
  return `
    <div class="grey-pedestal-wrap">
      <svg viewBox="0 0 90 54" class="grey-pedestal-svg">
        <defs>
          <linearGradient id="bevel-${variant}-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${c[0]}"/>
            <stop offset="30%" stop-color="${c[1]}"/>
            <stop offset="70%" stop-color="${c[2]}"/>
            <stop offset="100%" stop-color="${c[3]}"/>
          </linearGradient>
        </defs>
        <ellipse cx="45" cy="36" rx="40" ry="15" fill="${c[2]}" opacity="0.5"/>
        <ellipse cx="45" cy="30" rx="40" ry="16" fill="url(#bevel-${variant}-${idx})" stroke="#ffffff" stroke-width="1.2"/>
        <ellipse cx="45" cy="28" rx="34" ry="13" fill="none" stroke="${c[3]}" stroke-width="1.5" stroke-opacity="0.8"/>
        <ellipse cx="45" cy="27" rx="24" ry="9" fill="${c[1]}" stroke="${c[2]}" stroke-width="1"/>
        ${variant === 'done'
          ? '<path d="M37 27 L43 32 L54 21" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
          : `<ellipse cx="45" cy="27" rx="14" ry="5" fill="none" stroke="${c[3]}" stroke-width="1.2"/>`}
      </svg>
    </div>`;
}

function activeRingSvg(idx) {
  return `
    <div class="active-blue-ring-wrap">
      <svg viewBox="0 0 100 60" class="blue-ring-svg">
        <defs>
          <filter id="neon-glow-${idx}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="ringGrad-${idx}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#60a5fa" />
            <stop offset="45%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1e40af" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="30" rx="46" ry="24" fill="#3b82f6" opacity="0.35" filter="url(#neon-glow-${idx})" />
        <ellipse cx="50" cy="30" rx="42" ry="20" fill="none" stroke="url(#ringGrad-${idx})" stroke-width="7" />
        <ellipse cx="50" cy="30" rx="26" ry="10" fill="#ffffff" opacity="0.95" />
      </svg>
    </div>
    <div class="active-mascot-float">
      <img src="assets/mascot.png" alt="" class="mascot-float-img" />
    </div>`;
}

function statusLabel(key, p) {
  const st = stepStatus(key, p.id);
  if (st === 'proved') return '✓ Proved';
  if (st === 'reviewed') return 'Solution viewed';
  return stepMeta[p.id] && stepMeta[p.id].kind === 'concept' ? 'Concept' : 'Problem';
}

function renderPath() {
  const key = activeCourseKey;
  const ps = coursesData[key].problems;
  const current = currentStepIndex(key);
  const height = NODE_TOP + (ps.length - 1) * NODE_GAP + 110;

  pathTrack.style.height = height + 'px';
  pathSvg.setAttribute('viewBox', `0 0 480 ${height}`);

  let d = '';
  ps.forEach((_, i) => {
    const cx = nodeLeft(i) + 50;
    const cy = NODE_TOP + i * NODE_GAP + 30;
    if (i === 0) d += `M ${cx},${cy}`;
    else {
      const px = nodeLeft(i - 1) + 50;
      const py = NODE_TOP + (i - 1) * NODE_GAP + 30;
      const my = (py + cy) / 2;
      d += ` C ${px},${my} ${cx},${my} ${cx},${cy}`;
    }
  });
  pathSvg.querySelectorAll('path').forEach(el => el.setAttribute('d', d));

  dynamicPathNodes.innerHTML = '';
  ps.forEach((p, i) => {
    const st = stepStatus(key, p.id);
    const isCurrent = i === current;
    const nodeEl = document.createElement('div');
    nodeEl.className = 'path-node'
      + (isCurrent ? ' node-current' : '')
      + (st === 'proved' ? ' node-completed' : '')
      + (i === selectedStep ? ' node-selected' : '');
    nodeEl.style.top = `${NODE_TOP + i * NODE_GAP}px`;
    nodeEl.style.left = `${nodeLeft(i)}px`;
    nodeEl.setAttribute('role', 'button');
    nodeEl.setAttribute('tabindex', '0');
    nodeEl.setAttribute('aria-label', `Step ${i + 1}: ${stepMeta[p.id].node}`);

    const pedestal = isCurrent ? activeRingSvg(i)
      : pedestalSvg(st === 'proved' ? 'done' : (st === 'reviewed' ? 'reviewed' : 'grey'), i);

    nodeEl.innerHTML = `
      <div class="node-pedestal-wrapper">${pedestal}</div>
      <div class="node-label label-right">
        <span class="node-title">${escapeHtml(stepMeta[p.id].node)}</span>
        <span class="node-sub">${statusLabel(key, p)}</span>
      </div>`;

    const choose = () => { selectStep(i); };
    nodeEl.addEventListener('click', (e) => { e.stopPropagation(); choose(); });
    nodeEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
    });
    dynamicPathNodes.appendChild(nodeEl);
  });

  const total = ps.length;
  const proved = provedCount(key);
  courseCardSections.textContent = `${total} steps`;
  courseCardChallenges.textContent = `${proved}/${total} proved`;
}

function selectStep(i) {
  const key = activeCourseKey;
  const ps = coursesData[key].problems;
  selectedStep = Math.max(0, Math.min(i, ps.length - 1));
  const p = ps[selectedStep];
  const meta = stepMeta[p.id];
  const st = stepStatus(key, p.id);

  dynamicPathNodes.querySelectorAll('.path-node').forEach((el, idx) => {
    el.classList.toggle('node-selected', idx === selectedStep);
  });

  popupNodeMeta.textContent = `Step ${selectedStep + 1} of ${ps.length} · ${meta.kind === 'concept' ? 'Concept' : 'Problem'}`
    + (st === 'proved' ? ' · ✓ Proved' : st === 'reviewed' ? ' · Solution viewed' : '');
  popupNodeTitle.textContent = meta.node;
  popupNodeDesc.textContent = meta.desc;
  startLessonBtn.textContent = isGuestLoginRequired()
    ? 'Login to Continue'
    : (st === 'proved' ? 'Practice again' : (st === 'reviewed' ? 'Prove it yourself' : 'Start'));
}

function loadCourse(courseKey, stepIdx) {
  const data = coursesData[courseKey];
  if (!data) return;
  activeCourseKey = courseKey;
  state.lastCourse = courseKey;
  saveState();

  crumbCategory.textContent = data.category;
  crumbCourseTitle.textContent = data.title;
  courseCardImg.src = data.img;
  courseCardImg.alt = data.title;
  courseCardTitle.textContent = data.title;
  courseCardDesc.textContent = data.desc;
  pathBannerLevel.textContent = data.bannerLevel;
  pathBannerTitle.textContent = data.bannerTitle;

  const current = currentStepIndex(courseKey);
  selectedStep = (typeof stepIdx === 'number') ? stepIdx : (current === -1 ? 0 : current);
  renderPath();
  selectStep(selectedStep);
}

// ==========================================
// HOME VIEW
// ==========================================
const homeProgress = document.getElementById('home-progress');
const homeContinueBtn = document.getElementById('home-continue-btn');

function renderHome() {
  if (!homeProgress) return;
  homeProgress.innerHTML = Object.keys(coursesData).map(key => {
    const c = coursesData[key];
    const total = c.problems.length;
    const proved = provedCount(key);
    const pct = Math.round((proved / total) * 100);
    return `
      <button type="button" class="home-course-card" data-course="${key}">
        <img src="${c.img}" alt="" class="home-course-img" />
        <span class="home-course-body">
          <span class="home-course-top">
            <span class="home-course-title">${escapeHtml(c.title)}</span>
            <span class="home-course-meta">${proved} / ${total} proved</span>
          </span>
          <span class="home-course-desc">${escapeHtml(c.desc)}</span>
          <span class="home-course-bar"><span style="width:${pct}%"></span></span>
        </span>
      </button>`;
  }).join('');
  homeProgress.querySelectorAll('.home-course-card').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-course')));
  });
  if (homeContinueBtn) {
    const anyProgress = Object.keys(state.courses).some(k => Object.keys(state.courses[k] || {}).length > 0);
    homeContinueBtn.textContent = anyProgress ? 'Continue learning' : 'Start with Parity';
  }
}

if (homeContinueBtn) {
  homeContinueBtn.addEventListener('click', () => {
    switchView(state.lastCourse && coursesData[state.lastCourse] ? state.lastCourse : 'parity');
  });
}

// ==========================================
// ROUTING & VIEW SWITCHING
// ==========================================
// ==========================================
// "YOU" VIEW: LEARNING ACTIVITY
// ==========================================
let youPeriod = 'week';
let youOffset = 0;
const DAY_MS = 86400000;

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtFull(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function computeRange(period, offset) {
  const today = startOfDay(new Date());
  const events = Array.isArray(state.activity) ? state.activity : [];
  let start, lastDay, buckets = [], navLabel = '';

  if (period === 'week') {
    const dow = (today.getDay() + 6) % 7; // Monday = 0
    start = addDays(today, -dow + offset * 7);
    lastDay = new Date(Math.min(addDays(start, 6).getTime(), today.getTime()));
    for (let d = new Date(start); d <= lastDay; d = addDays(d, 1)) {
      buckets.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), s: d.getTime(), e: addDays(d, 1).getTime() });
    }
    const sameMonth = start.getMonth() === lastDay.getMonth();
    navLabel = `Week of ${fmtShort(start)}–${sameMonth ? lastDay.getDate() : fmtShort(lastDay)}, ${lastDay.getFullYear()}`;
  } else if (period === 'month') {
    start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    lastDay = new Date(Math.min(monthEnd.getTime(), today.getTime()));
    for (let d = new Date(start); d <= lastDay; d = addDays(d, 1)) {
      const n = d.getDate();
      buckets.push({ label: (n === 1 || n % 5 === 0) ? String(n) : '', s: d.getTime(), e: addDays(d, 1).getTime() });
    }
    navLabel = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } else if (period === 'year') {
    const y = today.getFullYear() + offset;
    start = new Date(y, 0, 1);
    const lastMonth = offset === 0 ? today.getMonth() : 11;
    lastDay = offset === 0 ? today : new Date(y, 11, 31);
    for (let m = 0; m <= lastMonth; m++) {
      buckets.push({ label: new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short' }), s: new Date(y, m, 1).getTime(), e: new Date(y, m + 1, 1).getTime() });
    }
    navLabel = String(y);
  } else {
    const first = events.length ? startOfDay(new Date(Math.min.apply(null, events.map(ev => ev.t)))) : today;
    start = new Date(first.getFullYear(), first.getMonth(), 1);
    lastDay = today;
    for (let d = new Date(start); d <= today; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      buckets.push({ label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), s: d.getTime(), e: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() });
    }
    navLabel = 'All time';
  }
  const endExclusive = addDays(lastDay, 1).getTime();
  return { start, lastDay, startMs: start.getTime(), endMs: endExclusive, buckets, navLabel, period };
}

function periodStats(range) {
  const evs = (Array.isArray(state.activity) ? state.activity : []).filter(ev => ev.t >= range.startMs && ev.t < range.endMs);
  const ok = evs.filter(ev => ev.ok);
  const days = new Set(evs.map(ev => startOfDay(new Date(ev.t)).getTime())).size;
  return {
    events: evs,
    attempts: evs.length,
    proofs: ok.length,
    stepsProved: evs.filter(ev => ev.first).length,
    accuracy: evs.length ? Math.round((ok.length / evs.length) * 1000) / 10 : null,
    days
  };
}

function renderYou() {
  const range = computeRange(youPeriod, youOffset);
  const st = periodStats(range);
  const names = { week: 'Weekly', month: 'Monthly', year: 'Yearly', all: 'All-time' };
  const nouns = { week: 'week', month: 'month', year: 'year', all: 'period' };
  const noun = nouns[youPeriod];

  document.querySelectorAll('#you-seg .you-seg-btn').forEach(b => {
    const selected = b.dataset.period === youPeriod;
    b.classList.toggle('active', selected);
    b.setAttribute('aria-selected', String(selected));
  });
  document.getElementById('you-period-label').textContent = range.navLabel;
  document.getElementById('you-prev').style.visibility = youPeriod === 'all' ? 'hidden' : 'visible';
  document.getElementById('you-next').style.visibility = youPeriod === 'all' ? 'hidden' : 'visible';
  document.getElementById('you-next').disabled = youOffset >= 0;
  document.getElementById('you-period-label').style.visibility = 'visible';

  const rangeText = `${fmtShort(range.start)} – ${fmtFull(range.lastDay)}`;
  document.getElementById('you-summary-title').textContent = `${names[youPeriod]} summary`;
  document.getElementById('you-summary-range').textContent = rangeText;
  document.getElementById('you-chart-range').textContent = rangeText;

  // Summary bullets
  const lastEv = (state.activity || []).slice(-1)[0];
  const courseKey = (lastEv && coursesData[lastEv.c]) ? lastEv.c : (coursesData[state.lastCourse] ? state.lastCourse : 'parity');
  const course = coursesData[courseKey];
  const pct = Math.round((provedCount(courseKey) / course.problems.length) * 100);
  const when = youOffset === 0 ? (youPeriod === 'all' ? 'so far' : `this ${noun}`) : `in this ${noun}`;
  const bullets = [];
  if (st.days === 0) {
    bullets.push(youOffset === 0
      ? `No proofs checked yet ${when}. One complete proof today starts your streak.`
      : `You didn’t practice ${when}.`);
  } else {
    const opener = st.days >= 3 ? 'Great momentum!' : 'Nice and steady!';
    bullets.push(`${opener} You practiced on <strong>${st.days}</strong> day${st.days === 1 ? '' : 's'} ${when} and proved <strong>${st.stepsProved}</strong> new step${st.stepsProved === 1 ? '' : 's'}.`);
  }
  bullets.push(`You’re now <strong>${pct}%</strong> through ${escapeHtml(course.title)}.`);
  document.getElementById('you-summary-list').innerHTML = bullets.map(b => `<li>${b}</li>`).join('');

  // Stat cards
  document.getElementById('you-stat-steps').textContent = st.stepsProved;
  document.getElementById('you-stat-accuracy').textContent = st.accuracy === null ? '—' : st.accuracy.toFixed(1) + '%';
  const deltaEl = document.getElementById('you-stat-delta');
  deltaEl.innerHTML = '';
  if (youPeriod !== 'all' && st.accuracy !== null) {
    const prev = periodStats(computeRange(youPeriod, youOffset - 1));
    if (prev.accuracy !== null) {
      const diff = Math.round((st.accuracy - prev.accuracy) * 10) / 10;
      const up = diff >= 0;
      deltaEl.innerHTML = `<span class="${up ? 'delta-up' : 'delta-down'}">${up ? '▲' : '▼'} ${Math.abs(diff).toFixed(1)}%</span><small>From last ${noun}</small>`;
    }
  }

  // Chart
  const counts = range.buckets.map(b => st.events.filter(ev => ev.ok && ev.t >= b.s && ev.t < b.e).length);
  const peak = Math.max.apply(null, counts.concat([0]));
  const top = Math.max(4, Math.ceil(peak / 4) * 4);
  const ticks = [0, 1, 2, 3, 4].map(i => (top / 4) * i);
  const manyBars = range.buckets.length > 14;
  document.getElementById('you-chart').innerHTML = `
    <div class="you-chart-grid">
      ${ticks.map(v => `<div class="you-grid-row" style="bottom:${(v / top) * 100}%"><span>${v}</span></div>`).join('')}
      <div class="you-bars${manyBars ? ' dense' : ''}">
        ${range.buckets.map((b, i) => `
          <div class="you-bar-col" title="${counts[i]} proof${counts[i] === 1 ? '' : 's'}">
            <div class="you-bar" style="height:${(counts[i] / top) * 100}%"></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="you-x-labels${manyBars ? ' dense' : ''}">
      ${range.buckets.map(b => `<span>${b.label}</span>`).join('')}
    </div>`;
}

document.querySelectorAll('#you-seg .you-seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    youPeriod = btn.dataset.period;
    youOffset = 0;
    renderYou();
  });
});
document.getElementById('you-prev').addEventListener('click', () => { youOffset -= 1; renderYou(); });
document.getElementById('you-next').addEventListener('click', () => { if (youOffset < 0) { youOffset += 1; renderYou(); } });

function switchView(target, push = true, stepIdx) {
  if (exerciseModal.classList.contains('active')) closeExercise();
  if (appModalBackdrop.style.display === 'flex') closeAppModal();
  [homeView, topicsView, courseView, youView].forEach(v => v.classList.remove('active'));
  navHome.classList.remove('active');
  navTopics.classList.remove('active');
  if (navYou) navYou.classList.remove('active');

  if (target === 'home') {
    renderHome();
    homeView.classList.add('active');
    navHome.classList.add('active');
  } else if (target === 'you') {
    renderYou();
    youView.classList.add('active');
    if (navYou) navYou.classList.add('active');
  } else if (coursesData[target]) {
    loadCourse(target, stepIdx);
    courseView.classList.add('active');
    navTopics.classList.add('active');
  } else {
    target = 'topics';
    topicsView.classList.add('active');
    navTopics.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (push && window.location.hash !== '#' + target) {
    history.pushState(null, '', '#' + target);
  }
}

const homeBrowseTopics = document.getElementById('home-browse-topics');
if (homeBrowseTopics) {
  homeBrowseTopics.addEventListener('click', (e) => { e.preventDefault(); switchView('topics'); });
}
navHome.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
brandLink.addEventListener('click', (e) => { e.preventDefault(); switchView('home'); });
navTopics.addEventListener('click', (e) => { e.preventDefault(); switchView('topics'); });
if (navYou) {
  navYou.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('you');
  });
}
backToTopics.addEventListener('click', (e) => { e.preventDefault(); switchView('topics'); });

function bindCard(card, handler) {
  card.addEventListener('click', handler);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
  });
}
document.querySelectorAll('.card-launch-course').forEach(card => {
  bindCard(card, () => switchView(card.getAttribute('data-course')));
});
document.querySelectorAll('.card-launch-proof').forEach(card => {
  bindCard(card, () => switchView('proof-foundations', true, parseInt(card.getAttribute('data-step') || '0', 10)));
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  switchView(hash || 'home', false);
});

document.querySelectorAll('.topic-row.expandable .topic-main').forEach(main => {
  main.querySelector('.chevron-btn')?.setAttribute('aria-expanded', 'false');
  main.addEventListener('click', (e) => {
    if (e.target.closest('.star-btn')) return;
    const row = main.closest('.topic-row');
    if (row) {
      const expanded = row.classList.toggle('expanded');
      row.querySelector('.chevron-btn')?.setAttribute('aria-expanded', String(expanded));
    }
  });
});

document.querySelectorAll('.star-btn').forEach(btn => {
  const row = btn.closest('.topic-row');
  const id = row ? row.id : null;
  if (id && state.favorites[id]) btn.classList.add('favorited');
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.classList.toggle('favorited');
    if (id) {
      state.favorites[id] = btn.classList.contains('favorited');
      saveState();
      if (currentUser && supabaseClient) {
        syncFavoriteToCloud(id, state.favorites[id]);
      }
    }
  });
});

// ==========================================
// EXERCISE ENGINE
// ==========================================
function currentProblem() { return coursesData[activeCourseKey].problems[currentStep]; }

function hintLadder(p) {
  const h = p.progressiveHints || {};
  // attempt4 spells out the full proof, so it lives in the solution, not the hint ladder
  return [p.curatedHint, h.attempt1, h.attempt2, h.attempt3].filter(Boolean);
}

function setCheckButton(mode, label, disabled) {
  checkMode = mode;
  checkBtn.className = 'exercise-check-btn' + (mode === 'advance' || mode === 'close' ? ' is-next' : '');
  checkBtn.innerHTML = label;
  checkBtn.disabled = !!disabled;
}

function renderProgress() {
  const ps = coursesData[activeCourseKey].problems;
  const done = ps.filter(p => stepStatus(activeCourseKey, p.id)).length;
  progressFill.style.width = Math.round((done / ps.length) * 100) + '%';
  progressDots.innerHTML = ps.map((p, i) => {
    const st = stepStatus(activeCourseKey, p.id);
    let cls = 'dot';
    if (st === 'proved') cls += ' completed';
    else if (st === 'reviewed') cls += ' reviewed';
    if (i === currentStep) cls += ' active';
    return `<span class="${cls}" title="Step ${i + 1}: ${escapeHtml(stepMeta[p.id].node)}"></span>`;
  }).join('');
}

function renderHints() {
  const p = currentProblem();
  const ladder = hintLadder(p);
  const used = session.hints[p.id] || 0;
  const left = ladder.length - used;

  curatedHintText.innerHTML = used === 0 ? '' : ladder.slice(0, used).map((h, i) => `
    <span class="hint-item"><span class="hint-level">Hint ${i + 1}</span>${escapeHtml(h)}</span>`).join('');

  btnRequestHint.innerHTML = left > 0
    ? `<span>💡</span> ${used === 0 ? 'Request Hint' : 'Next Hint'} <span class="tool-count">${left} left</span>`
    : `<span>💡</span> Show hints`;
  btnRequestHint.disabled = ladder.length === 0;
}

function updateSolutionButton() {
  const p = currentProblem();
  const attempts = session.attempts[p.id] || 0;
  const used = session.hints[p.id] || 0;
  const unlocked = !evaluating && (attempts > 0 || used >= hintLadder(p).length || !!stepStatus(activeCourseKey, p.id));
  btnViewSolution.disabled = !unlocked;
  btnViewSolution.title = unlocked ? 'View the reference solution' : 'Unlocks after your first attempt (or once all hints are used)';
}

function clearFeedback() {
  feedbackMessage.className = 'feedback-message';
  feedbackIcon.innerHTML = '';
  feedbackTitle.textContent = '';
  feedbackExplanation.innerHTML = '';
}

function refreshSubmitState() {
  if (checkMode !== 'submit' || evaluating) return;
  const p = currentProblem();
  const text = proofInput.value.trim();
  const unchanged = text === (session.lastSubmitted[p.id] || null);
  checkBtn.disabled = text.length < 1 || unchanged;
}

function renderStep(idx) {
  if (evaluating) delete session.lastSubmitted[currentProblem().id];
  evaluationGeneration++;
  evaluating = false;
  stopCelebration();
  const course = coursesData[activeCourseKey];
  const ps = course.problems;
  currentStep = idx;
  const p = ps[idx];
  const meta = stepMeta[p.id];
  const attempts = session.attempts[p.id] || 0;

  materialBox.style.display = '';
  answeringBox.style.display = '';
  lessonComplete.style.display = 'none';

  stepBadge.textContent = `Step ${idx + 1} of ${ps.length} · ${meta.kind === 'concept' ? 'Concept' : 'Problem'}`;
  lessonCategoryLabel.textContent = p.category;
  questionHeadline.textContent = p.title;
  questionText.textContent = p.text;
  questionVisual.innerHTML = p.visual || '';

  renderProgress();
  clearFeedback();

  proofInput.value = session.drafts[p.id] || '';
  proofInput.readOnly = false;
  proofInput.disabled = false;
  proofInput.placeholder = meta.rubric && meta.rubric.answer === 'prove'
    ? 'Write your proof: set up what you know, then show step by step why the statement must be true…'
    : 'Start with your answer (yes / no / a number), then explain why it must be true…';
  updateWordCount();

  attemptBadge.textContent = 'Attempt ' + (attempts + 1);
  updateAiStatusBadge();

  curatedHintBox.style.display = (session.hints[p.id] || 0) > 0 ? '' : 'none';
  renderHints();
  updateSolutionButton();

  setCheckButton('submit', 'Check Proof', true);
  refreshSubmitState();
  if (stepStatus(activeCourseKey, p.id) === 'proved') {
    feedbackMessage.className = 'feedback-message success show';
    feedbackTitle.textContent = 'Already proved';
    feedbackExplanation.textContent = 'You completed this proof. Continue to the next step or edit your argument to practice again.';
    setCheckButton('advance', idx === ps.length - 1 ? 'Finish Lesson' : 'Next Step →', false);
  }
}

function updateWordCount() {
  const text = proofInput.value.trim();
  const n = text.length > 0 ? text.split(/\s+/).length : 0;
  charCount.textContent = `${n} word${n === 1 ? '' : 's'}`;
}

proofInput.addEventListener('input', () => {
  if (checkMode === 'advance' && stepStatus(activeCourseKey, currentProblem().id) === 'proved') {
    clearFeedback();
    setCheckButton('submit', 'Check Proof', true);
  }
  updateWordCount();
  session.drafts[currentProblem().id] = proofInput.value;
  refreshSubmitState();
});

proofInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (!checkBtn.disabled) checkBtn.click();
  }
});

// ---------- Hints ----------
btnRequestHint.addEventListener('click', () => {
  if (evaluating) return;
  const p = currentProblem();
  const ladder = hintLadder(p);
  const used = session.hints[p.id] || 0;
  if (curatedHintBox.style.display === 'none' && used > 0 && used >= ladder.length) {
    curatedHintBox.style.display = '';
    return;
  }
  if (used < ladder.length) session.hints[p.id] = used + 1;
  curatedHintBox.style.display = '';
  renderHints();
  updateSolutionButton();
});

btnCloseHint.addEventListener('click', () => { curatedHintBox.style.display = 'none'; });

// ---------- Reference solution ----------
function openSolution() {
  if (evaluating) return;
  const p = currentProblem();
  const sol = p.curatedSolution;
  if (!sol) return;
  const nl = (s) => escapeHtml(s).replace(/\n/g, '<br>');
  solutionModalHeading.textContent = `Reference Solution: ${p.title}`;
  solutionModalContent.innerHTML = `
    <div class="sol-block highlight">
      <div class="sol-block-title">⚙️ Technique</div>
      <p class="sol-block-content">${nl(sol.technique)}</p>
    </div>
    <div class="sol-block">
      <div class="sol-block-title">📝 Setup</div>
      <p class="sol-block-content">${nl(sol.setup)}</p>
    </div>
    <div class="sol-block">
      <div class="sol-block-title">🔍 Step-by-step proof</div>
      <p class="sol-block-content">${nl(sol.steps)}</p>
    </div>
    <div class="sol-block highlight">
      <div class="sol-block-title">⚡ Conclusion</div>
      <p class="sol-block-content">${nl(sol.conclusion)}</p>
    </div>
    <div class="sol-block">
      <div class="sol-block-title">⚠️ Common pitfalls</div>
      <p class="sol-block-content">${nl(sol.commonMistakes)}</p>
    </div>`;
  solutionModal.style.display = 'flex';
  btnCloseSolutionModal.focus();
  btnSolutionProceed.textContent = currentStep < coursesData[activeCourseKey].problems.length - 1 ? 'Next step →' : 'Finish lesson';

  if (stepStatus(activeCourseKey, p.id) !== 'proved') {
    setStepStatus(activeCourseKey, p.id, 'reviewed');
    if (currentUser && !currentUser.isLocalFallback) migrateGuestProgressToCloud(currentUser.id);
    showReviewedState();
  }
  renderProgress();
}

function showReviewedState() {
  const isLast = currentStep >= coursesData[activeCourseKey].problems.length - 1;
  feedbackMessage.className = 'feedback-message uncertain show';
  feedbackIcon.innerHTML = '📖';
  feedbackTitle.textContent = 'Solution reviewed';
  feedbackExplanation.innerHTML = `
    <div class="mentor-feedback-flow">
      <p class="mentor-section-body">Reading a proof is a start, but writing one is how it sticks. Close the solution and rewrite the argument in your own words. The mentor will check it and the step will count as <strong>proved</strong>.</p>
      <div><button type="button" class="tool-btn rewrite-btn" id="btn-rewrite">✍️ Write it in my own words</button></div>
    </div>`;
  setCheckButton('advance', isLast ? 'Finish Lesson' : 'Next Step →', false);
  document.getElementById('btn-rewrite').addEventListener('click', () => {
    clearFeedback();
    proofInput.readOnly = false;
    delete session.lastSubmitted[currentProblem().id];
    setCheckButton('submit', 'Check Proof', true);
    proofInput.focus();
    refreshSubmitState();
  });
}

function closeSolution() {
  if (solutionModal.contains(document.activeElement)) btnViewSolution.focus();
  solutionModal.style.display = 'none';
}

btnViewSolution.addEventListener('click', openSolution);
btnCloseSolutionModal.addEventListener('click', closeSolution);
btnDismissSolution.addEventListener('click', closeSolution);
btnSolutionProceed.addEventListener('click', () => { closeSolution(); goNext(); });
solutionModal.addEventListener('click', (e) => { if (e.target === solutionModal) closeSolution(); });

// ---------- Navigation ----------
function openExercise(stepIdx) {
  if (isGuestLoginRequired()) {
    openAppModal('guest-gate');
    return;
  }
  exerciseModal.classList.add('active');
  exerciseModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderStep(stepIdx);
  proofInput.focus();
}

function closeExercise() {
  if (evaluating) delete session.lastSubmitted[currentProblem().id];
  evaluationGeneration++;
  evaluating = false;
  startLessonBtn.focus();
  stopCelebration();
  closeSolution();
  exerciseModal.classList.remove('active');
  exerciseModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const current = currentStepIndex(activeCourseKey);
  selectedStep = current === -1 ? Math.min(currentStep, coursesData[activeCourseKey].problems.length - 1) : current;
  renderPath();
  selectStep(selectedStep);
}

function goNext() {
  const ps = coursesData[activeCourseKey].problems;
  if (currentStep < ps.length - 1) {
    renderStep(currentStep + 1);
    exerciseModal.scrollTop = 0;
    proofInput.focus();
  } else {
    showLessonComplete();
  }
}

function showLessonComplete() {
  const key = activeCourseKey;
  const ps = coursesData[key].problems;
  const proved = ps.filter(p => stepStatus(key, p.id) === 'proved').length;
  const reviewed = ps.filter(p => stepStatus(key, p.id) === 'reviewed').length;
  const open = ps.length - proved - reviewed;
  const allProved = proved === ps.length;

  materialBox.style.display = 'none';
  answeringBox.style.display = 'none';
  clearFeedback();
  renderProgress();
  progressDots.querySelectorAll('.dot').forEach(d => d.classList.remove('active'));

  lessonComplete.style.display = '';
  lessonComplete.innerHTML = `
    <img src="assets/mascot.png" alt="" class="complete-mascot" />
    <h2 class="complete-title">${allProved ? 'Course mastered!' : 'Lesson complete'}</h2>
    <p class="complete-sub">${allProved
      ? `You proved every step of ${escapeHtml(coursesData[key].title)} in your own words.`
      : 'Nice work. Steps you only read the solution for are worth revisiting: proving them yourself is what builds the skill.'}</p>
    <div class="complete-stats">
      <div class="complete-stat"><span class="complete-num">${proved}</span><span>Proved yourself</span></div>
      <div class="complete-stat"><span class="complete-num">${reviewed}</span><span>Solution viewed</span></div>
      <div class="complete-stat"><span class="complete-num">${open}</span><span>Not attempted</span></div>
      <div class="complete-stat"><span class="complete-num">⚡ ${state.xp}</span><span>Total XP</span></div>
    </div>`;
  setCheckButton('close', 'Back to Course', false);
}

startLessonBtn.addEventListener('click', () => openExercise(selectedStep));
exerciseClose.addEventListener('click', closeExercise);


// ==========================================
// SOCRATIC PROOF MENTOR
// Rubric-driven: it checks the claim and each key idea of a complete
// proof, then asks a Socratic question about the FIRST missing idea.
// It never hands over the missing idea itself.
// ==========================================

// ==========================================
// GEMINI AI INTEGRATION & EVALUATION
// ==========================================
function updateAiStatusBadge() {
  if (!aiStatusDot || !aiStatusLabel || !btnAiStatus) return;
  const hasPersonalKey = !!(state.geminiApiKey && state.geminiApiKey.trim());
  const hasServerAi = !hasPersonalKey && !!state.serverGeminiActive;
  const m = state.geminiModel || DEFAULT_GEMINI_MODEL;
  const labelText = formatModelLabel(m);

  if (hasPersonalKey || hasServerAi) {
    aiStatusDot.className = 'ai-status-dot live';
    aiStatusLabel.textContent = '✨ ' + labelText + ' Live';
    btnAiStatus.title = 'Connected to Verity Cloud Gemini AI (' + labelText + '). Click to view settings.';
  } else {
    aiStatusDot.className = 'ai-status-dot offline';
    aiStatusLabel.textContent = 'Rule-based (Offline)';
    btnAiStatus.title = 'Running built-in Socratic rule engine.';
  }
}


function renderMentorFeedback(result, pid) {
  const isLiveGemini = result.engine === 'gemini';
  const engineLabel = isLiveGemini
    ? '✨ Evaluated by ' + formatModelLabel(result.modelName || DEFAULT_GEMINI_MODEL)
    : '⚡ Evaluated by Socratic Rule Engine';

  const fallbackNoticeHtml = result.fallbackNotice ? `
    <div class="gemini-fallback-warning">⚠️ ${escapeHtml(result.fallbackNotice)}</div>` : '';

  const establishedHtml = result.established && result.established.length ? `
    <div class="mentor-section established">
      <div class="mentor-section-header">✓ What your proof already shows</div>
      <ul class="established-list">${result.established.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
    </div>` : '';

  const isReconsider = result.status === 'reconsider' || result.status === 'incorrect-claim';
  feedbackMessage.className = 'feedback-message ' + (isReconsider ? 'error' : 'partial') + ' show';
  feedbackIcon.innerHTML = isReconsider ? '🤔' : '💡';
  feedbackTitle.textContent = result.title || (isReconsider ? 'Recheck your claim' : 'Keep going');
  feedbackExplanation.innerHTML = `
    <div class="mentor-feedback-flow">
      <div class="ai-engine-tag ${isLiveGemini ? 'gemini' : 'local'}">${escapeHtml(engineLabel)}</div>
      ${fallbackNoticeHtml}
      ${establishedHtml}
      <div class="socratic-question-card">
        <div class="socratic-header">
          <span>❓ Mentor question</span>
        </div>
        <p class="socratic-question-text">${escapeHtml(result.question || 'How does this claim lead logically to the required conclusion?')}</p>
      </div>
    </div>`;
}

checkBtn.addEventListener('click', async () => {
  if (evaluating || checkBtn.disabled) return;
  if (checkMode === 'advance') {
    goNext();
    return;
  }
  if (checkMode === 'close') { closeExercise(); return; }

  const p = currentProblem();
  const pid = p.id;
  const userText = proofInput.value.trim();
  if (!userText || userText === session.lastSubmitted[pid]) return;

  const generation = ++evaluationGeneration;
  evaluating = true;
  session.lastSubmitted[pid] = userText;
  session.attempts[pid] = (session.attempts[pid] || 0) + 1;
  if (!session.history[pid]) session.history[pid] = [];
  session.history[pid].push(userText);
  if (session.history[pid].length > 10) session.history[pid].shift();
  const cumulativeText = session.history[pid].join(' ').slice(-100000);
  updateSolutionButton();

  const hasPersonalKey = !!(state.geminiApiKey && state.geminiApiKey.trim());
  const usingGemini = hasPersonalKey || !!state.serverGeminiActive;

  checkBtn.disabled = true;
  let evalStageTimer = null;
  if (usingGemini) {
    checkBtn.innerHTML = '<span class="ai-evaluating-state"><span class="ai-spinner"></span> ✨ Analyzing proof logic…</span>';
    let stageIdx = 0;
    const stages = [
      '✨ Verifying deductive chain…',
      '✨ Checking mathematical invariants…',
      '✨ Formulating mentor feedback…'
    ];
    evalStageTimer = setInterval(() => {
      if (generation === evaluationGeneration && stageIdx < stages.length) {
        checkBtn.innerHTML = '<span class="ai-evaluating-state"><span class="ai-spinner"></span> ' + stages[stageIdx++] + '</span>';
      }
    }, 1200);
  } else {
    checkBtn.innerHTML = '<span class="ai-evaluating-state"><span class="ai-spinner"></span> Mentor is reading your proof…</span>';
  }
  proofInput.readOnly = true;

  let result = null;
  let fallbackNotice = null;

  if (usingGemini) {
    try {
      if (hasPersonalKey) {
        result = await callGeminiEvaluation(userText, cumulativeText, p, state.geminiApiKey, state.geminiModel, (statusText) => {
          if (generation !== evaluationGeneration) return;
          checkBtn.innerHTML = '<span class="ai-evaluating-state"><span class="ai-spinner"></span> ' + escapeHtml(statusText) + '</span>';
        });
      } else {
        result = await callServerGeminiEvaluation(userText, cumulativeText, p, state.geminiModel, (statusText) => {
          if (generation !== evaluationGeneration) return;
          checkBtn.innerHTML = '<span class="ai-evaluating-state"><span class="ai-spinner"></span> ' + escapeHtml(statusText) + '</span>';
        });
      }
      result = validateEvaluation(result);
    } catch (err) {
      console.error('Gemini evaluation failed:', err);
      fallbackNotice = 'Gemini error: ' + (err.message || 'Network error') + '. (Using local Socratic engine for this attempt)';
      result = evaluateProof(userText, cumulativeText, p);
      result.fallbackNotice = fallbackNotice;
    }
  } else {
    await new Promise(r => setTimeout(r, 450));
    result = evaluateProof(userText, cumulativeText, p);
  }

  if (evalStageTimer) clearInterval(evalStageTimer);
  if (generation !== evaluationGeneration || currentProblem().id !== pid) return;
  evaluating = false;
  updateSolutionButton();
  proofInput.readOnly = false;
  attemptBadge.textContent = 'Attempt ' + (session.attempts[pid] + 1);
  logActivity(activeCourseKey, pid, result.status === 'complete', result.status === 'complete' && stepStatus(activeCourseKey, pid) !== 'proved');

  if (result.status === 'complete') {
    const firstTime = stepStatus(activeCourseKey, pid) !== 'proved';
    const hintsUsed = session.hints[pid] || 0;
    const gain = firstTime ? Math.max(4, 10 - hintsUsed * 2) : 0;
    setStepStatus(activeCourseKey, pid, 'proved');
    if (gain) { state.xp += gain; saveState(); updateXpDisplay(); }
    renderProgress();

    if (currentUser && supabaseClient) {
      saveStepToCloud(activeCourseKey, pid, result, gain, hintsUsed, userText);
    }

    const isLiveGemini = result.engine === 'gemini';
    const engineLabel = isLiveGemini
      ? '✨ Evaluated by ' + formatModelLabel(result.modelName || DEFAULT_GEMINI_MODEL)
      : '⚡ Evaluated by Socratic Rule Engine';
    const fallbackNoticeHtml = result.fallbackNotice ? `
      <div class="gemini-fallback-warning">⚠️ ${escapeHtml(result.fallbackNotice)}</div>` : '';

    feedbackMessage.className = 'feedback-message success show';
    feedbackIcon.innerHTML = '✨';
    feedbackTitle.textContent = result.title || 'Proof complete!';
    feedbackExplanation.innerHTML = `
      <div class="mentor-feedback-flow">
        <div class="ai-engine-tag ${isLiveGemini ? 'gemini' : 'local'}">${escapeHtml(engineLabel)}</div>
        ${fallbackNoticeHtml}
        <div class="mentor-section established">
          <div class="mentor-section-header">🌟 Why your proof works</div>
          <p class="mentor-section-body">${escapeHtml(result.success || 'Your reasoning is complete, rigorous, and logically connected.')}</p>
        </div>
        <p class="reward-line">${gain ? `⚡ +${gain} XP` : 'Already proved earlier: great practice!'}${hintsUsed ? ` · ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'} used` : (firstTime ? ' · proved independently' : '')}</p>
      </div>`;
    proofInput.readOnly = true;
    const isLast = currentStep >= coursesData[activeCourseKey].problems.length - 1;
    setCheckButton('advance', isLast ? 'Finish Lesson' : 'Next Step →', false);
    celebrateProof(checkBtn);
  } else {
    renderMentorFeedback(result, pid);
    setCheckButton('submit', 'Check Again', true);
    refreshSubmitState();
    proofInput.focus();
  }
});

// ==========================================
// MENU DROPDOWN (SETTINGS, ABOUT, HELP, LOG OUT)
// ==========================================
const menuBtn = document.getElementById('menu-btn');
const menuDropdown = document.getElementById('menu-dropdown');
const menuAbout = document.getElementById('menu-about');
const menuHelp = document.getElementById('menu-help');

const navSyncPill = document.getElementById('nav-sync-pill');
const menuUserHeader = document.getElementById('menu-user-header');
const menuUserName = document.getElementById('menu-user-name');
const menuUserEmail = document.getElementById('menu-user-email');
const menuAuthAction = document.getElementById('menu-auth-action');
const menuDemoLogin = document.getElementById('menu-demo-login');

const appModalBackdrop = document.getElementById('app-modal-backdrop');
const appModalTitle = document.getElementById('app-modal-title');
const appModalBody = document.getElementById('app-modal-body');
const appModalClose = document.getElementById('app-modal-close');

// ==========================================
// SUPABASE & CLOUD PERSISTENCE
// ==========================================
let supabaseClient = null;
let supabaseInitializedUrl = '';
let currentUser = state.authUser?.isLocalFallback ? state.authUser : null;
let authSubscription = null;
let serverConfigLoaded = false;

function getSupabaseConfig() {
  const config = window.__VERITY_CONFIG__ || {};
  const url = (config.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const key = (config.supabaseAnonKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const isConfigured = !!(url && key && !url.includes('xyzcompany') && !url.includes('YOUR_PROJECT'));
  return { url, key, isConfigured };
}

async function ensureServerConfig() {
  if (serverConfigLoaded) {
    return getSupabaseConfig();
  }
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (res.ok) {
      const cfg = await res.json();
      if (cfg && typeof cfg === 'object') {
        window.__VERITY_CONFIG__ = Object.assign({}, window.__VERITY_CONFIG__ || {}, cfg);
        let changed = false;
        if (cfg.supabaseUrl && state.supabaseUrl !== cfg.supabaseUrl) {
          state.supabaseUrl = cfg.supabaseUrl;
          changed = true;
        }
        if (cfg.supabaseAnonKey && state.supabaseAnonKey !== cfg.supabaseAnonKey) {
          state.supabaseAnonKey = cfg.supabaseAnonKey;
          changed = true;
        }
        if (typeof cfg.hasServerGemini === 'boolean' && state.serverGeminiActive !== cfg.hasServerGemini) {
          state.serverGeminiActive = cfg.hasServerGemini;
          changed = true;
        }
        if (Array.isArray(cfg.availableModels) && cfg.availableModels.length > 0) {
          state.geminiModels = filterGeminiModels(cfg.availableModels);
          changed = true;
        }
        if (isSupportedGeminiModel(cfg.bestModel) && (!state.geminiModel || !state.geminiModels.includes(state.geminiModel))) {
          state.geminiModel = cfg.bestModel;
          changed = true;
        }
        serverConfigLoaded = true;
        if (changed) {
          saveState();
          updateAiStatusBadge();
        }
        initSupabase();
      }
    }
  } catch (_) {}
  return getSupabaseConfig();
}

function setActiveUser(user) {
  const previousId = state.authUser?.id;
  if (previousId && previousId !== user?.id) {
    if (exerciseModal.classList.contains('active')) closeExercise();
    archiveProgress(state);
    Object.assign(state, { xp: 0, courses: {}, favorites: {}, activity: [], lastCourse: null });
    Object.keys(session).forEach(key => { session[key] = {}; });
    evaluationGeneration++;
    evaluating = false;
    updateXpDisplay();
    document.querySelectorAll('.star-btn').forEach(button => button.classList.remove('favorited'));
  }
  currentUser = user || null;
  if (currentUser) {
    state.authUser = {
      id: currentUser.id,
      email: currentUser.email || '',
      user_metadata: currentUser.user_metadata || {},
      isDemo: !!currentUser.isDemo,
      isLocalFallback: !!currentUser.isLocalFallback
    };
  } else {
    state.authUser = null;
  }
  saveState();
  updateAuthUi(currentUser);
  if (courseView.classList.contains('active')) selectStep(selectedStep);
  if (homeView.classList.contains('active')) renderHome();
  if (youView.classList.contains('active')) renderYou();
}

function initSupabase() {
  try {
    const cfg = getSupabaseConfig();
    if (cfg.isConfigured) {
      if (!supabaseClient || supabaseInitializedUrl !== cfg.url + cfg.key) {
        authSubscription?.unsubscribe();
        supabaseClient = createClient(cfg.url, cfg.key);
        supabaseInitializedUrl = cfg.url + cfg.key;

        supabaseClient.auth.getSession().then(({ data }) => {
          if (data && data.session && data.session.user) {
            setActiveUser(data.session.user);
            fetchCloudState(data.session.user.id);
          } else if (state.authUser?.isLocalFallback) {
            setActiveUser(state.authUser);
          } else {
            setActiveUser(null);
          }
        }).catch(() => {});

        const { data: listener } = supabaseClient.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            setActiveUser(session.user);
            if (event === 'SIGNED_IN') {
              setTimeout(async () => {
                if (currentUser?.id !== session.user.id) return;
                await fetchCloudState(session.user.id);
                await migrateGuestProgressToCloud(session.user.id);
              }, 0);
            }
          } else if (event === 'SIGNED_OUT') setActiveUser(null);
        });
        authSubscription = listener.subscription;
      }
    } else {
      if (state.authUser?.isLocalFallback) {
        currentUser = state.authUser;
      }
      updateAuthUi(currentUser);
    }
  } catch (err) {
    console.warn('Supabase initialization deferred:', err);
  }
}

function isGuestLoginRequired() {
  return guestLoginRequired(currentUser);
}

async function handleDemoLogin() {
  setActiveUser({ id: 'local-demo', email: '', user_metadata: { full_name: 'Demo Learner' }, isDemo: true, isLocalFallback: true });
  closeAppModal();
}

async function signOutAccount() {
  try {
    if (supabaseClient && currentUser && !currentUser.isLocalFallback) {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    }
    setActiveUser(null);
    closeAppModal();
    switchView('home');
  } catch (error) { alert('Sign out failed: ' + error.message); }
}

function updateAuthUi(user) {
  if (user) {
    const name = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Learner');
    if (navSyncPill) navSyncPill.style.display = user.isLocalFallback ? 'none' : 'inline';
    if (menuDemoLogin) menuDemoLogin.style.display = 'none';

    menuUserHeader.style.display = 'flex';
    menuUserName.textContent = name;
    menuUserEmail.textContent = user.email || '';
    menuAuthAction.textContent = 'Sign Out';
  } else {
    if (navSyncPill) navSyncPill.style.display = 'none';
    if (menuDemoLogin) menuDemoLogin.style.display = 'flex';

    menuUserHeader.style.display = 'none';
    menuUserName.textContent = 'Learner';
    menuUserEmail.textContent = '';
    menuAuthAction.textContent = 'Sign In / Sign Up';
  }
}

function toggleMenu(force) {
  const open = typeof force === 'boolean' ? force : !menuDropdown.classList.contains('open');
  if (!open && menuDropdown.contains(document.activeElement)) menuBtn.focus();
  menuDropdown.classList.toggle('open', open);
  menuDropdown.setAttribute('aria-hidden', String(!open));
  menuBtn.setAttribute('aria-expanded', String(open));
}

menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMenu();
});

document.addEventListener('click', (e) => {
  if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
    toggleMenu(false);
  }
});

function buildModelOptionsHtml(modelsList, currentModel) {
  const supported = filterGeminiModels(modelsList);
  const list = supported.length ? supported : DEFAULT_GEMINI_MODELS.slice();
  if (isSupportedGeminiModel(currentModel) && !list.includes(currentModel)) {
    list.unshift(currentModel);
  }
  return list.map((m, idx) => {
    const tag = idx === 0 ? ' (Recommended)' : '';
    return `<option value="${escapeHtml(m)}" ${m === currentModel ? 'selected' : ''}>${escapeHtml(m)}${tag}</option>`;
  }).join('');
}

function openAppModal(type, initialTab) {
  toggleMenu(false);
  appModalBackdrop.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  appModalBackdrop.setAttribute('aria-hidden', 'false');

  if (type === 'settings') {
    appModalTitle.textContent = 'Settings & Progress';
    const keys = Object.keys(coursesData);
    let totalSteps = 0, totalProved = 0;
    keys.forEach(k => {
      totalSteps += coursesData[k].problems.length;
      totalProved += provedCount(k);
    });
    const isLive = !!(state.serverGeminiActive || (state.geminiApiKey && state.geminiApiKey.trim()));
    const curModel = state.geminiModel || DEFAULT_GEMINI_MODEL;
    const optionsHtml = buildModelOptionsHtml(state.geminiModels, curModel);
    const signedInName = currentUser
      ? (currentUser.user_metadata?.full_name || (currentUser.email ? currentUser.email.split('@')[0] : 'Learner'))
      : '';
    const signedInEmail = currentUser ? (currentUser.email || '') : '';

    appModalBody.innerHTML = renderSettings({ state, currentUser, totalProved, totalSteps, isLive, optionsHtml, signedInName, signedInEmail });

    const resetBtn = document.getElementById('btn-modal-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset progress cached on this device? Progress saved in your cloud account is kept.')) {
          archiveProgress(state);
          Object.assign(state, { xp: 0, courses: {}, favorites: {}, lastCourse: null, activity: [] });
          saveState();
          Object.keys(session).forEach(k => { session[k] = {}; });
          updateXpDisplay();
          updateAiStatusBadge();
          document.querySelectorAll('.star-btn').forEach(b => b.classList.remove('favorited'));
          closeAppModal();
          switchView(window.location.hash.replace('#', '') || 'home', false);
        }
      });
    }

    const modelSelect = document.getElementById('select-gemini-model');
    const geminiStatusMsg = document.getElementById('gemini-status-msg');
    const settingsAccountBtn = document.getElementById('btn-settings-account');

    if (modelSelect) {
      modelSelect.addEventListener('change', () => {
        state.geminiModel = modelSelect.value;
        saveState();
        updateAiStatusBadge();
        if (geminiStatusMsg) {
          geminiStatusMsg.style.display = 'block';
          geminiStatusMsg.className = 'gemini-status-msg success';
          geminiStatusMsg.innerHTML = '✅ Active reasoning model switched to <strong>' + escapeHtml(formatModelLabel(modelSelect.value)) + '</strong>.';
        }
      });
    }

    if (settingsAccountBtn) {
      settingsAccountBtn.addEventListener('click', () => {
        if (currentUser) {
          signOutAccount();
        } else {
          openAppModal('auth', 'signin');
        }
      });
    }
  } else if (type === 'about') {
    appModalTitle.textContent = 'About Verity';
    appModalBody.innerHTML = renderAbout();
  } else if (type === 'help') {
    appModalTitle.textContent = 'How to Prove on Verity';
    appModalBody.innerHTML = renderHelp();
  } else if (type === 'auth') {
    let currentAuthMode = initialTab === 'signup' ? 'signup' : 'signin';
    appModalTitle.textContent = currentAuthMode === 'signup' ? 'Create Free Account' : 'Sign In to Verity';
    appModalBody.innerHTML = renderAuth({ currentAuthMode });

    const demoAuthBtn = document.getElementById('btn-auth-demo');
    const tabSignIn = document.getElementById('auth-tab-signin');
    const tabSignUp = document.getElementById('auth-tab-signup');
    const authForm = document.getElementById('auth-form');
    const nameGroup = document.getElementById('auth-name-group');
    const nameInput = document.getElementById('input-auth-name');
    const emailInput = document.getElementById('input-auth-email');
    const pwdInput = document.getElementById('input-auth-password');
    const submitAuthBtn = document.getElementById('btn-auth-submit');
    const switchAuthBtn = document.getElementById('auth-switch-btn');
    const switchLabel = document.getElementById('auth-switch-label');
    const statusMsg = document.getElementById('auth-status-msg');

    function setAuthMode(newMode) {
      currentAuthMode = newMode;
      appModalTitle.textContent = currentAuthMode === 'signup' ? 'Create Free Account' : 'Sign In to Verity';
      tabSignIn.classList.toggle('active', currentAuthMode === 'signin');
      tabSignUp.classList.toggle('active', currentAuthMode === 'signup');
      nameGroup.style.display = currentAuthMode === 'signup' ? 'flex' : 'none';
      submitAuthBtn.textContent = currentAuthMode === 'signup' ? 'Create Account & Save XP' : 'Sign In';
      switchLabel.textContent = currentAuthMode === 'signup' ? 'Already have an account?' : "Don't have an account yet?";
      switchAuthBtn.textContent = currentAuthMode === 'signup' ? 'Sign In' : 'Create Account';
      statusMsg.style.display = 'none';
    }

    if (demoAuthBtn) demoAuthBtn.addEventListener('click', handleDemoLogin);
    tabSignIn.addEventListener('click', () => setAuthMode('signin'));
    tabSignUp.addEventListener('click', () => setAuthMode('signup'));
    switchAuthBtn.addEventListener('click', () => setAuthMode(currentAuthMode === 'signup' ? 'signin' : 'signup'));

    async function handleAuthFormSubmit(e) {
      if (e) e.preventDefault();
      if (submitAuthBtn.disabled) return;
      const email = emailInput.value.trim().toLowerCase();
      const password = pwdInput.value;
      const name = nameInput ? nameInput.value.trim() : '';

      if (!email || !password) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'auth-status-msg error';
        statusMsg.textContent = 'Please enter both email and password.';
        return;
      }

      if (currentAuthMode === 'signup' && password.length < 6) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'auth-status-msg error';
        statusMsg.textContent = 'Password must be at least 6 characters long.';
        return;
      }

      submitAuthBtn.disabled = true;
      submitAuthBtn.textContent = 'Authenticating…';
      statusMsg.style.display = 'none';

      try {
        await ensureServerConfig();
        const result = await authenticate(supabaseClient, { mode: currentAuthMode, email, password, name });
        if (result.confirmationRequired) {
          statusMsg.style.display = 'block';
          statusMsg.className = 'auth-status-msg success';
          statusMsg.textContent = 'Check your email to confirm your account, then sign in.';
          return;
        }
        setActiveUser(result.user);
        await fetchCloudState(result.user.id);
        await migrateGuestProgressToCloud(result.user.id);
        closeAppModal();
      } catch (err) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'auth-status-msg error';
        statusMsg.textContent = err.message || 'Authentication error. Please check your credentials.';
      } finally {
        submitAuthBtn.disabled = false;
        submitAuthBtn.textContent = currentAuthMode === 'signup' ? 'Create Account & Save XP' : 'Sign In';
      }
    }

    if (authForm) authForm.addEventListener('submit', handleAuthFormSubmit);

  } else if (type === 'guest-gate') {
    appModalTitle.textContent = 'Login to Continue';
    appModalBody.innerHTML = renderGuestGate();

    const gateDemo = document.getElementById('btn-gate-demo');
    const gateSignUp = document.getElementById('btn-gate-signup');
    const gateSignIn = document.getElementById('btn-gate-signin');
    const gateDismiss = document.getElementById('btn-gate-dismiss');

    if (gateDemo) gateDemo.addEventListener('click', handleDemoLogin);
    if (gateSignUp) gateSignUp.addEventListener('click', () => openAppModal('auth', 'signup'));
    if (gateSignIn) gateSignIn.addEventListener('click', () => openAppModal('auth', 'signin'));
    if (gateDismiss) gateDismiss.addEventListener('click', closeAppModal);
  }
  appModalClose.focus();
}

function closeAppModal() {
  if (appModalBackdrop.contains(document.activeElement)) {
    (exerciseModal.classList.contains('active') ? proofInput : menuBtn).focus();
  }
  appModalBackdrop.style.display = 'none';
  document.body.style.overflow = exerciseModal.classList.contains('active') ? 'hidden' : '';
  appModalBackdrop.setAttribute('aria-hidden', 'true');
}

appModalClose.addEventListener('click', closeAppModal);
appModalBackdrop.addEventListener('click', (e) => {
  if (e.target === appModalBackdrop) closeAppModal();
});

document.getElementById('menu-settings').addEventListener('click', () => openAppModal('settings'));

menuAbout.addEventListener('click', () => openAppModal('about'));
menuHelp.addEventListener('click', () => openAppModal('help'));

if (menuDemoLogin) {
  menuDemoLogin.addEventListener('click', async () => {
    toggleMenu(false);
    await handleDemoLogin();
  });
}

menuAuthAction.addEventListener('click', () => {
  toggleMenu(false);
  if (currentUser) {
    signOutAccount();
  } else {
    openAppModal('auth', 'signin');
  }
});

document.addEventListener('keydown', (e) => {
  const dialog = appModalBackdrop.style.display === 'flex' ? appModalBackdrop
    : solutionModal.style.display === 'flex' ? solutionModal
    : exerciseModal.classList.contains('active') ? exerciseModal : null;
  trapDialogFocus(e, dialog);
  if (e.key === 'Escape') {
    if (appModalBackdrop.style.display === 'flex') closeAppModal();
    else if (solutionModal.style.display === 'flex') closeSolution();
    else if (exerciseModal.classList.contains('active')) closeExercise();
    else toggleMenu(false);
  }
});

// ==========================================
// INITIAL ROUTE
// ==========================================
(function initRoute() {
  updateAiStatusBadge();
  initSupabase();
  ensureServerConfig();

  if (state.geminiApiKey && state.geminiApiKey.trim()) {
    fetchAvailableGeminiModels(state.geminiApiKey).catch(() => {});
  }

  const hash = window.location.hash.replace('#', '');
  switchView(hash || 'home', false);
})();
