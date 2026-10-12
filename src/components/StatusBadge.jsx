import { useI18n } from '../hooks/useI18n'
import { STATUS } from '../utils/constants'

const STYLES = {
  [STATUS.DRAFT]: 'bg-neutral-soft text-neutral-strong',
  [STATUS.PENDING_SYNC]: 'bg-warning-soft text-warning-strong',
  [STATUS.SYNCING]: 'bg-info-soft text-info-strong',
  [STATUS.SYNCED]: 'bg-brand-100 text-brand-700',
  [STATUS.FAILED]: 'bg-danger-soft text-danger',
}

export default function StatusBadge({ status }) {
  const { t } = useI18n()
  const style = STYLES[status]
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${style ?? STYLES[STATUS.DRAFT]}`}>
      {style ? t(`status.${status}`) : status}
    </span>
  )
}
