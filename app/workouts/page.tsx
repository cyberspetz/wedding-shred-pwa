'use client'

import { useState } from 'react'
import BottomNav from '@/components/navigation/BottomNav'
import { WORKOUTS, WEEKLY_SCHEDULE, KEY_PRINCIPLES } from '@/lib/workoutData'
import { getTodayWorkout, getCurrentWeek, getPhase } from '@/lib/utils'
import type { WorkoutProgram } from '@/types'
import WorkoutSessionMode from '@/components/workouts/WorkoutSessionMode'

export default function WorkoutsPage() {
  const [activeTab, setActiveTab] = useState<'programs' | 'schedule' | 'principles'>('programs')
  const [sessionWorkout, setSessionWorkout] = useState<WorkoutProgram | null>(null)
  const todayType = getTodayWorkout()
  const week = getCurrentWeek()
  const phase = getPhase(week)

  if (sessionWorkout) {
    return <WorkoutSessionMode workout={sessionWorkout} onClose={() => setSessionWorkout(null)} />
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <p className="text-muted text-sm mt-0.5">Week {week}/8 · {phase.label}</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-card rounded-xl p-1 gap-1">
          {(['programs', 'schedule', 'principles'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                activeTab === t ? 'bg-accent text-white' : 'text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-nav overflow-y-auto">
        {activeTab === 'programs' && (
          <div className="space-y-4">
            {WORKOUTS.map((workout) => {
              const isToday = todayType === workout.id
              const isLocked = workout.id === 'C' && week < 4
              return (
                <WorkoutCard
                  key={workout.id}
                  workout={workout}
                  isToday={isToday}
                  isLocked={isLocked}
                  onStart={() => !isLocked && setSessionWorkout(workout)}
                />
              )
            })}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {WEEKLY_SCHEDULE.map((item, i) => {
              const isToday = new Date().getDay() === i
              return (
                <div
                  key={i}
                  className="bg-card rounded-2xl p-4 flex items-center gap-4"
                  style={isToday ? { outline: `1.5px solid ${item.color}`, outlineOffset: '-1px' } : {}}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: `${item.color}22`, color: item.color }}
                  >
                    {item.day}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isToday ? 'text-white' : 'text-white/80'}`}>
                      {item.label}
                      {isToday && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: item.color }}>Today</span>}
                    </p>
                    {item.duration && <p className="text-xs text-muted mt-0.5">{item.duration}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'principles' && (
          <div className="space-y-3">
            <div className="bg-card rounded-2xl p-4 mb-2">
              <p className="text-xs text-muted uppercase tracking-wider mb-1">The Science</p>
              <p className="text-sm text-white/80">
                These principles are the difference between spinning your wheels and actually showing up lean on June 20.
              </p>
            </div>
            {KEY_PRINCIPLES.map((p, i) => (
              <div key={i} className="bg-card rounded-xl p-4 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-accent text-xs font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function WorkoutCard({
  workout,
  isToday,
  isLocked,
  onStart,
}: {
  workout: WorkoutProgram
  isToday: boolean
  isLocked: boolean
  onStart: () => void
}) {
  const [expanded, setExpanded] = useState(isToday)

  return (
    <div
      className="bg-card rounded-2xl overflow-hidden"
      style={isToday ? { outline: `1.5px solid ${workout.color}`, outlineOffset: '-1px' } : {}}
    >
      {/* Card header */}
      <button
        className="w-full p-5 flex items-center gap-4 text-left"
        onClick={() => setExpanded((e) => !e)}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold font-num shrink-0 text-white"
          style={{ backgroundColor: workout.color }}
        >
          {workout.id}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{workout.name}</p>
            {isToday && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: workout.color }}>
                Today
              </span>
            )}
            {isLocked && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/20 text-muted font-medium">
                Week 4+
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-0.5">{workout.subtitle} · {workout.rest}</p>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#6b7280" strokeWidth="2"
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Exercises */}
      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {workout.exercises.map((ex, i) => (
            <div key={i} className="bg-bg rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    <span className="font-num text-white">{ex.sets}</span> sets ×{' '}
                    <span className="font-num text-white">{ex.reps}</span>
                  </p>
                  <p className="text-xs text-muted/80 mt-1 italic">{ex.cue}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {ex.youtube && (
                    <a
                      href={ex.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-red-900/30 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      MW
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Start button */}
          <button
            onClick={onStart}
            disabled={isLocked}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm mt-2 transition-colors ${
              isLocked
                ? 'bg-border text-muted cursor-not-allowed'
                : 'text-white'
            }`}
            style={!isLocked ? { backgroundColor: workout.color } : {}}
          >
            {isLocked ? '🔒 Unlocks at Week 4' : `Start ${workout.name}`}
          </button>
        </div>
      )}
    </div>
  )
}
