'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentWeek } from '@/lib/utils'
import { getP1toP2Gate, getP2toP3Gate, type PhaseGate, type GateStatus } from '@/lib/phaseGates'
import type { WeightLog, GarminMetrics } from '@/types'

const STATUS_COLOR: Record<GateStatus, string> = {
  pass: '#3ecf8e',
  fail: '#e85d3a',
  unknown: '#6b7280',
}

const STATUS_ICON: Record<GateStatus, string> = {
  pass: '✓',
  fail: '✗',
  unknown: '·',
}

export default function PhaseGateCard() {
  const [gate, setGate] = useState<PhaseGate | null>(null)
  const [loading, setLoading] = useState(true)
  const week = getCurrentWeek()
  const showCard = week === 3 || week === 6

  const load = useCallback(async () => {
    if (!showCard) {
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: weights } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    const { data: garmin } = await supabase
      .from('garmin_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(14)
    const w = (weights ?? []) as WeightLog[]
    const g = (garmin ?? []) as GarminMetrics[]
    setGate(week === 3 ? getP1toP2Gate(w, g) : getP2toP3Gate(w))
    setLoading(false)
  }, [showCard, week])

  useEffect(() => { load() }, [load])

  if (!showCard || loading || !gate) return null

  const headline =
    gate.overall === 'pass' ? `Cleared — advance ${gate.fromPhase} → ${gate.toPhase} next week`
    : gate.overall === 'fail' ? `Hold ${gate.fromPhase} another week — fix the red items first`
    : `Tracking gates for ${gate.fromPhase} → ${gate.toPhase}`

  return (
    <div
      className="bg-card rounded-2xl p-5"
      style={{ borderLeft: `4px solid ${STATUS_COLOR[gate.overall]}` }}
    >
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: STATUS_COLOR[gate.overall] }}>
        Phase Gate · Week {week}/8
      </p>
      <p className="font-semibold text-sm">{headline}</p>
      <div className="mt-3 space-y-1.5">
        {gate.checks.map((c) => (
          <div key={c.label} className="flex items-start gap-2 text-xs">
            <span
              className="font-bold w-4 shrink-0"
              style={{ color: STATUS_COLOR[c.status] }}
            >
              {STATUS_ICON[c.status]}
            </span>
            <div className="flex-1">
              <span className="text-white/90">{c.label}</span>
              <span className="text-muted ml-1.5 font-num">{c.details}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
