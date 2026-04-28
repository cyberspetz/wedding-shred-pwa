'use client'

import { getCurrentWeek, getDaysToWedding, getPeakWeekStatus, LAST_HARD_DATE, SAUNA_LOCK_DATE } from '@/lib/utils'

export default function PeakWeekBanner() {
  const week = getCurrentWeek()
  const status = getPeakWeekStatus(week)
  const daysLeft = getDaysToWedding()

  if (!status.inDeload && !status.inPeak) return null

  if (status.inDeload) {
    return (
      <div className="bg-card rounded-2xl p-5" style={{ borderLeft: '4px solid #60a5fa' }}>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#60a5fa' }}>Deload Week · {daysLeft} days out</p>
        <p className="font-semibold text-sm">−30% volume, all RPE −1</p>
        <p className="text-xs text-muted mt-1.5">
          No new exercises. No PR attempts. This week's job is recovery and CNS reset.
          Last hard session is Mon {LAST_HARD_DATE.slice(5)}.
        </p>
      </div>
    )
  }

  // Peak / W8
  return (
    <div className="bg-card rounded-2xl p-5" style={{ borderLeft: '4px solid #f5c542' }}>
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#f5c542' }}>
        🔒 Peak Taper · {daysLeft} day{daysLeft === 1 ? '' : 's'} to wedding
      </p>
      <p className="font-semibold text-sm">
        {status.lastHardPassed
          ? 'Hard training is over. Mobility + holds only.'
          : `Last hard session today (${LAST_HARD_DATE.slice(5)}). Then mobility + holds only.`}
      </p>
      <ul className="text-xs text-muted mt-2 space-y-1 list-disc list-inside">
        <li>No new exercises, supplements, sun beds, diuretics</li>
        <li>No water/carb manipulation — keep salt normal</li>
        <li>{status.saunaLocked
          ? 'Sauna locked (cold/flu risk pre-event)'
          : `Sauna allowed until ${SAUNA_LOCK_DATE.slice(5)}, then off`}
        </li>
      </ul>
    </div>
  )
}
