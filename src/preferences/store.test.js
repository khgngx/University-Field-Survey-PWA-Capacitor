import { describe, expect, it, vi } from 'vitest'
import { DEFAULTS, STORAGE_KEY, createPreferencesStore, parsePreferences, resolveTheme } from './store'

function memoryStorage(initial = {}) {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  }
}

describe('parsePreferences', () => {
  it('defaults to system theme, Vietnamese and the web layout', () => {
    expect(DEFAULTS).toEqual({ theme: 'system', language: 'vi', display: 'web' })
    expect(parsePreferences(null)).toEqual(DEFAULTS)
    expect(parsePreferences(undefined)).toEqual(DEFAULTS)
  })

  it.each(['', 'not json', 'null', '[]', '42', '"dark"'])('falls back to the defaults for %j', (raw) => {
    expect(parsePreferences(raw)).toEqual(DEFAULTS)
  })

  it('keeps valid values and replaces unknown ones field by field', () => {
    expect(parsePreferences(JSON.stringify({ theme: 'dark', language: 'fr', display: 'mobile', extra: 1 }))).toEqual({
      theme: 'dark',
      language: 'vi',
      display: 'mobile',
    })
  })
})

describe('resolveTheme', () => {
  it('follows the system only when asked to', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
})

describe('createPreferencesStore', () => {
  it('persists a change so a new store (the next app launch) starts with it', () => {
    const storage = memoryStorage()
    createPreferencesStore(storage).set({ theme: 'dark', language: 'en' })
    expect(createPreferencesStore(storage).get()).toEqual({ theme: 'dark', language: 'en', display: 'web' })
  })

  it('notifies subscribers once per real change and returns a stable snapshot otherwise', () => {
    const store = createPreferencesStore(memoryStorage())
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    const before = store.get()

    store.set({ language: 'vi' })
    expect(listener).not.toHaveBeenCalled()
    expect(store.get()).toBe(before)

    store.set({ language: 'en' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    store.set({ language: 'vi' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('ignores an invalid value instead of storing it', () => {
    const storage = memoryStorage()
    const store = createPreferencesStore(storage)
    store.set({ theme: 'neon' })
    expect(store.get().theme).toBe('system')
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('still applies a change for the session when storage is missing or refuses writes', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const failing = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('quota')
      },
    }
    for (const storage of [null, failing]) {
      const store = createPreferencesStore(storage)
      expect(store.get()).toEqual(DEFAULTS)
      store.set({ display: 'mobile' })
      expect(store.get().display).toBe('mobile')
    }
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
