import type { WeightLog, GarminMetrics } from '@/types'
import { START_WEIGHT } from './utils'

export type GateStatus = 'pass' | 'fail' | 'unknown'

export interface GateCheck {
  label: string
  status: GateStatus
  details: string
}

export interface PhaseGate {
  fromPhase: 'P1' | 'P2'
  toPhase: 'P2' | 'P3'
  checks: GateCheck[]
  overall: GateStatus
}

function latestWaist(log: WeightLog): number | null {
  return log.waist_narrowest_cm ?? log.waist_navel_cm ?? null
}

function rollupOverall(checks: GateCheck[]): GateStatus {
  if (checks.length === 0) return 'unknown'
  if (checks.some((c) => c.status === 'fail')) return 'fail'
  if (checks.every((c) => c.status === 'pass')) return 'pass'
  return 'unknown'
}

// P1→P2 thresholds (Wedding Shred protocol):
//   weight Δ −0.5 to −1.5 kg from start
//   waist  Δ ≤ −1.0 cm
//   sleep  7-day avg > 75
//   HRV    balanced on ≥ 4 of last 7 days
export function getP1toP2Gate(
  weightLogs: WeightLog[],
  garminMetrics: GarminMetrics[],
): PhaseGate {
  const checks: GateCheck[] = []
  const sortedWeights = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  const newest = sortedWeights[sortedWeights.length - 1]
  const oldest = sortedWeights[0]

  if (newest) {
    const delta = newest.weight_kg - START_WEIGHT
    const pass = delta <= -0.5 && delta >= -1.5
    checks.push({
      label: 'Weight loss',
      status: pass ? 'pass' : 'fail',
      details: `Δ ${delta.toFixed(1)} kg vs start (target −0.5 to −1.5)`,
    })
  } else {
    checks.push({ label: 'Weight loss', status: 'unknown', details: 'No weigh-ins logged yet' })
  }

  const waistOldest = oldest ? latestWaist(oldest) : null
  const waistNewest = newest ? latestWaist(newest) : null
  if (oldest && newest && waistOldest !== null && waistNewest !== null && oldest.id !== newest.id) {
    const delta = waistNewest - waistOldest
    const pass = delta <= -1
    checks.push({
      label: 'Waist trend',
      status: pass ? 'pass' : 'fail',
      details: `Δ ${delta.toFixed(1)} cm (target ≤ −1.0)`,
    })
  } else {
    checks.push({ label: 'Waist trend', status: 'unknown', details: 'Need ≥ 2 waist measurements' })
  }

  const recentSleep = garminMetrics.filter((m) => m.sleep_score !== null).slice(0, 7)
  if (recentSleep.length >= 4) {
    const avg = recentSleep.reduce((s, m) => s + (m.sleep_score ?? 0), 0) / recentSleep.length
    const pass = avg > 75
    checks.push({
      label: 'Sleep avg',
      status: pass ? 'pass' : 'fail',
      details: `${avg.toFixed(0)} over ${recentSleep.length}d (target > 75)`,
    })
  } else {
    checks.push({
      label: 'Sleep avg',
      status: 'unknown',
      details: `Need 4+ Garmin entries (have ${recentSleep.length})`,
    })
  }

  const recentHrv = garminMetrics.filter((m) => m.hrv_status !== null).slice(0, 7)
  if (recentHrv.length >= 4) {
    const balanced = recentHrv.filter((m) => m.hrv_status === 'balanced').length
    const pass = balanced >= 4
    checks.push({
      label: 'HRV balanced',
      status: pass ? 'pass' : 'fail',
      details: `${balanced}/${recentHrv.length} days balanced (target ≥ 4)`,
    })
  } else {
    checks.push({
      label: 'HRV balanced',
      status: 'unknown',
      details: `Need 4+ Garmin entries (have ${recentHrv.length})`,
    })
  }

  return { fromPhase: 'P1', toPhase: 'P2', checks, overall: rollupOverall(checks) }
}

// P2→P3 thresholds:
//   weight Δ −1.5 to −3.0 kg total from start
//   waist  Δ ≤ −2.0 cm from start
// Lifts-maintained gate is deferred — needs RPE-tracked primary data.
export function getP2toP3Gate(weightLogs: WeightLog[]): PhaseGate {
  const checks: GateCheck[] = []
  const sortedWeights = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  const newest = sortedWeights[sortedWeights.length - 1]
  const oldest = sortedWeights[0]

  if (newest) {
    const delta = newest.weight_kg - START_WEIGHT
    const pass = delta <= -1.5 && delta >= -3
    checks.push({
      label: 'Total weight loss',
      status: pass ? 'pass' : 'fail',
      details: `Δ ${delta.toFixed(1)} kg vs start (target −1.5 to −3.0)`,
    })
  } else {
    checks.push({ label: 'Total weight loss', status: 'unknown', details: 'No weigh-ins logged yet' })
  }

  const waistOldest = oldest ? latestWaist(oldest) : null
  const waistNewest = newest ? latestWaist(newest) : null
  if (oldest && newest && waistOldest !== null && waistNewest !== null && oldest.id !== newest.id) {
    const delta = waistNewest - waistOldest
    const pass = delta <= -2
    checks.push({
      label: 'Total waist Δ',
      status: pass ? 'pass' : 'fail',
      details: `Δ ${delta.toFixed(1)} cm (target ≤ −2.0)`,
    })
  } else {
    checks.push({ label: 'Total waist Δ', status: 'unknown', details: 'Need ≥ 2 waist measurements' })
  }

  return { fromPhase: 'P2', toPhase: 'P3', checks, overall: rollupOverall(checks) }
}
