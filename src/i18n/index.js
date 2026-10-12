import en from './en'
import vi from './vi'

export const MESSAGES = Object.freeze({ vi, en })

// BCP 47 tags for date and number formatting.
export const LOCALE_TAGS = Object.freeze({ vi: 'vi-VN', en: 'en-US' })

const pluralRules = Object.fromEntries(Object.keys(MESSAGES).map((language) => [language, new Intl.PluralRules(language)]))

// A parameter may itself be translatable: `{ key, params }` (an AppError qualifies) is translated
// in the same language, and any other Error contributes its message.
function resolveParam(language, value) {
  if (value === null || typeof value !== 'object') return value
  if (typeof value.key === 'string') return translate(language, value.key, value.params)
  return value.message ?? String(value)
}

// Returns the string for `key` with `{name}` parameters filled in. A key missing from every
// language comes back unchanged, so the gap is visible instead of rendering blank.
export function translate(language, key, params = {}) {
  let template = MESSAGES[language]?.[key] ?? MESSAGES.vi[key]
  if (template === undefined) return key
  if (typeof template === 'object') {
    template = template[pluralRules[language].select(Number(params.count))] ?? template.other
  }
  return template.replace(/\{(\w+)\}/g, (placeholder, name) =>
    name in params ? String(resolveParam(language, params[name])) : placeholder,
  )
}

// User-facing text for a caught error: AppErrors are translated, anything else (browser and
// server errors) keeps its own message.
export function errorText(language, error) {
  if (!error) return null
  return typeof error.key === 'string' ? translate(language, error.key, error.params) : error.message
}
