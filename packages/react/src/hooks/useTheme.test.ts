import { act, renderHook } from '@testing-library/react';
import { useTheme } from './useTheme';

/** Controllable `prefers-color-scheme` stub. */
function mockMatchMedia(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<() => void>();

  window.matchMedia = ((query: string) => ({
    get matches() {
      return query.includes('dark') ? matches : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    addListener: (listener: () => void) => listeners.add(listener),
    removeListener: (listener: () => void) => listeners.delete(listener),
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;

  return {
    setDark(next: boolean) {
      matches = next;
      listeners.forEach(listener => listener());
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('useTheme', () => {
  it('defaults to system and leaves data-theme unset', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('resolves system to the OS preference', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());

    expect(result.current.resolved).toBe('dark');
  });

  it('follows the OS when the preference changes at runtime', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolved).toBe('light');

    act(() => media.setDark(true));

    expect(result.current.resolved).toBe('dark');
  });

  it('stops following the OS once an explicit theme is chosen', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme('light'));
    act(() => media.setDark(true));

    expect(result.current.resolved).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('persists the choice and restores it', () => {
    mockMatchMedia(false);
    const first = renderHook(() => useTheme());
    act(() => first.result.current.setTheme('dark'));
    first.unmount();

    const second = renderHook(() => useTheme());
    expect(second.result.current.theme).toBe('dark');
  });

  it('removes data-theme when switching back to system', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme('dark'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => result.current.setTheme('system'));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('ignores a corrupted stored value rather than applying it', () => {
    mockMatchMedia(false);
    localStorage.setItem('mrd-theme', 'solarized');

    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('system');
  });

  it('unsubscribes from the media query on unmount', () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useTheme());
    expect(media.listenerCount).toBeGreaterThan(0);

    unmount();
    expect(media.listenerCount).toBe(0);
  });
});
