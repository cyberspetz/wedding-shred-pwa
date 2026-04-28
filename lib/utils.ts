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
export const PROTEIN_TARGET = 160 // 4 meals × ~40g per protocol (MPS-saturation per dose)
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

// Returns which workout is scheduled for today based on the fixed weekly schedule.
// Per protocol: 2 gym sessions (Mon=A Lower+Pull, Fri=B Upper+Push),
// 3 badminton (Tue/Thu intense, Sat conditional), rest Wed + Sun.
export type ScheduledActivity = 'A' | 'B' | 'badminton' | 'rest'

export function getTodayWorkout(): ScheduledActivity {
  const now = toZonedTime(new Date(), TZ)
  const day = now.getDay() // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const map: ScheduledActivity[] = ['rest', 'A', 'badminton', 'rest', 'badminton', 'B', 'badminton']
  return map[day]
}

export function getWorkoutLabel(type: ScheduledActivity): string {
  switch (type) {
    case 'A': return 'Workout A — Lower + Pull'
    case 'B': return 'Workout B — Upper + Push'
    case 'badminton': return 'Badminton 🏸'
    case 'rest': return 'Rest / Walk'
  }
}

export function getPhase(weekNumber: number): { name: string; label: string; description: string } {
  if (weekNumber <= 3) return {
    name: 'Shu',
    label: 'Phase 1 — Shu',
    description: 'Foundation. Primaries 4×5 RPE 7. Strict adherence — learn the movement, build volume.',
  }
  if (weekNumber <= 6) return {
    name: 'Ha',
    label: 'Phase 2 — Ha',
    description: 'Intensification. Primaries 4×4 RPE 8. Read Garmin signals — adjust ±5% on the day.',
  }
  if (weekNumber === 7) return {
    name: 'Deload',
    label: 'Phase 3 — Deload',
    description: '−30% volume, all RPE −1. No new exercises, no PR attempts. Recovery week.',
  }
  return {
    name: 'Taper',
    label: 'Phase 3 — Peak Taper',
    description: 'Last hard session Mon Jun 15. After: mobility, holds. No sauna from Jun 17. Walk in fresh.',
  }
}

// Week 1 starts April 26 2026 — 8 weeks back from wedding on June 20
export const PROTOCOL_START = new Date('2026-04-26T00:00:00+07:00')

export function getCurrentWeek(): number {
  const diff = differenceInDays(new Date(), PROTOCOL_START)
  return Math.max(1, Math.min(8, Math.floor(diff / 7) + 1))
}
