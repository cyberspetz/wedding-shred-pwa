import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, format, parseISO, startOfDay } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const WEDDING_DATE = new Date('2026-06-20T00:00:00+07:00')
export const GOAL_WEIGHT = 83
export const START_WEIGHT = 88.1
export const CALORIE_TARGET = 2100
export const PROTEIN_TARGET = 140
export const WATER_TARGET_ML = 3000
export const TZ = 'Asia/Ho_Chi_Minh'

export function getDaysToWedding(): number {
  const now = new Date()
  return Math.max(0, differenceInDays(WEDDING_DATE, startOfDay(now)))
}

export function getWeightProgress(currentWeight: number): number {
  const lost = START_WEIGHT - currentWeight
  const tolose = START_WEIGHT - GOAL_WEIGHT
  return Math.min(100, Math.max(0, (lost / tolose) * 100))
}

export function getTodayString(): string {
  const now = toZonedTime(new Date(), TZ)
  return format(now, 'yyyy-MM-dd')
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d')
}

export function formatWeight(w: number): string {
  return w.toFixed(1)
}

// Returns which workout is scheduled for today based on the fixed weekly schedule
// Mon=A, Tue=badminton, Wed=B, Thu=badminton, Fri=A, Sat=badminton, Sun=rest
export type ScheduledActivity = 'A' | 'B' | 'C' | 'badminton' | 'rest'

export function getTodayWorkout(): ScheduledActivity {
  const now = toZonedTime(new Date(), TZ)
  const day = now.getDay() // 0=Sun, 1=Mon...
  const map: ScheduledActivity[] = ['rest', 'A', 'badminton', 'B', 'badminton', 'A', 'badminton']
  return map[day]
}

export function getWorkoutLabel(type: ScheduledActivity): string {
  switch (type) {
    case 'A': return 'Workout A — Push + Core'
    case 'B': return 'Workout B — Pull + Core'
    case 'C': return 'Workout C — Full Body'
    case 'badminton': return 'Badminton 🏸'
    case 'rest': return 'Rest / Walk'
  }
}

export function getPhase(weekNumber: number): { name: string; label: string; description: string } {
  if (weekNumber <= 3) return { name: 'Shu', label: 'Phase 1 — Shu', description: 'Light weights, learn form. 2 gym sessions/week.' }
  if (weekNumber <= 6) return { name: 'Ha', label: 'Phase 2 — Ha', description: '+10-20% weight, add Workout C. 3 sessions/week, rest 60 sec.' }
  return { name: 'Peak', label: 'Phase 3 — Peak', description: 'Superset exercises. Rest 45-60 sec. Maximum intensity.' }
}

// Week 1 starts March 30 2026
export function getCurrentWeek(): number {
  const start = new Date('2026-03-30T00:00:00+07:00')
  const now = new Date()
  const diff = differenceInDays(now, start)
  return Math.max(1, Math.min(8, Math.floor(diff / 7) + 1))
}
