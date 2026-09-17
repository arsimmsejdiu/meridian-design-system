import type { TestRunnerConfig } from '@storybook/test-runner';
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright';

/**
 * Runs axe against every story in a real browser.
 *
 * The important part is `detailedReport` — a CI failure that only says
 * "accessibility violation" gets ignored. One that names the element, the rule
 * and the fix gets fixed.
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page, context) {
    await configureAxe(page, {
      rules: [{ id: 'region', enabled: false }],
    });

    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
  },
};

export default config;
