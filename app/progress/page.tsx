'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import BottomNav from '@/components/navigation/BottomNav'
import Sheet from '@/components/ui/Sheet'
import { supabase } from '@/lib/supabase'
import { formatDate, getTodayString, GOAL_WEIGHT, START_WEIGHT } from '@/lib/utils'
import type { WeightLog, ProgressPhoto } from '@/types'

type Tab = 'weight' | 'composition' | 'photos'

// Seed historical data (displayed even before logging)
const HISTORICAL: Partial<WeightLog>[] = [
  { date: '2026-03-20', weight_kg: 88.1, body_fat_pct: null, smm_kg: null, source: 'scale' },
  { date: '2026-04-06', weight_kg: 86.5, body_fat_pct: 20, smm_kg: 42.3, fat_mass_kg: 11.6, whr: 0.83, bmi: 24.5, source: 'inbody' },
]

// Goal trajectory: linear from 86.5 on Apr 6 → 83 on Jun 20
function getGoalLine() {
  const start = new Date('2026-04-06')
  const end = new Date('2026-06-20')
  const days = Math.round((end.getTime() - start.getTime()) / 86400000)
  const points = []
  for (let i = 0; i <= days; i += 7) {
    const d = new Date(start.getTime() + i * 86400000)
    const w = 86.5 + (83 - 86.5) * (i / days)
    points.push({ date: d.toISOString().slice(0, 10), goal: parseFloat(w.toFixed(2)) })
  }
  return points
}

export default function ProgressPage() {
  const [tab, setTab] = useState<Tab>('weight')
  const [logs, setLogs] = useState<WeightLog[]>([])
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [showAddWeight, setShowAddWeight] = useState(false)
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [form, setForm] = useState({
    date: getTodayString(),
    weight_kg: '',
    waist_navel_cm: '',
    waist_narrowest_cm: '',
    body_fat_pct: '',
    smm_kg: '',
    fat_mass_kg: '',
    whr: '',
    bmi: '',
    source: 'scale' as 'scale' | 'inbody',
    notes: '',
  })
  const [photoForm, setPhotoForm] = useState({ view_type: 'front' as 'front' | 'side' | 'back', file: null as File | null })

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    const { data: photoData } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (data) setLogs(data as WeightLog[])
    if (photoData) setPhotos(photoData as ProgressPhoto[])
  }, [])

  useEffect(() => { load() }, [load])

  // Merge historical + logged for chart
  const allLogs = [...HISTORICAL, ...logs].sort((a, b) =>
    (a.date ?? '').localeCompare(b.date ?? '')
  )

  // Deduplicate by date (prefer user logs)
  const logMap = new Map<string, Partial<WeightLog>>()
  HISTORICAL.forEach((h) => { if (h.date) logMap.set(h.date, h) })
  logs.forEach((l) => logMap.set(l.date, l))
  const chartData = Array.from(logMap.values()).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

  const goalLine = getGoalLine()
  // Merge actual + goal for chart
  const mergedDates = new Set([...chartData.map((d) => d.date!), ...goalLine.map((g) => g.date)])
  const merged = Array.from(mergedDates).sort().map((date) => {
    const actual = chartData.find((d) => d.date === date)
    const goal = goalLine.find((g) => g.date === date)
    return {
      date,
      weight: actual?.weight_kg ?? null,
      goal: goal?.goal ?? null,
      bf: actual?.body_fat_pct ?? null,
      smm: actual?.smm_kg ?? null,
    }
  })

  async function saveWeight() {
    if (!userId || !form.weight_kg) return
    await supabase.from('weight_logs').insert({
      user_id: userId,
      date: form.date,
      weight_kg: parseFloat(form.weight_kg),
      waist_navel_cm: form.waist_navel_cm ? parseFloat(form.waist_navel_cm) : null,
      waist_narrowest_cm: form.waist_narrowest_cm ? parseFloat(form.waist_narrowest_cm) : null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      smm_kg: form.smm_kg ? parseFloat(form.smm_kg) : null,
      fat_mass_kg: form.fat_mass_kg ? parseFloat(form.fat_mass_kg) : null,
      whr: form.whr ? parseFloat(form.whr) : null,
      bmi: form.bmi ? parseFloat(form.bmi) : null,
      source: form.source,
      notes: form.notes || null,
    })
    setShowAddWeight(false)
    setForm({ date: getTodayString(), weight_kg: '', waist_navel_cm: '', waist_narrowest_cm: '', body_fat_pct: '', smm_kg: '', fat_mass_kg: '', whr: '', bmi: '', source: 'scale', notes: '' })
    load()
  }

  async function uploadPhoto() {
    if (!userId || !photoForm.file) return
    setUploadingPhoto(true)
    const ext = photoForm.file.name.split('.').pop()
    const path = `${userId}/${getTodayString()}-${photoForm.view_type}.${ext}`
    const { error } = await supabase.storage.from('progress-photos').upload(path, photoForm.file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('progress-photos').getPublicUrl(path)
      await supabase.from('progress_photos').insert({
        user_id: userId,
        date: getTodayString(),
        photo_url: publicUrl,
        view_type: photoForm.view_type,
      })
      load()
    }
    setUploadingPhoto(false)
    setShowAddPhoto(false)
  }

  const latest = logs[logs.length - 1] ?? HISTORICAL[HISTORICAL.length - 1]

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="text-muted text-sm mt-0.5">Track your transformation</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-card rounded-xl p-1 gap-1">
          {(['weight', 'composition', 'photos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                tab === t ? 'bg-accent text-white' : 'text-muted'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-nav overflow-y-auto">
        {tab === 'weight' && (
          <>
            {/* Current stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <StatMini label="Current" value={`${latest?.weight_kg ?? '—'}`} unit="kg" color="#e85d3a" />
              <StatMini label="Goal" value={`${GOAL_WEIGHT}`} unit="kg" color="#3ecf8e" />
              <StatMini label="To Go" value={`${((latest?.weight_kg ?? 86.5) - GOAL_WEIGHT).toFixed(1)}`} unit="kg" color="#f5c542" />
            </div>

            {/* Chart */}
            <div className="bg-card rounded-2xl p-4 mb-4">
              <p className="text-xs text-muted uppercase tracking-wider mb-3">Weight Trend</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={merged} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => formatDate(v)}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[82, 90]}
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: '#6b7280' }}
                    formatter={(v: number, name: string) => [`${v} kg`, name === 'weight' ? 'Actual' : 'Goal']}
                    labelFormatter={(l) => formatDate(l)}
                  />
                  <ReferenceLine y={GOAL_WEIGHT} stroke="#3ecf8e" strokeDasharray="6 3" strokeWidth={1.5} />
                  <Line
                    type="monotone"
                    dataKey="goal"
                    stroke="#3ecf8e"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#e85d3a"
                    strokeWidth={2.5}
                    dot={{ fill: '#e85d3a', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#e85d3a' }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-end">
                <LegendDot color="#e85d3a" label="Actual" />
                <LegendDot color="#3ecf8e" label="Goal" dashed />
              </div>
            </div>

            {/* Log history */}
            <div className="space-y-2 mb-4">
              {[...logs].reverse().map((l) => (
                <div key={l.id} className="bg-card rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{formatDate(l.date)}</p>
                    <p className="text-xs text-muted mt-0.5">{l.source ?? 'scale'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-num text-lg font-bold text-white">{l.weight_kg} kg</p>
                    {l.body_fat_pct && <p className="text-xs text-muted font-num">{l.body_fat_pct}% BF</p>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAddWeight(true)}
              className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Log Weight
            </button>
          </>
        )}

        {tab === 'composition' && (
          <>
            {/* Latest InBody */}
            <div className="bg-card rounded-2xl p-5 mb-4">
              <p className="text-xs text-muted uppercase tracking-wider mb-3">Latest Scan · Apr 6, 2026</p>
              <div className="grid grid-cols-2 gap-3">
                <CompCard label="Body Fat" value={`${latest?.body_fat_pct ?? 20}%`} sub="Target: 15-17%" color="#e85d3a" />
                <CompCard label="Muscle Mass" value={`${latest?.smm_kg ?? 42.3} kg`} sub="SMM" color="#3ecf8e" />
                <CompCard label="Fat Mass" value={`${latest?.fat_mass_kg ?? 11.6} kg`} sub="Visceral" color="#f5c542" />
                <CompCard label="WHR" value={`${latest?.whr ?? 0.83}`} sub="Waist-to-hip" color="#60a5fa" />
                <CompCard label="BMI" value={`${latest?.bmi ?? 24.5}`} sub="Healthy: 18.5-25" color="#a78bfa" />
                <CompCard label="Height" value="188 cm" sub="InBody reference" color="#6b7280" />
              </div>
            </div>

            {/* BF% Chart */}
            {merged.some((d) => d.bf !== null) && (
              <div className="bg-card rounded-2xl p-4 mb-4">
                <p className="text-xs text-muted uppercase tracking-wider mb-3">Body Fat % Trend</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={merged.filter((d) => d.bf !== null)} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[14, 22]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1d23', border: '1px solid #2a2d35', borderRadius: 12, fontSize: 12 }} labelFormatter={formatDate} formatter={(v: number) => [`${v}%`, 'Body Fat']} />
                    <ReferenceLine y={17} stroke="#3ecf8e" strokeDasharray="6 3" />
                    <ReferenceLine y={15} stroke="#3ecf8e" strokeDasharray="6 3" />
                    <Line type="monotone" dataKey="bf" stroke="#e85d3a" strokeWidth={2.5} dot={{ fill: '#e85d3a', r: 4 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <button
              onClick={() => setShowAddWeight(true)}
              className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-sm"
            >
              Log InBody Scan
            </button>
          </>
        )}

        {tab === 'photos' && (
          <>
            {photos.length === 0 && (
              <div className="text-center py-12 text-muted">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-sm">No progress photos yet.</p>
                <p className="text-xs mt-1">Document your transformation every 2 weeks.</p>
              </div>
            )}

            {/* Group by date */}
            {Object.entries(
              photos.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
                ;(acc[p.date] = acc[p.date] || []).push(p)
                return acc
              }, {})
            ).map(([date, ps]) => (
              <div key={date} className="mb-4">
                <p className="text-xs text-muted px-1 mb-2">{formatDate(date)}</p>
                <div className="grid grid-cols-3 gap-2">
                  {ps.map((p) => (
                    <div key={p.id} className="aspect-square rounded-xl overflow-hidden relative bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.photo_url} alt={p.view_type} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] text-white text-center py-1 capitalize">
                        {p.view_type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowAddPhoto(true)}
              className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-sm flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Add Progress Photo
            </button>
          </>
        )}
      </div>

      {/* Log Weight Sheet */}
      <Sheet open={showAddWeight} onClose={() => setShowAddWeight(false)} title="Log Weight">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-1.5 block">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full bg-bg border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-1.5 block">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as 'scale' | 'inbody' }))}
                className="w-full bg-bg border border-border rounded-xl px-3 py-3 text-sm outline-none focus:border-accent"
              >
                <option value="scale">Scale</option>
                <option value="inbody">InBody Scan</option>
              </select>
            </div>
          </div>

          <FormField label="Weight (kg) *" value={form.weight_kg} onChange={(v) => setForm((f) => ({ ...f, weight_kg: v }))} placeholder="86.5" />

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Waist · navel (cm)" value={form.waist_navel_cm} onChange={(v) => setForm((f) => ({ ...f, waist_navel_cm: v }))} placeholder="86.0" />
            <FormField label="Waist · narrowest (cm)" value={form.waist_narrowest_cm} onChange={(v) => setForm((f) => ({ ...f, waist_narrowest_cm: v }))} placeholder="83.5" />
          </div>

          {form.source === 'inbody' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Body Fat %" value={form.body_fat_pct} onChange={(v) => setForm((f) => ({ ...f, body_fat_pct: v }))} placeholder="20" />
                <FormField label="SMM (kg)" value={form.smm_kg} onChange={(v) => setForm((f) => ({ ...f, smm_kg: v }))} placeholder="42.3" />
                <FormField label="Fat Mass (kg)" value={form.fat_mass_kg} onChange={(v) => setForm((f) => ({ ...f, fat_mass_kg: v }))} placeholder="11.6" />
                <FormField label="WHR" value={form.whr} onChange={(v) => setForm((f) => ({ ...f, whr: v }))} placeholder="0.83" />
                <FormField label="BMI" value={form.bmi} onChange={(v) => setForm((f) => ({ ...f, bmi: v }))} placeholder="24.5" />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-muted mb-1.5 block">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Morning, fasted"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>

          <button
            onClick={saveWeight}
            disabled={!form.weight_kg}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </Sheet>

      {/* Add Photo Sheet */}
      <Sheet open={showAddPhoto} onClose={() => setShowAddPhoto(false)} title="Progress Photo">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted mb-2 block">View</label>
            <div className="flex gap-2">
              {(['front', 'side', 'back'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setPhotoForm((f) => ({ ...f, view_type: v }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize ${
                    photoForm.view_type === v ? 'bg-accent text-white' : 'bg-border text-muted'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div
            className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            {photoForm.file ? (
              <p className="text-sm text-green">{photoForm.file.name}</p>
            ) : (
              <>
                <p className="text-3xl mb-2">📷</p>
                <p className="text-sm text-muted">Tap to select photo</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => setPhotoForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
          />
          <button
            onClick={uploadPhoto}
            disabled={!photoForm.file || uploadingPhoto}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold disabled:opacity-40"
          >
            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
          </button>
        </div>
      </Sheet>

      <BottomNav />
    </div>
  )
}

function StatMini({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="bg-card rounded-2xl p-3 text-center">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-num text-xl font-bold mt-0.5" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted">{unit}</p>
    </div>
  )
}

function CompCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-bg rounded-xl p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="font-num text-lg font-bold mt-0.5" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted/70 mt-0.5">{sub}</p>
    </div>
  )
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-0.5 rounded" style={{ backgroundColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <span className="text-[10px] text-muted">{label}</span>
    </div>
  )
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-xs text-muted mb-1.5 block">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
      />
    </div>
  )
}
