import StarRating from '../../components/StarRating.jsx'
import { useI18n } from '../../hooks/useI18n'

export default function Step3Rating({ draft, update }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="card">
        <span className="field-label">{t('rating.condition')}</span>
        <StarRating value={draft.rating} onChange={(rating) => update({ rating })} />
      </div>
      <label className="block">
        <span className="field-label">{t('field.defectNotes')}</span>
        <textarea
          value={draft.defectNotes ?? ''}
          onChange={(e) => update({ defectNotes: e.target.value })}
          rows={4}
          maxLength={2000}
          className="field"
        />
      </label>
    </div>
  )
}
