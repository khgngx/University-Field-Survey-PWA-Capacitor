import { useMemo } from 'react'
import ChartCanvas from '../components/ChartCanvas.jsx'
import { useChartColors } from '../hooks/useChartColors'
import { useI18n } from '../hooks/useI18n'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { STATUS } from '../utils/constants'
import { DEFECT_MAX_RATING, summarize } from '../utils/stats'

const COUNTERS = [
  ['status.PENDING_SYNC', [STATUS.PENDING_SYNC, STATUS.SYNCING], 'bg-warning'],
  ['status.SYNCED', [STATUS.SYNCED], 'bg-brand-500'],
  ['status.FAILED', [STATUS.FAILED], 'bg-danger'],
]

export default function Dashboard() {
  const { t } = useI18n()
  const colors = useChartColors()
  const { ready, surveys, counts, error } = useSyncQueue()
  const stats = useMemo(() => summarize(surveys), [surveys])

  const chartOptions = useMemo(() => {
    const tooltip = { backgroundColor: colors.tooltipBackground, titleColor: colors.tooltipText, bodyColor: colors.tooltipText }
    return {
      bar: {
        plugins: { legend: { display: false }, tooltip },
        scales: {
          x: { ticks: { color: colors.text }, grid: { display: false }, border: { display: false } },
          y: { beginAtZero: true, ticks: { precision: 0, color: colors.text }, grid: { color: colors.grid }, border: { display: false } },
        },
      },
      doughnut: {
        cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', color: colors.text } }, tooltip },
      },
    }
  }, [colors])

  const defectsChart = useMemo(
    () => ({
      labels: Object.keys(stats.defectsByBuilding),
      datasets: [{ label: t('dashboard.defectCount'), data: Object.values(stats.defectsByBuilding), backgroundColor: colors.series[0], borderRadius: 999, borderSkipped: false, maxBarThickness: 28 }],
    }),
    [stats, colors, t],
  )
  const categoryChart = useMemo(
    () => ({
      labels: Object.keys(stats.countByCategory),
      datasets: [{ data: Object.values(stats.countByCategory), backgroundColor: colors.series, borderWidth: 0, borderRadius: 8, spacing: 3 }],
    }),
    [stats, colors],
  )

  if (error) return <p role="alert" className="text-danger">{t('dashboard.readFailed', { message: error })}</p>
  if (!ready) return <p className="text-muted">{t('common.loading')}</p>

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-3 gap-3">
        {COUNTERS.map(([labelKey, statuses, dot]) => (
          <div key={labelKey} className="card">
            <span className={`mb-3 block h-2.5 w-2.5 rounded-full ${dot}`} />
            <p className="text-2xl font-semibold">{statuses.reduce((sum, st) => sum + counts[st], 0)}</p>
            <p className="text-xs text-muted">{t(labelKey)}</p>
          </div>
        ))}
      </div>

      {stats.total === 0 ? (
        <p className="text-muted">{t('dashboard.empty')}</p>
      ) : (
        <>
          <div className="rounded-3xl bg-brand-200 p-5">
            <p className="text-sm font-medium text-ink/70">{t('dashboard.averageRating', { count: stats.total })}</p>
            <p className="text-4xl font-semibold">{stats.averageRating.toFixed(1)} ★</p>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {Object.entries(stats.averageRatingByCategory).map(([category, avg]) => (
                <li key={category} className="rounded-full bg-surface/70 px-3 py-1">{category}: {avg.toFixed(1)}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2 className="mb-3 font-semibold">{t('dashboard.defectsByBuilding', { max: DEFECT_MAX_RATING })}</h2>
            {defectsChart.labels.length === 0 ? (
              <p className="text-sm text-muted">{t('dashboard.noDefects')}</p>
            ) : (
              <ChartCanvas type="bar" data={defectsChart} options={chartOptions.bar} label={t('dashboard.defectsChartLabel')} />
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 font-semibold">{t('dashboard.byCategory')}</h2>
            <ChartCanvas type="doughnut" data={categoryChart} options={chartOptions.doughnut} label={t('dashboard.categoryChartLabel')} />
          </div>
        </>
      )}
    </section>
  )
}
