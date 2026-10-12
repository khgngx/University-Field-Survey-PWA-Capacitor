import { useRef, useState } from 'react'
import Icon from '../../components/Icon.jsx'
import { useI18n } from '../../hooks/useI18n'
import { readRoomQrFromImage, scanRoomQr } from '../../services/scanner.service'
import { MAX_LOCATION_LENGTH } from '../../utils/limits'

const FIELDS = [
  { name: 'building', placeholder: 'A' },
  { name: 'floor', placeholder: '3' },
  { name: 'room', placeholder: 'A305' },
]

export default function Step1Location({ draft, update }) {
  const { t, describeError } = useI18n()
  const [busy, setBusy] = useState(null) // 'scan' | 'upload' | null
  const [qrError, setQrError] = useState(null)
  const fileInput = useRef(null)

  async function fillFrom(read) {
    setQrError(null)
    try {
      const location = await read()
      if (location) update(location)
    } catch (err) {
      setQrError(err)
    }
  }

  async function run(kind, read) {
    setBusy(kind)
    await fillFrom(read)
    setBusy(null)
  }

  function onFileChosen(event) {
    const file = event.target.files?.[0]
    event.target.value = '' // lets the same file be chosen again after a failed read
    if (file) run('upload', () => readRoomQrFromImage(file))
  }

  const buttonClass = 'card flex items-center justify-between gap-2 text-left text-sm font-semibold disabled:opacity-50'
  const iconClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => run('scan', scanRoomQr)} disabled={busy !== null} className={buttonClass}>
          {busy === 'scan' ? t('scan.opening') : t('scan.scanRoom')}
          <span className={iconClass}><Icon name="scan" /></span>
        </button>
        <button type="button" onClick={() => fileInput.current.click()} disabled={busy !== null} className={buttonClass}>
          {busy === 'upload' ? t('scan.reading') : t('scan.upload')}
          <span className={iconClass}><Icon name="upload" /></span>
        </button>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFileChosen} aria-label={t('scan.chooseImage')} />
      </div>
      {qrError && <p role="alert" className="text-sm text-danger">{describeError(qrError)}</p>}

      {FIELDS.map(({ name, placeholder }) => (
        <label key={name} className="block">
          <span className="field-label">{t(`field.${name}`)}</span>
          <input
            value={draft[name] ?? ''}
            onChange={(e) => update({ [name]: e.target.value })}
            placeholder={placeholder}
            maxLength={MAX_LOCATION_LENGTH}
            className="field"
          />
        </label>
      ))}
    </div>
  )
}
