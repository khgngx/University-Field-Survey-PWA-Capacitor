import { Suspense, lazy, useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Icon from './components/Icon.jsx'
import NetworkBanner from './components/NetworkBanner.jsx'
import PreferencesBar from './components/PreferencesBar.jsx'
import { useI18n } from './hooks/useI18n'
import { usePhoneFrame } from './hooks/usePreferences'
import QueuePage from './pages/QueuePage.jsx'
import SurveyWizard from './pages/SurveyWizard'
import { startSyncTriggers } from './services/sync.service'

// Chart.js and the QR encoder are only needed on these pages; the Service Worker still precaches
// their chunks, so both work offline.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const QrGenerator = lazy(() => import('./pages/QrGenerator.jsx'))

const NAV_ITEMS = [
  { to: '/', end: true, labelKey: 'nav.survey', icon: 'survey' },
  { to: '/queue', labelKey: 'nav.queue', icon: 'queue' },
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'stats' },
  { to: '/qr', labelKey: 'nav.qr', icon: 'qr' },
]

const navClass = ({ isActive }) =>
  `flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium ${isActive ? 'text-ink' : 'text-muted'}`

export default function App() {
  const { t } = useI18n()
  const framed = usePhoneFrame()
  useEffect(() => startSyncTriggers(), [])

  // The three wrappers are always rendered and only their classes change, so switching between
  // the full page and the phone frame never remounts a page (the wizard keeps its step).
  // In the frame, the transform makes the frame the containing block of the fixed tab bar.
  return (
    <HashRouter>
      <div className={framed ? 'flex h-dvh items-center justify-center overflow-hidden bg-backdrop' : ''}>
        <div
          className={
            framed
              ? 'h-[min(844px,calc(100dvh-2rem))] w-[390px] overflow-hidden rounded-[2.75rem] ring-8 ring-bezel [transform:translateZ(0)]'
              : ''
          }
        >
          <div className={`bg-canvas text-ink ${framed ? 'h-full overflow-y-auto' : 'min-h-screen pt-[env(safe-area-inset-top)]'}`}>
            <PreferencesBar />
            <NetworkBanner />
            <main className="mx-auto max-w-2xl px-4 pt-4 pb-28">
              <Suspense fallback={<p className="text-muted">{t('common.loading')}</p>}>
                <Routes>
                  <Route path="/" element={<SurveyWizard />} />
                  <Route path="/queue" element={<QueuePage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/qr" element={<QrGenerator />} />
                </Routes>
              </Suspense>
            </main>
            <footer className="fixed inset-x-0 bottom-0 z-10 rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-nav">
              <nav className="mx-auto flex max-w-2xl px-2 py-2">
                {NAV_ITEMS.map(({ to, end, labelKey, icon }) => (
                  <NavLink key={to} to={to} end={end} className={navClass}>
                    {({ isActive }) => (
                      <>
                        <span className={`flex h-9 w-14 items-center justify-center rounded-full ${isActive ? 'bg-brand-500 text-on-brand' : ''}`}>
                          <Icon name={icon} />
                        </span>
                        {t(labelKey)}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </footer>
          </div>
        </div>
      </div>
    </HashRouter>
  )
}
