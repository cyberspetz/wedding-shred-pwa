'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/navigation/BottomNav'
import ProgressRing from '@/components/ui/ProgressRing'
import ProgressBar from '@/components/ui/ProgressBar'
import DailyHabitsCard from '@/components/dashboard/DailyHabitsCard'
import ReadinessCard from '@/components/dashboard/ReadinessCard'
import TravelBanner from '@/components/dashboard/TravelBanner'
import PeakWeekBanner from '@/components/dashboard/PeakWeekBanner'
import PhaseGateCard from '@/components/dashboard/PhaseGateCard'
import {
  getDaysToWedding,
  getWeightProgress,
  getTodayWorkout,
  getWorkoutLabel,
  getCurrentWeek,
  getPhase,
  getTodayString,
  rollingAverage,
  daysAgoString,
  GOAL_WEIGHT,
  START_WEIGHT,
} from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { WeightLog } from '@/types'

export default function Dashboard() {
  const [recentLogs, setRecentLogs] = useState<WeightLog[]>([])

  const daysLeft = getDaysToWedding()
  const todayActivity = getTodayWorkout()
  const currentWeek = getCurrentWeek()
  const phase = getPhase(currentWeek)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const since = daysAgoString(14)
      const { data } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', since)
        .order('date', { ascending: false })

      if (data) setRecentLogs(data as WeightLog[])
    }
    load()
  }, [])

  const today = getTodayString()
  const latestWeight = recentLogs[0] ?? null
  const avg7 = rollingAverage(recentLogs, today, 7)
  const avg7Prev = rollingAverage(recentLogs, daysAgoString(7), 7)
  const weeklyDelta = avg7 !== null && avg7Prev !== null ? avg7 - avg7Prev : null

  // Display the smoothed 7-day avg when available — otherwise the latest single
  // entry, otherwise the configured start. Daily delta is intentionally not
  // shown: ±0.3kg is water/glycogen/salt noise, not signal.
  const currentWeight = avg7 ?? latestWeight?.weight_kg ?? START_WEIGHT
  const weightPct = getWeightProgress(currentWeight)

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Header */}
      <div className="pt-safe px-5 pt-6 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted text-sm">Good {getGreeting()}, Yaroslav</p>
            <h1 className="text-2xl font-bold mt-0.5">Wedding Shred</h1>
          </div>
          <div className="text-right">
            <p className="font-num text-3xl font-bold text-accent">{daysLeft}</p>
            <p className="text-xs text-muted">days left</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 space-y-4 pb-nav overflow-y-auto">
        {/* Peak-week / deload lockdown banner — only visible W7-W8 */}
        <PeakWeekBanner />

        {/* Weight + Progress Ring */}
        <div className="bg-card rounded-2xl p-5 flex items-center gap-4">
          <ProgressRing percent={weightPct} size={88} strokeWidth={7} color="#e85d3a">
            <div className="text-center">
              <p className="font-num text-lg font-bold leading-none">{weightPct.toFixed(0)}%</p>
              <p className="text-[9px] text-muted leading-none mt-0.5">goal</p>
            </div>
          </ProgressRing>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-num text-4xl font-bold">{currentWeight.toFixed(1)}</span>
              <span className="text-muted text-sm">kg{avg7 !== null ? ' · 7d avg' : ''}</span>
            </div>
            <div className="text-muted text-xs mt-1 flex items-center gap-1.5">
              {weeklyDelta !== null ? (
                <span className={`font-medium ${weeklyDelta < 0 ? 'text-green' : 'text-accent'}`}>
                  {weeklyDelta < 0 ? '↓' : '↑'}{Math.abs(weeklyDelta).toFixed(1)} kg vs last week
                </span>
              ) : (
                <span className="text-muted">Need 2 weekly weigh-ins for trend</span>
              )}
            </div>
            <div className="text-muted text-xs mt-1">
              Goal: <span className="text-white font-num font-medium">{GOAL_WEIGHT} kg</span>
              <span className="mx-1.5">·</span>
              <span className="font-num">{(currentWeight - GOAL_WEIGHT).toFixed(1)} kg to go</span>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={parseFloat((START_WEIGHT - currentWeight).toFixed(1))}
                max={parseFloat((START_WEIGHT - GOAL_WEIGHT).toFixed(1))}
                color="#e85d3a"
                showValue={false}
                height="h-1.5"
              />
              <div className="flex justify-between mt-1 text-[10px] text-muted font-num">
                <span>{START_WEIGHT} kg</span>
                <span>{GOAL_WEIGHT} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Travel mode — auto-activates when current date in a travel period */}
        <TravelBanner />

        {/* Today's Readiness — Garmin-driven session prescription */}
        <ReadinessCard />

        {/* Today's Workout */}
        <Link href="/workouts">
          <div className={`bg-card rounded-2xl p-5 border border-border hover:border-accent/30 transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-1">Today</p>
                <p className="font-semibold text-base">{getWorkoutLabel(todayActivity)}</p>
                <p className="text-xs text-muted mt-1">
                  Week {currentWeek} · {phase.label}
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ActivityIcon type={todayActivity} />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Daily habits — protein anchors + 21:00 cutoff */}
        <DailyHabitsCard />

        {/* Weekly Schedule */}
        <WeeklyMiniCalendar />

        {/* Phase transition gate — only renders during W3 or W6 */}
        <PhaseGateCard />

        {/* Phase Info */}
        <div className="bg-card rounded-2xl p-5 border-l-4 border-accent">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Current Phase · Week {currentWeek}/8</p>
          <p className="font-semibold text-accent">{phase.label}</p>
          <p className="text-sm text-muted mt-1">{phase.description}</p>
        </div>

        {/* June 20 countdown */}
        <div className="bg-card rounded-2xl p-5 text-center">
          <p className="text-4xl font-bold font-num text-white">{daysLeft}</p>
          <p className="text-muted text-sm mt-1">days until June 20 ·&nbsp;
            <span className="text-yellow">wedding day</span>
          </p>
          <p className="text-xs text-muted mt-2">
            {currentWeight.toFixed(1)} kg → {GOAL_WEIGHT} kg ·&nbsp;
            <span className="text-white font-num">{(currentWeight - GOAL_WEIGHT).toFixed(1)} kg</span> to lose
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function ActivityIcon({ type }: { type: string }) {
  if (type === 'badminton') return <span className="text-2xl">🏸</span>
  if (type === 'rest') return <span className="text-2xl">🚶</span>
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold font-num text-lg"
      style={{ backgroundColor: type === 'B' ? '#3ecf8e' : '#e85d3a' }}
    >
      {type}
    </div>
  )
}

function WeeklyMiniCalendar() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  // Sun rest, Mon A (Lower+Pull), Tue badminton, Wed rest, Thu badminton, Fri B (Upper+Push), Sat badminton
  const types = ['rest', 'A', 'badminton', 'rest', 'badminton', 'B', 'badminton']
  const colors: Record<string, string> = {
    A: '#e85d3a', B: '#3ecf8e', badminton: '#3ecf8e', rest: '#6b7280'
  }
  const today = new Date().getDay()

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted uppercase tracking-wider mb-3">This Week</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isToday = i === today
          const type = types[i]
          const color = colors[type]
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] ${isToday ? 'text-white font-semibold' : 'text-muted'}`}>{d}</span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold`}
                style={{
                  backgroundColor: isToday ? color : `${color}22`,
                  color: isToday ? '#fff' : color,
                  outline: isToday ? `2px solid ${color}` : 'none',
                  outlineOffset: '2px',
                }}
              >
                {type === 'badminton' ? '🏸' : type === 'rest' ? '·' : type}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
