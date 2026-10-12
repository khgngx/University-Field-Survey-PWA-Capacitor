import { useState } from 'react'
import StatusBadge from '../components/StatusBadge.jsx'
import { useI18n } from '../hooks/useI18n'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { requestSync } from '../services/sync.service'
import { retryAllFailed, retrySurvey } from '../sync/queue'
import { STATUS } from '../utils/constants'

const formatTime = (ms, locale) => new Date(ms).toLocaleString(locale)

export default function QueuePage() {
  const { t, locale, describeError } = useI18n()
  const { ready, surveys, counts, error } = useSyncQueue()
  const [actionError, setActionError] = useState(null)

  async function run(action) {
    setActionError(null)
    try {
      await action()
    } catch (err) {
      setActionError(err)
    }
  }

  const retryOne = (id) => run(async () => {
    await retrySurvey(id)
    await requestSync()
  })
  const retryAll = () => run(async () => {
    await retryAllFailed()
    await requestSync()
  })
  const syncNow = () => run(requestSync)

  if (error) return <p role="alert" className="text-danger">{t('queue.readFailed', { message: error })}</p>
  if (!ready) return <p className="text-muted">{t('common.loading')}</p>

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('queue.title')}</h1>
        <button type="button" onClick={syncNow} className="btn btn-primary shrink-0">
          {t('queue.syncNow')}
        </button>
      </header>

      <p className="text-sm text-muted">
        {t('queue.summary', {
          pending: counts[STATUS.PENDING_SYNC] + counts[STATUS.SYNCING],
          synced: counts[STATUS.SYNCED],
          failed: counts[STATUS.FAILED],
        })}
      </p>
      {counts[STATUS.FAILED] > 0 && (
        <button type="button" onClick={retryAll} className="btn btn-sm btn-secondary">
          {t('queue.retryAll', { count: counts[STATUS.FAILED] })}
        </button>
      )}
      {actionError && <p role="alert" className="text-sm text-danger">{describeError(actionError)}</p>}

      {surveys.length === 0 ? (
        <p className="text-muted">{t('queue.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {surveys.map((s) => (
            <li key={s.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{s.building}-{s.floor}-{s.room} · {s.category}</span>
                <StatusBadge status={s.status} />
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatTime(s.createdAt, locale)} · {s.rating}★{s.version > 1 ? ` · v${s.version}` : ''}
              </p>
              {s.status === STATUS.FAILED && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-xs text-danger">{s.lastError}</p>
                  <button type="button" onClick={() => retryOne(s.id)} className="btn btn-sm btn-secondary shrink-0">
                    {t('common.retry')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
