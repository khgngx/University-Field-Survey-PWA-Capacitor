import { Capacitor } from '@capacitor/core'
import { useCallback, useSyncExternalStore } from 'react'
import { getResolvedTheme, subscribeResolvedTheme } from '../preferences/documentSync'
import { preferences } from '../preferences/store'

// The phone frame only makes sense in a browser window with room around a 390 px wide frame.
const FRAME_MIN_WIDTH_QUERY = '(min-width: 700px)'

export function usePreferences() {
  return useSyncExternalStore(preferences.subscribe, preferences.get)
}

// 'light' | 'dark', with the "system" preference already resolved.
export function useResolvedTheme() {
  return useSyncExternalStore(subscribeResolvedTheme, getResolvedTheme)
}

function useMediaQuery(query) {
  const subscribe = useCallback(
    (notify) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', notify)
      return () => media.removeEventListener('change', notify)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

// Whether the Web/Mobile switch applies here: never in the native app or on a narrow window.
export function useCanFramePhone() {
  const wide = useMediaQuery(FRAME_MIN_WIDTH_QUERY)
  return wide && !Capacitor.isNativePlatform()
}

// The saved choice is kept while the window is too narrow; it just has no effect until it widens.
export function usePhoneFrame() {
  const { display } = usePreferences()
  return useCanFramePhone() && display === 'mobile'
}
