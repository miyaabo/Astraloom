/**
 * Reports and watches document.visibilityState so the render loop can pause
 * while the tab/app is backgrounded (see PRODUCT.md Performance Rules).
 * Falls back to always-visible where `document` is unavailable (e.g. some test environments).
 */
export function watchVisibility(
  onChange: (visible: boolean) => void,
): () => void {
  if (typeof document === 'undefined') {
    onChange(true)
    return () => {}
  }

  onChange(document.visibilityState === 'visible')

  const listener = () => onChange(document.visibilityState === 'visible')
  document.addEventListener('visibilitychange', listener)
  return () => document.removeEventListener('visibilitychange', listener)
}
