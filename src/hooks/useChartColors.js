import { useMemo } from 'react'
import { useResolvedTheme } from './usePreferences'

const SERIES_TOKENS = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']

// Chart.js paints on a canvas and cannot take `var(--…)`, so the design tokens are read as
// computed values. Re-reads when the theme changes; by then documentSync has switched <html>.
export function useChartColors() {
  const theme = useResolvedTheme()
  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement)
    const token = (name) => styles.getPropertyValue(`--color-${name}`).trim()
    return {
      theme,
      series: SERIES_TOKENS.map(token),
      grid: token('chart-grid'),
      text: token('muted'),
      tooltipBackground: token('ink'),
      tooltipText: token('canvas'),
    }
  }, [theme])
}
