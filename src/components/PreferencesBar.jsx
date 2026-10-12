import { useCanFramePhone, usePreferences } from '../hooks/usePreferences'
import { useI18n } from '../hooks/useI18n'
import { preferences } from '../preferences/store'
import Icon from './Icon.jsx'

const THEME_ICONS = { light: 'sun', dark: 'moon', system: 'auto' }
const DISPLAY_ICONS = { web: 'monitor', mobile: 'phone' }

// Each option is { value, label, icon } or { value, label, text }; `label` is the accessible name.
function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-1 rounded-full bg-surface p-1 ring-1 ring-line ring-inset">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={`flex h-8 min-w-10 items-center justify-center rounded-full px-2 text-xs leading-none font-semibold whitespace-nowrap ${
              selected ? 'bg-brand-500 text-on-brand' : 'text-muted'
            }`}
          >
            {option.icon ? <Icon name={option.icon} className="h-4 w-4" /> : option.text}
          </button>
        )
      })}
    </div>
  )
}

export default function PreferencesBar() {
  const { t } = useI18n()
  const { theme, language, display } = usePreferences()
  const canFramePhone = useCanFramePhone()

  return (
    <header className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 pt-4">
      <p className="max-w-full truncate font-semibold">{t('app.name')}</p>
      <div role="group" aria-label={t('prefs.label')} className="flex flex-wrap items-center justify-center gap-2">
        <SegmentedControl
          label={t('prefs.theme')}
          value={theme}
          onChange={(value) => preferences.set({ theme: value })}
          options={Object.entries(THEME_ICONS).map(([value, icon]) => ({ value, icon, label: t(`prefs.theme.${value}`) }))}
        />
        <SegmentedControl
          label={t('prefs.language')}
          value={language}
          onChange={(value) => preferences.set({ language: value })}
          options={['vi', 'en'].map((value) => ({ value, text: value.toUpperCase(), label: t(`prefs.language.${value}`) }))}
        />
        {canFramePhone && (
          <SegmentedControl
            label={t('prefs.display')}
            value={display}
            onChange={(value) => preferences.set({ display: value })}
            options={Object.entries(DISPLAY_ICONS).map(([value, icon]) => ({ value, icon, label: t(`prefs.display.${value}`) }))}
          />
        )}
      </div>
    </header>
  )
}
