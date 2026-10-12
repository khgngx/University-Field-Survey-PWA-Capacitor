import { preferences, resolveTheme } from './store'

const listeners = new Set()
let resolvedTheme = 'light'

export const getResolvedTheme = () => resolvedTheme

export function subscribeResolvedTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Mirrors the theme and language preferences onto <html> and the theme-color meta tag. It runs
// outside React, synchronously on every change, so the new CSS variables are already in place
// when components re-render and read them (the charts do).
export function startDocumentSync() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
  const root = document.documentElement

  function apply() {
    const { theme, language } = preferences.get()
    const next = resolveTheme(theme, systemDark.matches)
    root.dataset.theme = next
    root.lang = language
    const canvas = getComputedStyle(root).getPropertyValue('--color-canvas').trim()
    if (canvas) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', canvas)
    if (next === resolvedTheme) return
    resolvedTheme = next
    listeners.forEach((listener) => listener())
  }

  apply()
  preferences.subscribe(apply)
  systemDark.addEventListener('change', apply)
}
