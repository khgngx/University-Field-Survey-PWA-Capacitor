import { useMemo } from 'react'
import { LOCALE_TAGS, errorText, translate } from '../i18n'
import { usePreferences } from './usePreferences'

// `t(key, params)` and `describeError(error)` for the selected language, plus its `locale` tag
// for date formatting. The returned object only changes when the language does.
export function useI18n() {
  const { language } = usePreferences()
  return useMemo(
    () => ({
      language,
      locale: LOCALE_TAGS[language],
      t: (key, params) => translate(language, key, params),
      describeError: (error) => errorText(language, error),
    }),
    [language],
  )
}
