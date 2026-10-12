import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SurveyValidationError, findRecentSurvey, validateForSubmit } from '../../db/surveys'
import ProgressRing from '../../components/ProgressRing.jsx'
import { useDraft } from '../../hooks/useDraft'
import { useI18n } from '../../hooks/useI18n'
import { getCurrentPosition } from '../../services/geo.service'
import { requestNotificationPermission } from '../../services/notify.service'
import { requestSync } from '../../services/sync.service'
import { AppError } from '../../utils/appError'
import Review from './Review.jsx'
import Step1Location from './Step1Location.jsx'
import Step2Category from './Step2Category.jsx'
import Step3Rating from './Step3Rating.jsx'
import Step4Photo from './Step4Photo.jsx'

// `requires` lists the draft fields that must be valid before moving to the next step.
const STEPS = [
  { titleKey: 'wizard.step.location', Component: Step1Location, requires: ['building', 'floor', 'room'] },
  { titleKey: 'field.category', Component: Step2Category, requires: ['category'] },
  { titleKey: 'field.rating', Component: Step3Rating, requires: ['rating'] },
  { titleKey: 'wizard.step.photo', Component: Step4Photo, requires: [] },
  { titleKey: 'wizard.step.review', Component: Review, requires: [] },
]

const formatTime = (ms, locale) => new Date(ms).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

export default function SurveyWizard() {
  const navigate = useNavigate()
  const { t, locale, describeError } = useI18n()
  const { draft, update, submit, error: draftError } = useDraft()
  const [stepIndex, setStepIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [duplicate, setDuplicate] = useState(null)

  if (draftError) {
    return <p role="alert" className="text-danger">{t('wizard.draftOpenFailed', { message: draftError })}</p>
  }
  if (!draft) return <p className="text-muted">{t('common.loading')}</p>

  const { titleKey, Component, requires } = STEPS[stepIndex]
  const invalid = validateForSubmit(draft)
  const canProceed = requires.every((field) => !invalid.includes(field))
  const isLast = stepIndex === STEPS.length - 1

  // Field names inside a validation message are translated here, at display time.
  const describeMessage = (error) =>
    Array.isArray(error.params?.fields)
      ? t(error.key, { fields: error.params.fields.map((field) => t(`field.${field}`)).join(', ') })
      : describeError(error)

  async function handleNext() {
    setMessage(null)
    if (stepIndex === 0) {
      // Offline duplicate check: the same room surveyed in the last 24 h offers a new version.
      try {
        const existing = await findRecentSurvey(draft, Date.now(), draft.id)
        if (existing) {
          setDuplicate(existing)
          return
        }
      } catch (err) {
        setMessage(new AppError('wizard.duplicateCheckFailed', { message: err }))
        return
      }
      update({ version: 1 })
    }
    setStepIndex((i) => i + 1)
  }

  function createNewVersion() {
    update({ version: duplicate.version + 1 })
    setDuplicate(null)
    setStepIndex((i) => i + 1)
  }

  async function handleSubmit() {
    setBusy(true)
    setMessage(null)
    // Permission prompts need this user gesture; neither may block or fail the submit.
    requestNotificationPermission().catch((err) => console.warn('Notification permission failed:', err.message))
    try {
      update({ gps: await getCurrentPosition() })
      await submit()
      // The survey is already safe in IndexedDB; syncing is best-effort and retried by the triggers.
      requestSync().catch((err) => console.error('Sync after submit failed:', err))
      navigate('/queue')
    } catch (err) {
      setMessage(
        err instanceof SurveyValidationError
          ? new AppError('wizard.invalidFields', { fields: err.missing })
          : new AppError('wizard.saveFailed', { message: err }),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-4 rounded-3xl bg-brand-200 p-5">
        <div>
          <p className="text-sm font-medium text-ink/70">{t('wizard.progress', { current: stepIndex + 1, total: STEPS.length })}</p>
          <h1 className="text-2xl font-semibold">{t(titleKey)}</h1>
        </div>
        <ProgressRing value={stepIndex + 1} max={STEPS.length} />
      </header>

      <Component draft={draft} update={update} />

      {message && <p role="alert" className="text-sm text-danger">{describeMessage(message)}</p>}

      {duplicate ? (
        <div role="alertdialog" aria-label={t('wizard.duplicate.title')} className="space-y-4 rounded-3xl bg-warning-soft p-5 ring-1 ring-warning/40 ring-inset">
          <p>
            {t('wizard.duplicate.body', {
              time: formatTime(duplicate.submittedAt ?? duplicate.createdAt, locale),
              version: duplicate.version + 1,
            })}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={createNewVersion} className="btn btn-primary">
              {t('wizard.duplicate.confirm')}
            </button>
            <button type="button" onClick={() => setDuplicate(null)} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <footer className="flex justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStepIndex((i) => i - 1)}
            disabled={stepIndex === 0 || busy}
            className="btn btn-secondary"
          >
            {t('wizard.back')}
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={busy || invalid.length > 0}
              className="btn btn-primary flex-1"
            >
              {busy ? t('wizard.saving') : t('wizard.submit')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="btn btn-primary flex-1"
            >
              {t('wizard.next')}
            </button>
          )}
        </footer>
      )}
    </section>
  )
}
