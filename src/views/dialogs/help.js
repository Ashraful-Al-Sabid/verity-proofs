export function renderHelp() {
  return `
      <div class="help-modal-content">
        <div class="help-step-item">
          <span class="help-step-num">1</span>
          <div>
            <strong>Claim</strong>
            <p>State an unambiguous stance: <em>Possible</em> or <em>Impossible</em>, or the exact numerical count.</p>
          </div>
        </div>
        <div class="help-step-item">
          <span class="help-step-num">2</span>
          <div>
            <strong>Invariant</strong>
            <p>Identify what is preserved or alternates (e.g. alternating rotational directions, color parity, pairing partition).</p>
          </div>
        </div>
        <div class="help-step-item">
          <span class="help-step-num">3</span>
          <div>
            <strong>Proof Closure</strong>
            <p>Connect your invariant from start to finish to show why the contradiction or conclusion is inescapable.</p>
          </div>
        </div>
      </div>
    `;
}
