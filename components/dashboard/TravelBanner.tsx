'use client'

import { useCallback, useEffect, useState } from 'react'
import Sheet from '@/components/ui/Sheet'
import { supabase } from '@/lib/supabase'
import { getTodayString } from '@/lib/utils'
import type { TravelPeriod } from '@/types'

function isInRange(today: string, start: string, end: string): boolean {
  return today >= start && today <= end
}

function isUpcoming(today: string, start: string): { upcoming: boolean; daysUntil: number } {
  if (today >= start) return { upcoming: false, daysUntil: 0 }
  const t = new Date(today)
  const s = new Date(start)
  const days = Math.round((s.getTime() - t.getTime()) / 86400000)
  return { upcoming: true, daysUntil: days }
}

export default function TravelBanner() {
  const [trip, setTrip] = useState<TravelPeriod | null>(null)
  const [allTrips, setAllTrips] = useState<TravelPeriod[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const today = getTodayString()
  const [form, setForm] = useState({ id: '', start_date: '', end_date: '', label: '' })

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from('travel_periods')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true })
    const trips = (data ?? []) as TravelPeriod[]
    setAllTrips(trips)
    const active = trips.find((t) => isInRange(today, t.start_date, t.end_date))
    const upcoming = active ?? trips
      .filter((t) => t.start_date > today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0]
    setTrip(upcoming ?? null)
  }, [today])

  useEffect(() => { load() }, [load])

  function openSheetForNew() {
    setForm({ id: '', start_date: '', end_date: '', label: '' })
    setOpen(true)
  }

  function openSheetForEdit(t: TravelPeriod) {
    setForm({
      id: t.id,
      start_date: t.start_date,
      end_date: t.end_date,
      label: t.label ?? '',
    })
    setOpen(true)
  }

  async function save() {
    if (!userId || !form.start_date || !form.end_date) return
    if (form.id) {
      await supabase
        .from('travel_periods')
        .update({
          start_date: form.start_date,
          end_date: form.end_date,
          label: form.label || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', form.id)
    } else {
      await supabase.from('travel_periods').insert({
        user_id: userId,
        start_date: form.start_date,
        end_date: form.end_date,
        label: form.label || null,
      })
    }
    setOpen(false)
    load()
  }

  async function remove() {
    if (!form.id) return
    await supabase.from('travel_periods').delete().eq('id', form.id)
    setOpen(false)
    load()
  }

  if (!trip) {
    return (
      <>
        <button
          onClick={openSheetForNew}
          className="w-full bg-card rounded-2xl p-4 text-left text-sm text-muted active:bg-card-hover transition-colors border border-dashed border-border"
        >
          🛫 Plan travel period (China end of May, etc.)
        </button>
        <TravelSheet
          open={open}
          onClose={() => setOpen(false)}
          form={form}
          setForm={setForm}
          onSave={save}
          onDelete={form.id ? remove : undefined}
        />
      </>
    )
  }

  const inTrip = isInRange(today, trip.start_date, trip.end_date)
  const { upcoming, daysUntil } = isUpcoming(today, trip.start_date)

  return (
    <>
      <button
        onClick={() => openSheetForEdit(trip)}
        className="w-full bg-card rounded-2xl p-5 text-left active:bg-card-hover transition-colors"
        style={{ borderLeft: '4px solid #f5c542' }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-wider" style={{ color: '#f5c542' }}>
            {inTrip ? '🛫 Travel mode active' : '✈️ Travel coming up'}
          </p>
          <span className="text-[10px] text-muted">tap to edit</span>
        </div>
        <p className="font-semibold text-base">
          {trip.label || 'Travel'}{' '}
          <span className="text-muted font-normal text-sm font-num">
            {trip.start_date} → {trip.end_date}
          </span>
        </p>
        <p className="text-xs text-muted mt-1.5">
          {inTrip
            ? 'Weigh-ins paused. Bodyweight fallback for gym days. Restaurant rule: protein anchor first, ½ plate veg.'
            : `Starts in ${daysUntil} day${daysUntil === 1 ? '' : 's'}. Maintain-don't-gain mode kicks in automatically.`}
        </p>
        {allTrips.length > 1 && (
          <p className="text-[10px] text-muted mt-2">+{allTrips.length - 1} more trip{allTrips.length - 1 === 1 ? '' : 's'}</p>
        )}
      </button>
      <TravelSheet
        open={open}
        onClose={() => setOpen(false)}
        form={form}
        setForm={setForm}
        onSave={save}
        onDelete={form.id ? remove : undefined}
      />
    </>
  )
}

function TravelSheet({
  open, onClose, form, setForm, onSave, onDelete,
}: {
  open: boolean
  onClose: () => void
  form: { id: string; start_date: string; end_date: string; label: string }
  setForm: (f: { id: string; start_date: string; end_date: string; label: string }) => void
  onSave: () => void
  onDelete?: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title={form.id ? 'Edit Travel' : 'Plan Travel Period'}>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted mb-2 block">Label (optional)</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="e.g. China — Shanghai/Hangzhou/HK"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted mb-2 block">Start date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs text-muted mb-2 block">End date</label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
            />
          </div>
        </div>
        <button
          onClick={onSave}
          disabled={!form.start_date || !form.end_date}
          className="w-full py-4 rounded-2xl bg-accent text-white font-semibold disabled:opacity-40"
        >
          {form.id ? 'Update' : 'Save'}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="w-full py-3 rounded-2xl bg-bg border border-border text-muted text-sm"
          >
            Delete
          </button>
        )}
      </div>
    </Sheet>
  )
}
