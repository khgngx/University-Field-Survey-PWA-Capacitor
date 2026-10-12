import { useI18n } from '../../hooks/useI18n'
import { useObjectUrl } from '../../hooks/useObjectUrl'

const ROWS = [
  ['building', (d) => d.building],
  ['floor', (d) => d.floor],
  ['room', (d) => d.room],
  ['category', (d) => d.category],
  ['rating', (d, t) => (d.rating ? t('rating.outOfFive', { rating: d.rating }) : '')],
  ['defectNotes', (d) => d.defectNotes],
]

export default function Review({ draft }) {
  const { t } = useI18n()
  const photoUrl = useObjectUrl(draft.photoBlob)
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-line/50 rounded-3xl bg-surface">
        {ROWS.map(([field, read]) => (
          <div key={field} className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-muted">{t(`field.${field}`)}</dt>
            <dd className="text-right font-medium">{read(draft, t) || '—'}</dd>
          </div>
        ))}
      </dl>
      {photoUrl && <img src={photoUrl} alt={t('photo.alt')} className="max-h-72 w-full rounded-3xl bg-surface object-contain" />}
    </div>
  )
}
