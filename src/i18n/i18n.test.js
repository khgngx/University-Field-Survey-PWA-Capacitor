import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { AppError } from '../utils/appError'
import { STATUS } from '../utils/constants'
import { OPTIONS } from '../preferences/store'
import { LOCALE_TAGS, MESSAGES, errorText, translate } from './index'

const { vi, en } = MESSAGES
const SRC_DIR = fileURLToPath(new URL('..', import.meta.url))

const forms = (entry) => (typeof entry === 'string' ? [entry] : Object.values(entry))
const placeholders = (entry) => [...new Set(forms(entry).flatMap((form) => form.match(/\{\w+\}/g) ?? []))].sort()

// Letters that only occur in Vietnamese text (precomposed vowels with tone/quality marks, and đ).
const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i

// Files that may contain Vietnamese outside vi.js, each for a stated reason.
const SCAN_EXEMPT = new Set([
  'i18n/vi.js',
  'i18n/en.js', // the language switch names Vietnamese in Vietnamese ("Tiếng Việt")
  'utils/qrImage.js', // maps đ/Đ to ASCII for file names; not display text
])

function sourceFiles(dir = SRC_DIR) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'dev' ? [] : sourceFiles(path) // dev/: console-only seed data
    return /\.jsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : []
  })
}

const withoutComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('translations', () => {
  it('has an English entry for every Vietnamese string, and nothing extra', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort())
  })

  it.each(Object.keys(MESSAGES))('%s has no empty string and every plural form its grammar needs', (language) => {
    const categories = new Intl.PluralRules(language).resolvedOptions().pluralCategories
    for (const [key, entry] of Object.entries(MESSAGES[language])) {
      for (const form of forms(entry)) expect(form.trim(), key).not.toBe('')
      if (typeof entry === 'object') expect(Object.keys(entry).sort(), key).toEqual([...categories].sort())
    }
  })

  it('uses the same {parameters} in both languages', () => {
    for (const key of Object.keys(vi)) expect(placeholders(en[key]), key).toEqual(placeholders(vi[key]))
  })

  it('leaves no Vietnamese text in English strings other than the language name', () => {
    for (const [key, entry] of Object.entries(en)) {
      if (key === 'prefs.language.vi') continue
      for (const form of forms(entry)) expect(form, key).not.toMatch(VIETNAMESE)
    }
  })

  it('covers every key the app builds at runtime', () => {
    const dynamic = [
      ...Object.values(STATUS).map((status) => `status.${status}`),
      ...Object.entries(OPTIONS).flatMap(([name, values]) => [`prefs.${name}`, ...values.map((value) => `prefs.${name}.${value}`)]),
    ]
    for (const key of dynamic) expect(vi, key).toHaveProperty([key])
    expect(Object.keys(LOCALE_TAGS).sort()).toEqual([...OPTIONS.language].sort())
  })
})

describe('source files', () => {
  const files = sourceFiles().map((path) => ({ name: relative(SRC_DIR, path), code: withoutComments(readFileSync(path, 'utf8')) }))

  it('keep every displayed Vietnamese string in vi.js', () => {
    expect(files.length).toBeGreaterThan(30)
    const offenders = files.filter(({ name, code }) => !SCAN_EXEMPT.has(name) && VIETNAMESE.test(code)).map(({ name }) => name)
    expect(offenders).toEqual([])
  })

  it('only reference translation keys that exist', () => {
    const used = files.flatMap(({ name, code }) =>
      [...code.matchAll(/(?:\bt\(|translate\([^,]+,\s*|new AppError\(|(?:Key|key): )'([\w.]+)'/g)].map((match) => [name, match[1]]),
    )
    expect(used.length).toBeGreaterThan(60)
    expect(used.filter(([, key]) => !(key in vi))).toEqual([])
  })
})

describe('translate', () => {
  it('fills in parameters', () => {
    expect(translate('vi', 'wizard.progress', { current: 2, total: 5 })).toBe('Bước 2/5')
    expect(translate('en', 'wizard.progress', { current: 2, total: 5 })).toBe('Step 2/5')
  })

  it('picks the plural form for the count', () => {
    expect(translate('en', 'notify.synced', { count: 1 })).toBe('Synced 1 survey successfully')
    expect(translate('en', 'notify.synced', { count: 3 })).toBe('Synced 3 surveys successfully')
    expect(translate('en', 'notify.synced', { count: 0 })).toBe('Synced 0 surveys successfully')
    expect(translate('vi', 'notify.synced', { count: 3 })).toBe('Đã đồng bộ thành công 3 khảo sát')
  })

  it('translates nested keys and unwraps errors passed as parameters', () => {
    expect(translate('en', 'qr.error.fieldEmpty', { field: { key: 'field.floor' } })).toBe('Floor is required')
    expect(translate('en', 'wizard.saveFailed', { message: new Error('disk full') })).toBe('Could not save the survey: disk full')
    expect(translate('vi', 'photo.captureFailed', { message: new AppError('qr.pngFailed') })).toBe(
      'Không chụp được ảnh: Không tạo được ảnh PNG',
    )
  })

  it('returns the key itself when no language has it, and leaves unknown parameters visible', () => {
    expect(translate('en', 'no.such.key')).toBe('no.such.key')
    expect(translate('en', 'wizard.progress', { current: 1 })).toBe('Step 1/{total}')
  })
})

describe('errorText', () => {
  it('translates AppErrors in the requested language and passes other errors through', () => {
    const error = new AppError('qr.error.fieldTooLong', { field: { key: 'field.room' }, max: 50 })
    expect(errorText('vi', error)).toBe('Phòng tối đa 50 ký tự')
    expect(errorText('en', error)).toBe('Room can be at most 50 characters')
    expect(errorText('en', new Error('HTTP 500'))).toBe('HTTP 500')
    expect(errorText('en', null)).toBeNull()
  })
})
