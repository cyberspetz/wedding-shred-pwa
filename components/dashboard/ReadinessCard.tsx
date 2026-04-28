'use client'

import { useCallback, useEffect, useState } from 'react'
import Sheet from '@/components/ui/Sheet'
import { supabase } from '@/lib/supabase'
import { getTodayString } from '@/lib/utils'
import { getReadinessAdvice, LEVEL_COLOR } from '@/lib/garmin'
import type { GarminMetrics, HrvStatus } from '@/types'

const HRV_OPTIONS: HrvStatus[] = ['balanced', 'unbalanced', 'low', 'poor']

type FormState = {
  training_readiness: string
  hrv_status: HrvStatus | ''
  body_battery_am: string
  sleep_score: string
}

const EMPTY_FORM: FormState = {
  training_readiness: '',
  hrv_status: '',
  body_battery_am: '',
  sleep_score: '',
}

export default function ReadinessCard() {
  const [metrics, setMetrics] = useState<GarminMetrics | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const today = getTodayString()

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('garmin_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
    if (data) {
      const m = data as GarminMetrics
      setMetrics(m)
      setForm({
        training_readiness: m.training_readiness?.toString() ?? '',
        hrv_status: m.hrv_status ?? '',
        body_battery_am: m.body_battery_am?.toString() ?? '',
        sleep_score: m.sleep_score?.toString() ?? '',
      })
    }
  }, [today])

  useEffect(() => { load() }, [load])

  const advice = getReadinessAdvice(metrics)
  const color = LEVEL_COLOR[advice.level]

  async function save() {
    if (!userId) return
    const payload = {
      user_id: userId,
      date: today,
      training_readiness: form.training_readiness ? parseInt(form.training_readiness) : null,
      hrv_status: form.hrv_status || null,
      body_battery_am: form.body_battery_am ? parseInt(form.body_battery_am) : null,
      sleep_score: form.sleep_score ? parseInt(form.sleep_score) : null,
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase
      .from('garmin_metrics')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .maybeSingle()
    if (data) setMetrics(data as GarminMetrics)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-card rounded-2xl p-5 text-left active:bg-card-hover transition-colors"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted uppercase tracking-wider">Today's Readiness</p>
          <span className="text-[10px] text-muted">tap to {metrics ? 'edit' : 'log'}</span>
        </div>
        <p className="font-semibold text-base" style={{ color }}>{advice.headline}</p>
        {advice.detail.length > 0 && (
          <p className="text-xs text-muted mt-1.5 font-num">
            {advice.detail.join(' · ')}
          </p>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Garmin Metrics — Today">
        <div className="space-y-4">
          <p className="text-xs text-muted">
            Open the Garmin Connect app → today's Health → copy the values below. Skip any metric Garmin missed —
            you can still log others.
          </p>

          <Field label="Training Readiness (0–100)">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={form.training_readiness}
              onChange={(e) => setForm((f) => ({ ...f, training_readiness: e.target.value }))}
              placeholder="e.g. 62"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
            />
          </Field>

          <Field label="HRV Status">
            <div className="grid grid-cols-4 gap-2">
              {HRV_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hrv_status: f.hrv_status === s ? '' : s }))}
                  className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                    form.hrv_status === s ? 'bg-accent text-white' : 'bg-bg text-muted'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Body Battery AM">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={form.body_battery_am}
                onChange={(e) => setForm((f) => ({ ...f, body_battery_am: e.target.value }))}
                placeholder="e.g. 78"
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
              />
            </Field>
            <Field label="Sleep Score">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={form.sleep_score}
                onChange={(e) => setForm((f) => ({ ...f, sleep_score: e.target.value }))}
                placeholder="e.g. 80"
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
              />
            </Field>
          </div>

          <button
            onClick={save}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold"
          >
            Save
          </button>
        </div>
      </Sheet>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted mb-2 block">{label}</label>
      {children}
    </div>
  )
}
