import { AppError } from './appError'
import { MAX_LOCATION_LENGTH } from './limits'

// Room QR payload: "building|floor|room", e.g. "A|3|A305".
const SEPARATOR = '|'
const FIELDS = ['building', 'floor', 'room']

export function parseRoomQr(text) {
  const parts = String(text ?? '').split(SEPARATOR).map((part) => part.trim())
  if (parts.length !== 3 || parts.some((part) => part === '' || part.length > MAX_LOCATION_LENGTH)) {
    throw new AppError('qr.error.invalidFormat', { text: String(text).slice(0, 60) })
  }
  const [building, floor, room] = parts
  return { building, floor, room }
}

// Inverse of parseRoomQr. Errors name the offending field for the person filling the QR generator form.
export function formatRoomQr({ building, floor, room }) {
  const parts = [building, floor, room].map((value) => String(value ?? '').trim())
  parts.forEach((part, i) => {
    const field = { key: `field.${FIELDS[i]}` }
    if (part === '') throw new AppError('qr.error.fieldEmpty', { field })
    if (part.length > MAX_LOCATION_LENGTH) throw new AppError('qr.error.fieldTooLong', { field, max: MAX_LOCATION_LENGTH })
    if (part.includes(SEPARATOR)) throw new AppError('qr.error.fieldHasSeparator', { field, separator: SEPARATOR })
  })
  return parts.join(SEPARATOR)
}
