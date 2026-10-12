import { describe, expect, it } from 'vitest'
import { errorText } from '../i18n'
import { formatRoomQr, parseRoomQr } from './roomQr'

const thrownBy = (run) => {
  try {
    run()
  } catch (err) {
    return err
  }
  return null
}

describe('parseRoomQr', () => {
  it('splits building|floor|room and trims whitespace', () => {
    expect(parseRoomQr('A|3|A305')).toEqual({ building: 'A', floor: '3', room: 'A305' })
    expect(parseRoomQr(' B | 1 | B101 ')).toEqual({ building: 'B', floor: '1', room: 'B101' })
  })

  it.each(['', 'A|3', 'A|3|A305|extra', 'A||A305', '|3|A305', 'https://example.com', null, undefined])(
    'rejects malformed payload %j',
    (input) => {
      expect(thrownBy(() => parseRoomQr(input))).toMatchObject({ key: 'qr.error.invalidFormat' })
    },
  )
})

describe('parseRoomQr limits', () => {
  it('rejects a part longer than the server accepts', () => {
    expect(thrownBy(() => parseRoomQr(`A|3|${'x'.repeat(51)}`))).toMatchObject({ key: 'qr.error.invalidFormat' })
    expect(parseRoomQr(`A|3|${'x'.repeat(50)}`).room).toHaveLength(50)
  })
})

describe('formatRoomQr', () => {
  it('joins trimmed parts with the separator', () => {
    expect(formatRoomQr({ building: ' A ', floor: '3', room: 'A305' })).toBe('A|3|A305')
  })

  it('round-trips through parseRoomQr, including Vietnamese and negative floors', () => {
    for (const location of [
      { building: 'A', floor: '3', room: 'A305' },
      { building: 'Hầm', floor: '-1', room: 'H01' },
      { building: 'Toà nhà Đa năng', floor: '12', room: 'P.1203 (Lab)' },
    ]) {
      expect(parseRoomQr(formatRoomQr(location))).toEqual(location)
    }
  })

  it('names the field that is missing, too long, or contains the separator', () => {
    const message = (location) => errorText('vi', thrownBy(() => formatRoomQr(location)))
    expect(message({ building: '', floor: '3', room: 'A305' })).toBe('Chưa nhập Toà nhà')
    expect(message({ building: 'A', floor: '  ', room: 'A305' })).toBe('Chưa nhập Tầng')
    expect(message({ building: 'A', floor: '3' })).toBe('Chưa nhập Phòng')
    expect(message({ building: 'A', floor: '3', room: 'x'.repeat(51) })).toMatch(/Phòng tối đa 50/)
    expect(message({ building: 'A|B', floor: '3', room: 'A305' })).toMatch(/Toà nhà không được chứa/)
    expect(errorText('en', thrownBy(() => formatRoomQr({ building: 'A', floor: '3' })))).toBe('Room is required')
  })
})
