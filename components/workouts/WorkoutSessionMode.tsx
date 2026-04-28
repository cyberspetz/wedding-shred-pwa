'use client'

import { useState, useCallback, useEffect } from 'react'
import SetTimer from '@/components/ui/SetTimer'
import Sheet from '@/components/ui/Sheet'
import type { WorkoutProgram } from '@/types'
import { supabase } from '@/lib/supabase'
import { getTodayString } from '@/lib/utils'

interface SetState {
  completed: boolean
  weight: string
  reps: string
  rpe: string
}

type ExerciseSets = Record<string, SetState[]>

interface LastTopSet {
  weight_kg: number | null
  reps: number | null
  rpe: number | null
  date: string
}

export default function WorkoutSessionMode({
  workout,
  onClose,
}: {
  workout: WorkoutProgram
  onClose: () => void
}) {
  const [sets, setSets] = useState<ExerciseSets>(() => {
    const init: ExerciseSets = {}
    workout.exercises.forEach((ex) => {
      init[ex.name] = Array.from({ length: ex.sets }, () => ({
        completed: false,
        weight: '',
        reps: '',
        rpe: '',
      }))
    })
    return init
  })

  const [lastSets, setLastSets] = useState<Record<string, LastTopSet>>({})
  const [showTimer, setShowTimer] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(75)
  const [startTime] = useState(new Date())
  const [showSummary, setShowSummary] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load last completed session of this workout type so we can show the
  // user "last time you hit X — try Y today". Falls back to empty placeholders.
  useEffect(() => {
    let cancelled = false
    async function loadLast() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, date')
        .eq('user_id', user.id)
        .eq('workout_type', workout.id)
        .not('completed_at', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
      if (cancelled || !sessions || sessions.length === 0) return
      const session = sessions[0]
      const { data: logs } = await supabase
        .from('exercise_logs')
        .select('exercise_name, set_number, weight_kg, reps, rpe, completed')
        .eq('session_id', session.id)
        .eq('completed', true)
      if (cancelled || !logs) return
      const top: Record<string, LastTopSet & { set_number: number }> = {}
      for (const l of logs) {
        const cur = top[l.exercise_name]
        if (!cur || l.set_number > cur.set_number) {
          top[l.exercise_name] = {
            set_number: l.set_number,
            weight_kg: l.weight_kg,
            reps: l.reps,
            rpe: l.rpe,
            date: session.date,
          }
        }
      }
      const map: Record<string, LastTopSet> = {}
      for (const [k, v] of Object.entries(top)) {
        const { set_number, ...rest } = v
        map[k] = rest
      }
      setLastSets(map)
    }
    loadLast()
    return () => { cancelled = true }
  }, [workout.id])

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)
  const completedSets = Object.values(sets).flat().filter((s) => s.completed).length
  const progress = Math.round((completedSets / totalSets) * 100)

  const toggleSet = useCallback((exName: string, idx: number) => {
    setSets((prev) => {
      const updated = prev[exName].map((s, i) =>
        i === idx ? { ...s, completed: !s.completed } : s
      )
      if (!prev[exName][idx].completed) {
        // Just completed — show rest timer
        setShowTimer(true)
      }
      return { ...prev, [exName]: updated }
    })
  }, [])

  const updateSet = useCallback((exName: string, idx: number, field: 'weight' | 'reps' | 'rpe', value: string) => {
    setSets((prev) => ({
      ...prev,
      [exName]: prev[exName].map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }))
  }, [])

  async function finishWorkout() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setShowSummary(true); setSaving(false); return }

      const { data: session } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          date: getTodayString(),
          workout_type: workout.id,
          started_at: startTime.toISOString(),
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (session) {
        const logs = workout.exercises.flatMap((ex) =>
          sets[ex.name].map((s, idx) => ({
            session_id: session.id,
            exercise_name: ex.name,
            set_number: idx + 1,
            reps: s.reps ? parseInt(s.reps) : null,
            weight_kg: s.weight ? parseFloat(s.weight) : null,
            rpe: s.rpe ? parseInt(s.rpe) : null,
            completed: s.completed,
          }))
        )
        await supabase.from('exercise_logs').insert(logs)
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
    setShowSummary(true)
  }

  const elapsed = Math.round((Date.now() - startTime.getTime()) / 60000)

  if (showSummary) {
    return (
      <div className="flex flex-col min-h-screen bg-bg items-center justify-center px-6 text-center fade-in">
        <div className="text-5xl mb-4">💪</div>
        <h2 className="text-2xl font-bold mb-2">Workout Done!</h2>
        <p className="text-muted mb-6">{elapsed} min · {completedSets}/{totalSets} sets completed</p>
        <div className="w-full space-y-3 mb-8 text-left">
          {workout.exercises.map((ex) => (
            <div key={ex.name} className="bg-card rounded-xl p-4">
              <p className="text-sm font-medium mb-2">{ex.name}</p>
              <div className="flex gap-2 flex-wrap">
                {sets[ex.name].map((s, i) => (
                  <div
                    key={i}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-num ${
                      s.completed ? 'bg-green/20 text-green' : 'bg-border text-muted'
                    }`}
                  >
                    {s.completed
                      ? `${s.weight || '?'}kg × ${s.reps || ex.reps}`
                      : `Set ${i + 1} skipped`}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-lg"
        >
          Back to Workouts
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border">
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-card flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="font-bold">{workout.name} — {workout.subtitle}</h1>
          <p className="text-xs text-muted">{workout.rest}</p>
        </div>
        <div className="text-right">
          <p className="font-num text-lg font-bold" style={{ color: workout.color }}>{progress}%</p>
          <p className="text-[10px] text-muted">{completedSets}/{totalSets} sets</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, backgroundColor: workout.color }}
        />
      </div>

      {/* Exercises */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {workout.exercises.map((ex, ei) => {
          const last = lastSets[ex.name]
          const suggestion = last && ex.is_primary && last.weight_kg !== null && last.reps !== null
            ? buildSuggestion(last)
            : null
          return (
          <div key={ei} className="bg-card rounded-2xl overflow-hidden">
            {/* Exercise header */}
            <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{ex.name}</p>
                  {ex.is_primary && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-bold uppercase tracking-wider">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">{ex.sets}×{ex.reps} · {ex.cue}</p>
                {last && (
                  <p className="text-[11px] text-muted/80 mt-1 font-num">
                    Last ({last.date}): {last.weight_kg ?? '?'}kg × {last.reps ?? '?'}
                    {last.rpe !== null && ` RPE${last.rpe}`}
                    {suggestion && <span className="text-green ml-1">→ {suggestion}</span>}
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0 mt-0.5">
                {ex.youtube && (
                  <a
                    href={ex.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-red-900/30 flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444">
                      <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.2 3 12 3 12 3s-4.2 0-6.8.9c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.2v1.9c0 2.1.3 4.2.3 4.2s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.3 21.4 12 21.5 12 21.5s4.2 0 6.8-.9c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.2v-1.9C23.3 9.1 23 7 23 7zm-13.5 8.5V8.3l6.5 3.6-6.5 3.6z"/>
                    </svg>
                  </a>
                )}
                {ex.musclewiki && (
                  <a
                    href={ex.musclewiki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-green/10 flex items-center justify-center text-[9px] font-bold text-green"
                  >
                    MW
                  </a>
                )}
              </div>
            </div>

            {/* Sets */}
            <div className="p-4 space-y-2.5">
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-[10px] text-muted uppercase tracking-wider px-1">
                <div className="col-span-1">Set</div>
                <div className="col-span-4">Weight (kg)</div>
                <div className="col-span-4">Reps</div>
                <div className="col-span-3 text-right">Done</div>
              </div>
              {sets[ex.name].map((s, si) => (
                <div key={si} className={`grid grid-cols-12 gap-2 items-center rounded-xl px-3 py-2.5 ${s.completed ? 'bg-green/10' : 'bg-bg'}`}>
                  <div className="col-span-1">
                    <span className="text-xs font-num text-muted">{si + 1}</span>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      value={s.weight}
                      onChange={(e) => updateSet(ex.name, si, 'weight', e.target.value)}
                      placeholder="0"
                      className="w-full bg-card rounded-lg px-2 py-1.5 text-sm font-num text-center border border-border focus:border-accent outline-none"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => updateSet(ex.name, si, 'reps', e.target.value)}
                      placeholder={ex.reps.split(' ')[0]}
                      className="w-full bg-card rounded-lg px-2 py-1.5 text-sm font-num text-center border border-border focus:border-accent outline-none"
                    />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <button
                      onClick={() => toggleSet(ex.name, si)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        s.completed
                          ? 'bg-green check-pop'
                          : 'bg-border'
                      }`}
                    >
                      {s.completed ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      ) : (
                        <div className="w-4 h-4 rounded-sm border-2 border-muted" />
                      )}
                    </button>
                  </div>
                  {ex.is_primary && (
                    <div className="col-span-12 flex items-center gap-2 pt-2 -mb-1 border-t border-border/50">
                      <span className="text-[10px] text-muted uppercase tracking-wider w-8 shrink-0">RPE</span>
                      <div className="flex gap-1 flex-1">
                        {[6, 7, 8, 9, 10].map((r) => (
                          <button
                            key={r}
                            onClick={() => updateSet(ex.name, si, 'rpe', s.rpe === String(r) ? '' : String(r))}
                            aria-pressed={s.rpe === String(r)}
                            className={`flex-1 py-1 rounded-md text-[11px] font-num font-medium transition-colors ${
                              s.rpe === String(r) ? 'bg-accent text-white' : 'bg-card text-muted'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          )
        })}

        {/* Finish button */}
        <button
          onClick={finishWorkout}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-base mt-2 disabled:opacity-50"
        >
          {saving ? 'Saving...' : `Finish Workout (${elapsed} min)`}
        </button>
        <div className="h-6" />
      </div>

      {/* Rest Timer Sheet */}
      <Sheet open={showTimer} onClose={() => setShowTimer(false)} title="Rest Timer">
        <SetTimer
          seconds={timerSeconds}
          onComplete={() => setShowTimer(false)}
          onDismiss={() => setShowTimer(false)}
        />
        <div className="flex gap-2 mt-2">
          {[45, 60, 75, 90].map((s) => (
            <button
              key={s}
              onClick={() => setTimerSeconds(s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-num font-medium transition-colors ${
                timerSeconds === s ? 'bg-accent text-white' : 'bg-border text-muted'
              }`}
            >
              {s}s
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}

// Naive RPE-driven progression suggestion for primaries:
//   last hit RPE ≤ 7 with reps ≥ target → +2.5kg
//   last hit RPE ≥ 9                    → hold or back off
//   last hit reps < target              → match weight, keep building
function buildSuggestion(last: LastTopSet): string {
  if (last.weight_kg === null || last.reps === null) return ''
  const w = last.weight_kg
  const r = last.reps
  const rpe = last.rpe
  if (rpe !== null) {
    if (rpe <= 7 && r >= 5) return `try ${(w + 2.5).toFixed(1)}kg`
    if (rpe >= 9) return `hold ${w}kg`
  } else if (r >= 6) {
    return `try ${(w + 2.5).toFixed(1)}kg`
  }
  return `match ${w}kg`
}
