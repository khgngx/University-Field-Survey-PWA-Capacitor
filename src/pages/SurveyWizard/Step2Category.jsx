import Icon from '../../components/Icon.jsx'
import { useI18n } from '../../hooks/useI18n'
import { CATEGORIES } from '../../utils/constants'

export default function Step2Category({ draft, update }) {
  const { t } = useI18n()
  return (
    <div role="radiogroup" aria-label={t('field.category')} className="grid grid-cols-2 gap-3">
      {CATEGORIES.map((category) => {
        const selected = draft.category === category
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => update({ category })}
            className={`flex items-center justify-between gap-2 rounded-3xl p-4 text-left font-semibold ${
              selected ? 'bg-brand-200 ring-2 ring-brand-500 ring-inset' : 'bg-surface'
            }`}
          >
            {category}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                selected ? 'bg-brand-500 text-on-brand' : 'bg-canvas text-transparent'
              }`}
            >
              <Icon name="check" className="h-4 w-4" />
            </span>
          </button>
        )
      })}
    </div>
  )
}
