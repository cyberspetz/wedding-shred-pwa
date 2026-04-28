'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getTodayString, getTodayWorkout } from '@/lib/utils'
import type { DailyHabits } from '@/types'

const SLOTS = [
  { key: 'protein_breakfast' as const, label: 'B', name: 'Breakfast' },
  { key: 'protein_lunch' as const, label: 'L', name: 'Lunch' },
  { key: 'protein_snack' as const, label: 'S', name: 'Snack' },
  { key: 'protein_dinner' as const, label: 'D', name: 'Dinner' },
]

type SlotKey = (typeof SLOTS)[number]['key']

export default function DailyHabitsCard() {
  const [habits, setHabits] = useState<DailyHabits | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const today = getTodayString()
  const todayActivity = getTodayWorkout()
  const isGymDay = todayActivity === 'A' || todayActivity === 'B' || todayActivity === 'C'

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('daily_habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
    if (data) setHabits(data as DailyHabits)
  }, [today])

  useEffect(() => { load() }, [load])

  async function persist(next: Partial<DailyHabits>) {
    if (!userId) return
    const merged: DailyHabits = {
      id: habits?.id ?? '',
      user_id: userId,
      date: today,
      protein_breakfast: habits?.protein_breakfast ?? false,
      protein_lunch: habits?.protein_lunch ?? false,
      protein_snack: habits?.protein_snack ?? false,
      protein_dinner: habits?.protein_dinner ?? false,
      ate_after_21: habits?.ate_after_21 ?? null,
      created_at: habits?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...next,
    }
    setHabits(merged)
    const { id, created_at, ...rest } = merged
    await supabase.from('daily_habits').upsert(rest, { onConflict: 'user_id,date' })
  }

  function toggleSlot(key: SlotKey) {
    persist({ [key]: !(habits?.[key] ?? false) })
  }

  function setCutoff(ateAfter: boolean) {
    const current = habits?.ate_after_21
    persist({ ate_after_21: current === ateAfter ? null : ateAfter })
  }

  const proteinCount = SLOTS.filter((s) => habits?.[s.key]).length

  return (
    <div className="bg-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Today's Habits</p>
        <Link href="/log" className="text-xs text-muted">Log details →</Link>
      </div>

      {/* Protein anchor slots */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted">Protein meals (~40g each)</p>
          <p className="text-xs font-num font-medium">
            <span className={proteinCount >= 4 ? 'text-green' : proteinCount >= 2 ? 'text-yellow' : 'text-muted'}>
              {proteinCount}
            </span>
            <span className="text-muted">/4</span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SLOTS.map((s) => {
            const active = habits?.[s.key] ?? false
            return (
              <button
                key={s.key}
                onClick={() => toggleSlot(s.key)}
                aria-pressed={active}
                aria-label={`${s.name} protein`}
                className={`py-3 rounded-xl text-center transition-colors ${
                  active
                    ? 'bg-green text-white'
                    : 'bg-bg text-muted hover:bg-card-hover active:bg-card-hover'
                }`}
              >
                <div className="text-lg font-bold leading-none">{s.label}</div>
                <div className="text-[10px] mt-1 leading-none">{s.name}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Late-eating toggle — gym days only (protocol rule) */}
      {isGymDay && (
        <div>
          <p className="text-xs text-muted mb-2">Stop eating by 21:00 (gym day)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCutoff(false)}
              aria-pressed={habits?.ate_after_21 === false}
              className={`py-2.5 rounded-xl text-xs font-medium transition-colors ${
                habits?.ate_after_21 === false
                  ? 'bg-green text-white'
                  : 'bg-bg text-muted hover:bg-card-hover'
              }`}
            >
              ✓ Stopped before 21:00
            </button>
            <button
              onClick={() => setCutoff(true)}
              aria-pressed={habits?.ate_after_21 === true}
              className={`py-2.5 rounded-xl text-xs font-medium transition-colors ${
                habits?.ate_after_21 === true
                  ? 'bg-accent text-white'
                  : 'bg-bg text-muted hover:bg-card-hover'
              }`}
            >
              ✗ Ate after 21:00
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
