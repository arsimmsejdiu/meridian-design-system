/**
 * Scroll lock without layout shift.
 *
 * `overflow: hidden` on the body removes the scrollbar, which reflows the page
 * by its width — the classic "everything jumps 15px when a modal opens". We
 * compensate with padding, and reference-count so nested overlays don't
 * unlock early.
 */
let locks = 0;
let previousOverflow = '';
let previousPaddingRight = '';

const scrollbarWidth = (): number => window.innerWidth - document.documentElement.clientWidth;

export function lockScroll(): void {
  if (locks++ > 0) return;

  const { body } = document;
  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;

  const gap = scrollbarWidth();
  if (gap > 0) {
    const current = parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${current + gap}px`;
  }
  body.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  if (locks === 0) return;
  if (--locks > 0) return;

  const { body } = document;
  body.style.overflow = previousOverflow;
  body.style.paddingRight = previousPaddingRight;
}
