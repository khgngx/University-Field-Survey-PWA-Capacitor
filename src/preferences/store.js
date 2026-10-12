// User preferences for the preferences bar, persisted in localStorage. Pure apart from the
// storage it is given, so it can be unit-tested in Node.
export const OPTIONS = Object.freeze({
  theme: ['light', 'dark', 'system'],
  language: ['vi', 'en'],
  display: ['web', 'mobile'],
})

export const DEFAULTS = Object.freeze({ theme: 'system', language: 'vi', display: 'web' })

// Also read by the inline script in index.html, which sets the theme before first paint.
export const STORAGE_KEY = 'vku-survey:preferences'

// Accepts whatever was stored and falls back to the default for anything missing or unknown.
export function parsePreferences(raw) {
  let stored = {}
  try {
    stored = JSON.parse(raw ?? '{}') ?? {}
  } catch {
    // Corrupt JSON is treated like an empty store; the next change overwrites it.
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(OPTIONS).map(([name, allowed]) => [name, allowed.includes(stored[name]) ? stored[name] : DEFAULTS[name]]),
    ),
  )
}

export const resolveTheme = (theme, systemPrefersDark) => (theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : theme)

// `storage` is a Storage-like object, or null when none is available (the choice then lasts
// until the page is closed).
export function createPreferencesStore(storage) {
  const listeners = new Set()
  let current = DEFAULTS
  try {
    current = parsePreferences(storage?.getItem(STORAGE_KEY))
  } catch (err) {
    console.warn('Could not read saved preferences:', err.message)
  }

  return {
    get: () => current,
    set(patch) {
      const next = parsePreferences(JSON.stringify({ ...current, ...patch }))
      if (Object.keys(OPTIONS).every((name) => next[name] === current[name])) return
      current = next
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        // Private mode or a full quota: the change still applies to this session.
        console.warn('Could not save preferences:', err.message)
      }
      listeners.forEach((listener) => listener())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

function browserStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null // reading the property itself throws when storage access is blocked
  }
}

export const preferences = createPreferencesStore(browserStorage())
