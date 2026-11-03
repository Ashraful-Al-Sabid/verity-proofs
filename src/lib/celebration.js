let stopActive = () => {};

export function stopCelebration() {
  stopActive();
}

/** A brief spray of gold paper from the accepted proof's submit button. */
export function celebrateProof(button) {
  stopCelebration();
  if (!button || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'proof-confetti';
  Object.assign(canvas.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '10000'
  });
  const context = canvas.getContext('2d');
  if (!context) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  document.body.append(canvas);

  const bounds = button.getBoundingClientRect();
  const originX = bounds.left + bounds.width / 2;
  const originY = bounds.top + Math.min(bounds.height / 2, 20);
  const colors = ['#ffd700', '#e9ad20', '#ffe9a3', '#c88a14', '#fff2bd'];
  const particles = Array.from({ length: width < 600 ? 65 : 95 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const speed = 430 + Math.random() * 430;
    return {
      x: originX + (Math.random() - 0.5) * Math.min(bounds.width, 90), y: originY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5, rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 12, phase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  });

  let frame;
  let started;
  let previous;
  function cleanup() {
    cancelAnimationFrame(frame);
    canvas.remove();
    document.removeEventListener('visibilitychange', cleanup);
    window.removeEventListener('resize', cleanup);
    stopActive = () => {};
  }
  stopActive = cleanup;
  document.addEventListener('visibilitychange', cleanup, { once: true });
  window.addEventListener('resize', cleanup, { once: true });

  function draw(now) {
    started ??= now;
    previous ??= now;
    const elapsed = (now - started) / 1000;
    const delta = Math.min((now - previous) / 1000, 0.035);
    previous = now;
    context.clearRect(0, 0, width, height);
    if (elapsed > 2.1) { cleanup(); return; }
    context.globalAlpha = Math.min(1, (2.1 - elapsed) / 0.5);
    for (const particle of particles) {
      particle.vx *= Math.exp(-1.25 * delta);
      particle.vy += 760 * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.rotation += particle.spin * delta;
      context.save();
      context.translate(particle.x + Math.sin(elapsed * 8 + particle.phase) * 6, particle.y);
      context.rotate(particle.rotation);
      context.scale(1, Math.cos(elapsed * 11 + particle.phase) * 0.8 + 0.2);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      context.restore();
    }
    frame = requestAnimationFrame(draw);
  }
  frame = requestAnimationFrame(draw);
}
