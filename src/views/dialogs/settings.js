import { escapeHtml } from '../../lib/html.js';

export function renderSettings({ state, currentUser, totalProved, totalSteps, isLive, optionsHtml, signedInName, signedInEmail }) {
  return `
      <div class="settings-modal-content">
        <div class="settings-stats-row">
          <div class="settings-stat-pill">
            <span class="settings-stat-num">⚡ ${state.xp}</span>
            <span class="settings-stat-label">Total XP</span>
          </div>
          <div class="settings-stat-pill">
            <span class="settings-stat-num">${totalProved} / ${totalSteps}</span>
            <span class="settings-stat-label">Steps Proved</span>
          </div>
        </div>

        <div class="gemini-settings-card">
          <div class="gemini-card-header">
            <div class="gemini-card-title-wrap">
              <span class="gemini-sparkle-icon">✨</span>
              <h4 class="gemini-card-title">Google Gemini AI Mentor</h4>
            </div>
            <span class="gemini-connection-pill ${isLive ? 'connected' : 'offline'}">
              ${isLive ? '● Cloud AI Active' : '● Socratic Engine'}
            </span>
          </div>
          <p class="gemini-card-desc">
            Powered automatically by Verity's server-hosted Gemini reasoning — no personal API keys required. Select your preferred reasoning model below.
          </p>

          <div class="gemini-form-group">
            <label class="gemini-field-label" for="select-gemini-model">Gemini Reasoning Model</label>
            <select id="select-gemini-model" class="gemini-model-select">
              ${optionsHtml}
            </select>
          </div>

          <div id="gemini-status-msg" class="gemini-status-msg" style="display:none;"></div>
        </div>

        <div class="supabase-settings-card">
          <div class="gemini-card-header">
            <div class="gemini-card-title-wrap">
              <span class="gemini-sparkle-icon">☁️</span>
              <h4 class="gemini-card-title">Account & Cloud Sync</h4>
            </div>
            <span class="gemini-connection-pill ${currentUser ? 'connected' : 'offline'}">
              ${currentUser?.isLocalFallback ? '○ Local Demo' : currentUser ? '● Signed In' : '○ Guest Session'}
            </span>
          </div>
          <p class="gemini-card-desc">
            ${currentUser?.isLocalFallback
              ? 'Demo progress is saved on this device. Sign out and create an account to use cloud sync.'
              : currentUser
              ? 'Signed in as <strong>' + escapeHtml(signedInName) + '</strong> (' + escapeHtml(signedInEmail) + '). Your XP, completed proofs, and favorites are automatically synced.'
              : 'You are currently in Guest Mode. Sign in to sync your XP across devices, or try the demo to explore all 21 proofs locally.'}
          </p>

          <div class="gemini-actions-row">
            <button type="button" id="btn-settings-account" class="btn-gemini-save">
              <span>${currentUser ? '🚪' : '⚡'}</span> ${currentUser ? 'Sign Out of Account' : 'Sign In / Create Account'}
            </button>
          </div>
        </div>

        <div class="settings-action-section">
          <p class="settings-desc">Your progress is automatically saved. You can reset progress cached on this device; cloud progress is kept.</p>
          <button type="button" class="btn-danger-reset" id="btn-modal-reset">Reset Local Progress</button>
        </div>
      </div>
    `;
}
