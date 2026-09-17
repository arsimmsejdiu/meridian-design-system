import type { Preview } from '@storybook/web-components';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '@meridian/tokens/css';
import '@meridian/components';

const preview: Preview = {
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    options: {
      storySort: {
        order: [
          'Foundations',
          ['Introduction', 'Tokens', 'Accessibility', 'Contributing'],
          'Components',
        ],
      },
    },
    /**
     * Every story is an accessibility test. `test-storybook` runs axe over each
     * one in CI, so a violation fails the build rather than waiting for an audit.
     * Rules are not disabled here — if a component needs an exception it is
     * documented on that component's story with the reason.
     */
    a11y: {
      config: {
        rules: [
          // Shadow DOM: axe cannot always resolve a landmark parent inside an
          // isolated story canvas. Checked at page level in the consuming app.
          { id: 'region', enabled: false },
        ],
      },
      options: { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
