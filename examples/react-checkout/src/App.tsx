import type { ReactElement } from 'react';
import { useTheme } from '@meridian/react';
import { Checkout } from './Checkout';

export function App(): ReactElement {
  const { theme, setTheme, resolved } = useTheme();

  return (
    <>
      {/* First thing in the tab order, visible only once focused. */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-header">
        <span className="wordmark">Meridian</span>

        <label className="theme-switch">
          <span className="visually-hidden">Colour theme</span>
          <select
            value={theme}
            onChange={event => {
              setTheme(event.target.value as typeof theme);
            }}
          >
            <option value="system">System ({resolved})</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </header>

      <main id="main" tabIndex={-1}>
        <h1>Checkout</h1>
        <Checkout />
      </main>

      <footer className="site-footer">
        <p>
          A worked example. Every control on this page is a custom element from{' '}
          <code>@meridian/components</code>, driven by React Hook Form through{' '}
          <code>@meridian/react</code>.
        </p>
      </footer>
    </>
  );
}
