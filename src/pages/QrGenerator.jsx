import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import { AppError } from '../utils/appError'
import { MAX_LOCATION_LENGTH } from '../utils/limits'
import { qrFileName, qrToPixels } from '../utils/qrImage'
import { formatRoomQr } from '../utils/roomQr'

const FIELDS = [
  { name: 'building', placeholder: 'A' },
  { name: 'floor', placeholder: '3' },
  { name: 'room', placeholder: 'A305' },
]
const CAPTION_HEIGHT = 64
const MAX_CAPTION_FONT = 30
const MIN_CAPTION_FONT = 14

function drawCaption(ctx, text, width, top) {
  let size = MAX_CAPTION_FONT
  ctx.font = `bold ${size}px system-ui, sans-serif`
  while (size > MIN_CAPTION_FONT && ctx.measureText(text).width > width - 24) {
    size -= 2
    ctx.font = `bold ${size}px system-ui, sans-serif`
  }
  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, top + CAPTION_HEIGHT / 2)
}

const toBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new AppError('qr.pngFailed'))), 'image/png'),
  )

export default function QrGenerator() {
  const { t, describeError } = useI18n()
  const [location, setLocation] = useState({ building: '', floor: '', room: '' })
  const [message, setMessage] = useState(null)
  const canvasRef = useRef(null)

  const touched = Object.values(location).some((v) => v.trim() !== '')
  const { payload, error } = useMemo(() => {
    try {
      return { payload: formatRoomQr(location), error: null }
    } catch (err) {
      return { payload: null, error: touched ? err : null }
    }
  }, [location, touched])

  // Redraw whenever the payload changes: the QR on top, a human-readable label underneath so the
  // printed sticker can be read without scanning it.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!payload || !canvas) return
    const { data, width, height } = qrToPixels(payload)
    canvas.width = width
    canvas.height = height + CAPTION_HEIGHT
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.putImageData(new ImageData(data, width, height), 0, 0)
    const { building, floor, room } = location
    drawCaption(ctx, t('qr.caption', { building: building.trim(), floor: floor.trim(), room: room.trim() }), width, height)
  }, [payload, location, t])

  async function download() {
    setMessage(null)
    try {
      const url = URL.createObjectURL(await toBlob(canvasRef.current))
      const link = document.createElement('a')
      link.href = url
      link.download = qrFileName(location)
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (err) {
      setMessage(err)
    }
  }

  const canShareFiles = typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

  async function share() {
    setMessage(null)
    try {
      const file = new File([await toBlob(canvasRef.current)], qrFileName(location), { type: 'image/png' })
      if (!navigator.canShare({ files: [file] })) throw new AppError('qr.shareUnsupported')
      await navigator.share({ files: [file], title: t('qr.shareTitle', { payload }) })
    } catch (err) {
      if (err.name !== 'AbortError') setMessage(err) // AbortError = the user closed the share sheet
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{t('qr.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {t('qr.intro')}
        </p>
      </header>

      {FIELDS.map(({ name, placeholder }) => (
        <label key={name} className="block">
          <span className="field-label">{t(`field.${name}`)}</span>
          <input
            value={location[name]}
            onChange={(e) => setLocation((prev) => ({ ...prev, [name]: e.target.value }))}
            placeholder={placeholder}
            maxLength={MAX_LOCATION_LENGTH}
            className="field"
          />
        </label>
      ))}

      {error && <p role="alert" className="text-sm text-danger">{describeError(error)}</p>}
      {!payload && !error && <p className="text-sm text-muted">{t('qr.incomplete')}</p>}

      {payload && (
        <div className="card space-y-4">
          <canvas ref={canvasRef} aria-label={t('qr.canvasLabel', { payload })} className="mx-auto h-auto w-full max-w-xs rounded-2xl" />
          <p className="text-center text-sm text-muted">
            {t('qr.content')} <code className="rounded-full bg-brand-100 px-2 py-0.5 text-brand-700">{payload}</code>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" onClick={download} className="btn btn-primary">
              {t('qr.download')}
            </button>
            {canShareFiles && (
              <button type="button" onClick={share} className="btn btn-secondary">
                {t('qr.share')}
              </button>
            )}
          </div>
          {message && <p role="alert" className="text-center text-sm text-danger">{describeError(message)}</p>}
        </div>
      )}
    </section>
  )
}
