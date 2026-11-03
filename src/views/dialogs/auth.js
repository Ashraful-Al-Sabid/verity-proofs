export function renderAuth({ currentAuthMode }) {
  return `
      <div class="auth-modal-content">
        <button type="button" id="btn-auth-demo" class="btn-demo-signin">
          <span class="btn-demo-icon">⚡</span>
          <div class="btn-demo-text">
            <span class="btn-demo-title">Demo Login</span>
            <span class="btn-demo-sub">Explore all lessons on this device</span>
          </div>
        </button>

        <div class="auth-divider">or email</div>

        <div class="auth-tabs">
          <button type="button" class="auth-tab ${currentAuthMode === 'signin' ? 'active' : ''}" id="auth-tab-signin">Sign In</button>
          <button type="button" class="auth-tab ${currentAuthMode === 'signup' ? 'active' : ''}" id="auth-tab-signup">Create Account</button>
        </div>

        <div id="auth-status-msg" class="auth-status-msg" style="display:none;"></div>

        <form id="auth-form" style="display:flex;flex-direction:column;gap:12px;">
          <div class="auth-form-group" id="auth-name-group" style="${currentAuthMode === 'signup' ? '' : 'display:none;'}">
            <label class="auth-label" for="input-auth-name">Your Name</label>
            <input type="text" id="input-auth-name" class="auth-input" placeholder="Euler" autocomplete="name">
          </div>

          <div class="auth-form-group">
            <label class="auth-label" for="input-auth-email">Email Address</label>
            <input type="email" id="input-auth-email" class="auth-input" placeholder="you@domain.com" required autocomplete="email">
          </div>

          <div class="auth-form-group">
            <label class="auth-label" for="input-auth-password">Password</label>
            <input type="password" id="input-auth-password" class="auth-input" placeholder="••••••••" required autocomplete="current-password">
          </div>

          <button type="submit" id="btn-auth-submit" class="btn-auth-submit">
            ${currentAuthMode === 'signup' ? 'Create Account & Save XP' : 'Sign In'}
          </button>
        </form>

        <p class="auth-switch-text">
          <span id="auth-switch-label">${currentAuthMode === 'signup' ? 'Already have an account?' : "Don't have an account yet?"}</span>
          <button type="button" id="auth-switch-btn" class="auth-switch-link">${currentAuthMode === 'signup' ? 'Sign In' : 'Create Account'}</button>
        </p>
      </div>
    `;
}
