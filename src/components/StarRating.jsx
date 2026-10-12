import { useI18n } from '../hooks/useI18n'

const STARS = [1, 2, 3, 4, 5]

export default function StarRating({ value, onChange, label }) {
  const { t } = useI18n()
  return (
    <div role="radiogroup" aria-label={label ?? t('field.rating')} className="flex justify-between">
      {STARS.map((star) => {
        const selected = value === star
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t('rating.stars', { count: star })}
            onClick={() => onChange(star)}
            className={`h-12 w-12 rounded-full text-3xl leading-none ${
              value >= star ? 'text-warning' : 'text-muted/30'
            } ${selected ? 'bg-brand-50 ring-2 ring-brand-500' : ''}`}
          >
            ★
          </button>
        )
      })}
    </div>
  )
}
