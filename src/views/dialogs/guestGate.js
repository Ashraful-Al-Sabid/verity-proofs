export function renderGuestGate() {
  return `
      <div class="guest-gate-card">
        <div class="guest-gate-badge">🎉</div>
        <h4 class="guest-gate-title">First Proof Complete!</h4>
        <p class="guest-gate-desc">
          You've constructed and completed your first rigorous mathematical proof on Verity.
          To save your earned XP, track your streak, and unlock the remaining 20 interactive proofs, create your free account or sign in now.
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
            <span><strong>20 more challenges:</strong> Invariants, Pigeonhole Principle, Proof Foundations & more.</span>
          </div>
          <div class="guest-feature-item">
            <span>✨</span>
            <span><strong>Personalized Socratic guidance:</strong> Olympiad feedback tailored to your deductions.</span>
          </div>
        </div>

        <div class="guest-gate-actions">
          <button type="button" id="btn-gate-demo" class="btn-demo-signin" style="margin-bottom:6px;">
            <span class="btn-demo-icon">⚡</span>
            <div class="btn-demo-text">
              <span class="btn-demo-title">Try Demo</span>
              <span class="btn-demo-sub">Explore all 21 proofs on this device</span>
            </div>
          </button>
          <button type="button" id="btn-gate-signup" class="btn-guest-signup">
            Create Free Account & Save XP
          </button>
          <button type="button" id="btn-gate-signin" class="btn-guest-signin">
            Sign In to Existing Account
          </button>
          <button type="button" id="btn-gate-continue-guest" class="btn-guest-continue">
            Continue as Guest (Keep Testing Proofs)
          </button>
          <button type="button" id="btn-gate-dismiss" class="btn-guest-dismiss">
            Review My Solved Proof
          </button>
        </div>
      </div>
    `;
}
