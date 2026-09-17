import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = Exclude<Theme, 'system'>;

const STORAGE_KEY = 'mrd-theme';
const QUERY = '(prefers-color-scheme: dark)';

/* ---------------------------------------------------- system-preference store */

function subscribeToSystem(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const mql = window.matchMedia(QUERY);

  if (mql.addEventListener) {
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
    };
  }

  /*
   * Safari below 14 has no addEventListener on MediaQueryList. The deprecated
   * pair is the only way to reach those browsers, and a theme that silently
   * stops following the system is worse than using a deprecated API.
   */
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  mql.addListener(onChange);
  return () => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    mql.removeListener(onChange);
  };
}

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches ? 'dark' : 'light';

/** On the server there is no preference to read; light is the safer default. */
const getSystemThemeOnServer = (): ResolvedTheme => 'light';

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    // Private mode, or storage blocked by policy. Not a reason to fail.
    return 'system';
  }
}

/**
 * Theme control.
 *
 * Three states, not two. `system` is the default and is not the same as
 * `light`: it follows the operating system and keeps following it when the user
 * switches at sunset. Tokens do the rest — `[data-theme]` swaps the semantic
 * layer, and the `prefers-color-scheme` block in the generated CSS covers
 * `system` with no JavaScript at all.
 *
 * `resolved` reads through `useSyncExternalStore` rather than being computed in
 * render, so an OS-level change repaints immediately and server rendering does
 * not touch `window`.
 *
 * To avoid a flash of the wrong theme on first paint, inline this in `<head>`
 * before the stylesheet:
 *
 * ```html
 * <script>
 *   try {
 *     var t = localStorage.getItem('mrd-theme');
 *     if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
 *   } catch (e) {}
 * </script>
 * ```
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme);

  const systemTheme = useSyncExternalStore(
    subscribeToSystem,
    getSystemTheme,
    getSystemThemeOnServer,
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore — the theme still applies for this session */
    }
  }, [theme]);

  /** Keep other tabs in step. */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setThemeState(readStoredTheme());
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const resolved: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  return { theme, resolved, setTheme } as const;
}
