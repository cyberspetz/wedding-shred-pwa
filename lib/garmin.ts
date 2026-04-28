import type { GarminMetrics } from '@/types'

export type ReadinessLevel = 'green' | 'normal' | 'yellow' | 'orange' | 'red' | 'unknown'

export interface ReadinessAdvice {
  level: ReadinessLevel
  headline: string
  detail: string[]
}

// Decision tree from the Wedding Shred protocol:
//   <30 readiness          → swap for light badminton / rest
//   30-50 OR Battery <40   → -10% load, all RPE -1
//   HRV unbalanced/low OR
//   Sleep <70              → cap intensity, no PR attempts
//   >75 readiness          → green light, +5% on primaries OK
// Most-severe condition wins.
export function getReadinessAdvice(m: GarminMetrics | null | undefined): ReadinessAdvice {
  if (!m) {
    return {
      level: 'unknown',
      headline: 'Log today\'s Garmin metrics',
      detail: ['Readiness, HRV, Body Battery, Sleep — drives today\'s session call'],
    }
  }
  const r = m.training_readiness
  const bb = m.body_battery_am
  const hrv = m.hrv_status
  const sleep = m.sleep_score
  const detail: string[] = []

  if (r !== null && r < 30) {
    detail.push(`Readiness ${r}`)
    return { level: 'red', headline: 'Swap session for light badminton or rest', detail }
  }
  if ((r !== null && r < 50) || (bb !== null && bb < 40)) {
    if (r !== null && r < 50) detail.push(`Readiness ${r}`)
    if (bb !== null && bb < 40) detail.push(`Body Battery ${bb}`)
    return { level: 'orange', headline: 'Reduce load 10%, all RPE −1', detail }
  }
  if (hrv === 'unbalanced' || hrv === 'low' || hrv === 'poor' || (sleep !== null && sleep < 70)) {
    if (hrv && hrv !== 'balanced') detail.push(`HRV ${hrv}`)
    if (sleep !== null && sleep < 70) detail.push(`Sleep ${sleep}`)
    return { level: 'yellow', headline: 'Cap intensity — no PR attempts', detail }
  }
  if (r !== null && r > 75) {
    detail.push(`Readiness ${r}`)
    return { level: 'green', headline: 'Green light — +5% on primaries OK', detail }
  }
  if (r !== null) detail.push(`Readiness ${r}`)
  return { level: 'normal', headline: 'Execute as planned', detail }
}

export const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  green: '#3ecf8e',
  normal: '#60a5fa',
  yellow: '#f5c542',
  orange: '#f59e0b',
  red: '#e85d3a',
  unknown: '#6b7280',
}
