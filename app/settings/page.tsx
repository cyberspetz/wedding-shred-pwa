'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/navigation/BottomNav'
import { supabase } from '@/lib/supabase'
import {
  getDaysToWedding,
  getCurrentWeek,
  getPhase,
  GOAL_WEIGHT,
  START_WEIGHT,
  PROTEIN_TARGET,
} from '@/lib/utils'

const STATS = [
  { label: 'Height', value: '191 cm' },
  { label: 'Start Weight', value: `${START_WEIGHT} kg` },
  { label: 'Goal Weight', value: `${GOAL_WEIGHT} kg` },
  { label: 'Target Body Fat', value: '14–15%' },
  { label: 'Daily Protein', value: `${PROTEIN_TARGET}g (4 × ~40g)` },
  { label: 'Timezone', value: 'Asia/Ho_Chi_Minh (ICT)' },
  { label: 'Wedding Date', value: 'June 20, 2026' },
]

export default function SettingsPage() {
  const [user, setUser] = useState<{ email: string | undefined } | null>(null)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [showInstall, setShowInstall] = useState(false)
  const router = useRouter()

  const week = getCurrentWeek()
  const phase = getPhase(week)
  const daysLeft = getDaysToWedding()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ email: user.email })
    })
  }, [])

  async function sendMagicLink() {
    if (!email) return
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (!error) setSent(true)
    setSending(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted text-sm mt-0.5">Yaroslav · Wedding Shred</p>
      </div>

      <div className="flex-1 px-5 pb-nav overflow-y-auto space-y-4">
        {/* Auth Card */}
        <div className="bg-card rounded-2xl p-5">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Account</p>
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                  Y
                </div>
                <div>
                  <p className="font-medium text-sm">Yaroslav</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <div className="ml-auto">
                  <div className="w-2.5 h-2.5 rounded-full bg-green" />
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full py-3 rounded-xl bg-border text-sm font-medium text-muted"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sent ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-2">📧</div>
                  <p className="text-sm font-medium">Magic link sent!</p>
                  <p className="text-xs text-muted mt-1">Check your email and tap the link to sign in.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted">Sign in with your email — no password needed.</p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
                  />
                  <button
                    onClick={sendMagicLink}
                    disabled={sending || !email}
                    className="w-full py-3.5 rounded-xl bg-accent text-white font-semibold text-sm disabled:opacity-40"
                  >
                    {sending ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* PWA Install */}
        <div className="bg-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted uppercase tracking-wider">Install App</p>
          </div>
          <div className="bg-bg rounded-xl p-4 space-y-2.5 text-sm">
            <p className="font-medium">Add to iPhone Home Screen</p>
            <ol className="space-y-2 text-muted text-sm">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Tap the Share button (□↑) in Safari</li>
              <li className="flex gap-2"><span className="text-accent font-bold">2.</span> Scroll down and tap "Add to Home Screen"</li>
              <li className="flex gap-2"><span className="text-accent font-bold">3.</span> Tap "Add" — the app opens full screen</li>
            </ol>
          </div>
        </div>

        {/* Progress summary */}
        <div className="bg-card rounded-2xl p-5">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Program Status</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Days to wedding</span>
              <span className="font-num font-bold text-accent">{daysLeft}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Current week</span>
              <span className="font-num font-bold text-white">{week} / 8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Phase</span>
              <span className="text-sm font-medium text-accent">{phase.name}</span>
            </div>
          </div>
        </div>

        {/* Personal stats */}
        <div className="bg-card rounded-2xl p-5">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Your Profile</p>
          <div className="space-y-2.5">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-muted">{s.label}</span>
                <span className="text-sm text-white font-num">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* App version */}
        <div className="text-center py-4">
          <p className="text-xs text-muted">Wedding Shred v1.0</p>
          <p className="text-xs text-muted/50 mt-0.5">Built for June 20, 2026 💪</p>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
