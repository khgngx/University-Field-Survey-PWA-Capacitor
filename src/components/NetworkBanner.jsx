import { useI18n } from '../hooks/useI18n'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

export default function NetworkBanner() {
  const { t } = useI18n()
  const connected = useNetworkStatus()
  if (connected) return null
  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <div role="status" className="rounded-2xl bg-warning-soft px-4 py-3 text-center text-sm font-medium text-warning-strong">
        {t('network.offline')}
      </div>
    </div>
  )
}
