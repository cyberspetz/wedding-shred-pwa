'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface SetTimerProps {
  seconds: number
  onComplete?: () => void
  onDismiss?: () => void
}

export default function SetTimer({ seconds, onComplete, onDismiss }: SetTimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    setRemaining(seconds)
    setRunning(true)
  }, [seconds])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clear()
          setRunning(false)
          onComplete?.()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return clear
  }, [running, clear, onComplete])

  const pct = ((seconds - remaining) / seconds) * 100
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (pct / 100) * circumference

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative w-28 h-28">
        <svg className="-rotate-90 w-28 h-28">
          <circle cx="56" cy="56" r="44" fill="none" stroke="#2a2d35" strokeWidth="6" />
          <circle
            cx="56"
            cy="56"
            r="44"
            fill="none"
            stroke={remaining === 0 ? '#3ecf8e' : '#e85d3a'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-num text-2xl font-bold text-white">
            {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : remaining}
          </span>
          <span className="text-[10px] text-muted uppercase tracking-wider">
            {remaining === 0 ? 'Done!' : 'rest'}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="px-5 py-2.5 rounded-xl bg-border text-sm font-medium"
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => { clear(); onDismiss?.() }}
          className="px-5 py-2.5 rounded-xl bg-accent text-sm font-medium text-white"
        >
          Skip
        </button>
      </div>
      <button
        onClick={() => { setRemaining(seconds); setRunning(true) }}
        className="text-xs text-muted underline"
      >
        Reset
      </button>
    </div>
  )
}
