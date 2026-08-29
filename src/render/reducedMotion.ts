/**
 * Reports and watches the OS/browser `prefers-reduced-motion` setting.
 * Falls back to `false` where `matchMedia` is unavailable (e.g. older browsers, some test environments).
 */
export function watchReducedMotion(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    onChange(false)
    return () => {}
  }

  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  onChange(query.matches)

  const listener = (event: MediaQueryListEvent) => onChange(event.matches)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
