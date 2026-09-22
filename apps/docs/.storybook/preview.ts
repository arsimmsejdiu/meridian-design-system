import type { Preview } from '@storybook/web-components';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '@meridian/tokens/css';
import { defineCustomElements } from '@meridian/components/loader';

/*
 * Registering the elements is an explicit call, not a side-effect import.
 *
 * The `dist` output is lazy: importing `@meridian/components` makes the
 * components *available*, it does not define the custom elements. Without this
 * line every `<mrd-*>` in a story renders as an unknown element — it still
 * shows its slotted text, so the canvas looks broadly right and only the
 * interaction tests notice, by way of `shadowRoot` being null.
 */
// Returns a promise that resolves once the definitions are registered. Stories
// render after it in practice, and the interaction tests wait on `shadowRoot`
// rather than assuming, so there is nothing useful to await here.
void defineCustomElements();

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
