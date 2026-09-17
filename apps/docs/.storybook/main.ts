import type { StorybookConfig } from '@storybook/web-components-vite';
import react from '@vitejs/plugin-react';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
  ],
  framework: { name: '@storybook/web-components-vite', options: {} },
  docs: { defaultName: 'Overview' },
  typescript: { check: true },
  staticDirs: [{ from: '../../../packages/tokens/dist', to: '/tokens' }],

  /**
   * The framework here is web-components, because that is what the components
   * are. A handful of stories document the React layer — the React Hook Form
   * adapters — and those need JSX. Rather than running a second Storybook, we
   * add the React plugin scoped to `.tsx` and mount React into a container from
   * inside an otherwise ordinary web-components story.
   *
   * The alternative — a separate `@storybook/react` instance — means two dev
   * servers, two Chromatic projects and two a11y runs for one design system.
   */
  viteFinal: async config => {
    config.plugins = config.plugins ?? [];
    config.plugins.push(react({ include: /\.tsx$/ }));
    return config;
  },
};

export default config;
