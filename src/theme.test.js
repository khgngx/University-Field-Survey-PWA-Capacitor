import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

// Body of the first `{ … }` block that follows `opener` (these blocks hold no nested braces).
function block(opener) {
  const start = css.indexOf(opener)
  if (start === -1) throw new Error(`"${opener}" not found in index.css`)
  const open = css.indexOf('{', start)
  return css.slice(open + 1, css.indexOf('}', open))
}

const colorTokens = (body) => Object.fromEntries([...body.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]))

const PALETTES = {
  light: colorTokens(block('@theme static')),
  dark: colorTokens(block(":root[data-theme='dark']")),
}

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

function luminance(rgb) {
  const [r, g, b] = rgb.map((value) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(foreground, background) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

const blend = (top, bottom, alpha) => top.map((value, i) => value * alpha + bottom[i] * (1 - alpha))

// [text token, background token, opacity of the text] for every text/background pairing in the UI.
const TEXT_PAIRS = [
  ['ink', 'canvas'],
  ['ink', 'surface'],
  ['muted', 'canvas'],
  ['muted', 'surface'],
  ['on-brand', 'brand-500'],
  ['ink', 'brand-200'],
  ['ink', 'brand-200', 0.7],
  ['brand-700', 'brand-100'],
  ['neutral-strong', 'neutral-soft'],
  ['warning-strong', 'warning-soft'],
  ['ink', 'warning-soft'],
  ['info-strong', 'info-soft'],
  ['danger', 'danger-soft'],
  ['danger', 'canvas'],
  ['danger', 'surface'],
]
const AA_NORMAL_TEXT = 4.5

describe('colour palettes', () => {
  it('defines every light token in the dark palette, and no others', () => {
    expect(Object.keys(PALETTES.light).length).toBeGreaterThan(20)
    expect(Object.keys(PALETTES.dark).sort()).toEqual(Object.keys(PALETTES.light).sort())
  })

  it('uses hex values only', () => {
    for (const palette of Object.values(PALETTES)) {
      for (const [token, value] of Object.entries(palette)) expect(value, token).toMatch(/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/)
    }
  })

  describe.each(Object.entries(PALETTES))('%s palette', (_name, palette) => {
    it.each(TEXT_PAIRS)('%s on %s meets WCAG AA', (text, background, opacity = 1) => {
      const backgroundRgb = channels(palette[background])
      const ratio = contrast(blend(channels(palette[text]), backgroundRgb, opacity), backgroundRgb)
      expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    })
  })
})
