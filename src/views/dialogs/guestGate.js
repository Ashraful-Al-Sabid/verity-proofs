export function renderGuestGate() {
  return `
      <div class="guest-gate-card">
        <div class="guest-gate-badge">🔐</div>
        <h4 class="guest-gate-title">Log in to start practicing</h4>
        <p class="guest-gate-desc">
          Sign in, create a free account, or choose Demo Login before submitting a proof.
        </p>

        <div class="guest-gate-features">
          <div class="guest-feature-item">
            <span>⚡</span>
            <span><strong>Save your XP & streak:</strong> Keep your earned progress safely in the cloud.</span>
          </div>
          <div class="guest-feature-item">
            <span>☁️</span>
            <span><strong>Cross-device sync:</strong> Pick up exactly where you left off on desktop or phone.</span>
          </div>
          <div class="guest-feature-item">
            <span>🧠</span>
            <span><strong>Keep practicing:</strong> Revise your proof and explore all 21 challenges.</span>
          </div>
          <div class="guest-feature-item">
            <span>✨</span>
            <span><strong>Personalized Socratic guidance:</strong> Olympiad feedback tailored to your deductions.</span>
          </div>
        </div>

        <div id="gate-status-msg" class="auth-status-msg" style="display:none;margin-bottom:10px;"></div>

        <div class="guest-gate-actions">
          <button type="button" id="btn-gate-google" class="btn-google-signin" style="margin-bottom:6px;">
            <svg class="btn-google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
          <button type="button" id="btn-gate-demo" class="btn-demo-signin" style="margin-bottom:6px;">
            <span class="btn-demo-icon">⚡</span>
            <div class="btn-demo-text">
              <span class="btn-demo-title">Demo Login</span>
              <span class="btn-demo-sub">Explore all 21 proofs on this device</span>
            </div>
          </button>
          <button type="button" id="btn-gate-signup" class="btn-guest-signup">
            Create Free Account & Save XP
          </button>
          <button type="button" id="btn-gate-signin" class="btn-guest-signin">
            Sign In to Existing Account
          </button>
          <button type="button" id="btn-gate-dismiss" class="btn-guest-dismiss">
            Maybe Later
          </button>
        </div>
      </div>
    `;
}
