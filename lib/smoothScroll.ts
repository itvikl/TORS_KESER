/**
 * Custom eased scroll (rather than native `behavior: "smooth"`, whose
 * duration varies by browser) so the jump between search and results reads
 * as "the page is moving," not an abrupt cut to somewhere else.
 */
export function smoothScrollTo(top: number, duration = 700) {
  const startY = window.scrollY;
  const distance = top - startY;
  if (distance === 0) return;
  const startTime = performance.now();

  function step(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    window.scrollTo(0, startY + distance * eased);
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}
