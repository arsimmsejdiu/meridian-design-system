/**
 * Contrast audit — runs in CI, fails the build on a regression.
 *
 * A design system that ships an accessible-looking palette and no check will
 * drift the first time someone "just darkens the hover state". This asserts
 * every foreground/background pair we actually ship, per theme, against
 * WCAG 2.2 SC 1.4.3 (text) and 1.4.11 (non-text contrast).
 *
 * Usage: node build/audit-contrast.mjs [--json]
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Pairs we contractually guarantee. Adding a component usually adds a row here. */
const PAIRS = [
  // [foreground token, background token, minimum ratio, label]
  ['mrd-theme-text-primary', 'mrd-theme-surface-canvas', 4.5, 'Body text on canvas'],
  ['mrd-theme-text-secondary', 'mrd-theme-surface-canvas', 4.5, 'Secondary text on canvas'],
  ['mrd-theme-text-muted', 'mrd-theme-surface-canvas', 4.5, 'Muted text on canvas'],
  ['mrd-theme-text-primary', 'mrd-theme-surface-subtle', 4.5, 'Body text on subtle surface'],
  ['mrd-theme-text-link', 'mrd-theme-surface-canvas', 4.5, 'Link text on canvas'],
  [
    'mrd-theme-action-primary-text',
    'mrd-theme-action-primary-default',
    4.5,
    'Primary button label',
  ],
  [
    'mrd-theme-action-primary-text',
    'mrd-theme-action-primary-hover',
    4.5,
    'Primary button label, hover',
  ],
  ['mrd-theme-action-danger-text', 'mrd-theme-action-danger-default', 4.5, 'Danger button label'],
  ['mrd-theme-action-secondary-text', 'mrd-theme-surface-canvas', 4.5, 'Secondary button label'],
  ['mrd-theme-status-danger-text', 'mrd-theme-status-danger-surface', 4.5, 'Danger banner text'],
  ['mrd-theme-status-warning-text', 'mrd-theme-status-warning-surface', 4.5, 'Warning banner text'],
  ['mrd-theme-status-success-text', 'mrd-theme-status-success-surface', 4.5, 'Success banner text'],
  ['mrd-theme-status-info-text', 'mrd-theme-status-info-surface', 4.5, 'Info banner text'],
  // Non-text contrast (1.4.11) — 3:1 is the bar for UI component boundaries.
  ['mrd-theme-border-control', 'mrd-theme-surface-canvas', 3, 'Control border on canvas'],
  ['mrd-theme-border-control', 'mrd-theme-surface-raised', 3, 'Control border on raised'],
  ['mrd-theme-border-focus', 'mrd-theme-surface-canvas', 3, 'Focus ring on canvas'],
  ['mrd-theme-border-danger', 'mrd-theme-surface-canvas', 3, 'Error border on canvas'],
];

const hexToRgb = hex => {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? [...h].map(c => c + c).join('') : h;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
};

/** WCAG relative luminance. */
const luminance = ([r, g, b]) => {
  const [R, G, B] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
};

const contrast = (fg, bg) => {
  const [l1, l2] = [luminance(hexToRgb(fg)), luminance(hexToRgb(bg))].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

const grade = r => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA-large' : 'fail');

let failures = 0;
const results = [];

for (const theme of ['light', 'dark']) {
  const tokens = JSON.parse(readFileSync(`${root}/dist/tokens.${theme}.json`, 'utf8'));
  for (const [fgKey, bgKey, min, label] of PAIRS) {
    const fg = tokens[fgKey];
    const bg = tokens[bgKey];
    if (!fg || !bg) {
      console.error(`✖ ${theme}: missing token for "${label}" (${fgKey} / ${bgKey})`);
      failures++;
      continue;
    }
    if (!fg.startsWith('#') || !bg.startsWith('#')) continue; // skip transparent/rgba pairs
    const ratio = contrast(fg, bg);
    const pass = ratio >= min;
    if (!pass) failures++;
    results.push({
      theme,
      label,
      fg,
      bg,
      ratio: Number(ratio.toFixed(2)),
      min,
      grade: grade(ratio),
      pass,
    });
    const mark = pass ? '✔' : '✖';
    console.log(
      `${mark} ${theme.padEnd(5)} ${label.padEnd(34)} ${ratio.toFixed(2).padStart(6)}:1  (min ${min})  ${grade(ratio)}`,
    );
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(results, null, 2));
}

if (failures > 0) {
  console.error(`\n${failures} contrast requirement(s) not met. Fix the tokens, not the test.`);
  process.exit(1);
}
console.log('\nAll contrast requirements met.');
