import { useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { takePhoto } from '../services/camera.service'
import { AppError } from '../utils/appError'

export default function PhotoPicker({ photo, onChange }) {
  const { t, describeError } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const previewUrl = useObjectUrl(photo)

  async function capture() {
    setBusy(true)
    setError(null)
    try {
      const blob = await takePhoto()
      if (blob) onChange(blob)
    } catch (err) {
      setError(new AppError('photo.captureFailed', { message: err }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      {previewUrl && <img src={previewUrl} alt={t('photo.alt')} className="max-h-72 w-full rounded-3xl bg-surface object-contain" />}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={capture}
          disabled={busy}
          className="btn btn-primary"
        >
          {busy ? t('photo.processing') : photo ? t('photo.retake') : t('photo.take')}
        </button>
        {photo && (
          <button type="button" onClick={() => onChange(undefined)} className="btn btn-secondary">
            {t('photo.remove')}
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{describeError(error)}</p>}
    </div>
  )
}
