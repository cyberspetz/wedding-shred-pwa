'use client'

import { useState, useEffect, useCallback } from 'react'
import BottomNav from '@/components/navigation/BottomNav'
import ProgressBar from '@/components/ui/ProgressBar'
import Sheet from '@/components/ui/Sheet'
import { supabase } from '@/lib/supabase'
import { getTodayString, CALORIE_TARGET, PROTEIN_TARGET, WATER_TARGET_ML } from '@/lib/utils'
import { MEAL_TEMPLATES } from '@/lib/workoutData'
import type { NutritionLog } from '@/types'

const WATER_OPTIONS = [250, 330, 500, 750]
const MEAL_COLORS: Record<string, string> = {
  breakfast: '#f5c542',
  lunch: '#e85d3a',
  dinner: '#3ecf8e',
  snack: '#60a5fa',
}

export default function LogPage() {
  const [meals, setMeals] = useState<NutritionLog[]>([])
  const [waterTotal, setWaterTotal] = useState(0)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [activeTab, setActiveTab] = useState<'food' | 'water'>('food')
  const [userId, setUserId] = useState<string | null>(null)
  const today = getTodayString()

  // Form state
  const [form, setForm] = useState({
    meal_type: 'breakfast' as NutritionLog['meal_type'],
    description: '',
    calories: '',
    protein_g: '',
  })

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: mealData } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true })

    const { data: waterData } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('date', today)

    if (mealData) setMeals(mealData as NutritionLog[])
    if (waterData) setWaterTotal(waterData.reduce((sum, r) => sum + r.amount_ml, 0))
  }, [today])

  useEffect(() => { load() }, [load])

  const totalCals = meals.reduce((s, m) => s + m.calories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0)

  async function addMeal() {
    if (!userId || !form.calories) return
    await supabase.from('nutrition_logs').insert({
      user_id: userId,
      date: today,
      meal_type: form.meal_type,
      description: form.description,
      calories: parseInt(form.calories) || 0,
      protein_g: parseFloat(form.protein_g) || 0,
    })
    setForm({ meal_type: 'breakfast', description: '', calories: '', protein_g: '' })
    setShowAddMeal(false)
    load()
  }

  async function addWater(ml: number) {
    if (!userId) return
    await supabase.from('water_logs').insert({
      user_id: userId,
      date: today,
      amount_ml: ml,
    })
    setWaterTotal((w) => w + ml)
  }

  async function deleteMeal(id: string) {
    await supabase.from('nutrition_logs').delete().eq('id', id)
    setMeals((m) => m.filter((x) => x.id !== id))
  }

  function applyTemplate(t: typeof MEAL_TEMPLATES[0]) {
    setForm({
      meal_type: t.meal_type,
      description: t.description,
      calories: String(t.calories),
      protein_g: String(t.protein_g),
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold">Nutrition Log</h1>
        <p className="text-muted text-sm mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex bg-card rounded-xl p-1 gap-1">
          {(['food', 'water'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                activeTab === t ? 'bg-accent text-white' : 'text-muted'
              }`}
            >
              {t === 'food' ? '🍱 Food' : '💧 Water'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-5 pb-nav overflow-y-auto">
        {activeTab === 'food' && (
          <>
            {/* Daily totals */}
            <div className="bg-card rounded-2xl p-5 mb-4 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">Today's Totals</p>
                <p className="text-xs text-muted font-num">{totalCals} / {CALORIE_TARGET} kcal</p>
              </div>
              <ProgressBar
                value={totalCals}
                max={CALORIE_TARGET}
                color="#e85d3a"
                label="Calories"
                unit=" kcal"
                height="h-3"
              />
              <ProgressBar
                value={Math.round(totalProtein)}
                max={PROTEIN_TARGET}
                color="#3ecf8e"
                label="Protein"
                unit="g"
                height="h-3"
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <MacroChip label="Remaining" value={`${Math.max(0, CALORIE_TARGET - totalCals)} kcal`} color="#e85d3a" />
                <MacroChip label="Protein left" value={`${Math.max(0, PROTEIN_TARGET - totalProtein)}g`} color="#3ecf8e" />
              </div>
            </div>

            {/* Meal list grouped by type */}
            {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((type) => {
              const typeMeals = meals.filter((m) => m.meal_type === type)
              if (typeMeals.length === 0) return null
              const typeCals = typeMeals.reduce((s, m) => s + m.calories, 0)
              const typeProtein = typeMeals.reduce((s, m) => s + m.protein_g, 0)
              return (
                <div key={type} className="mb-3">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: MEAL_COLORS[type] }}>
                      {type}
                    </p>
                    <p className="text-xs text-muted font-num">{typeCals} kcal · {typeProtein}g</p>
                  </div>
                  <div className="space-y-2">
                    {typeMeals.map((m) => (
                      <div key={m.id} className="bg-card rounded-xl px-4 py-3 flex items-center gap-3">
                        <div
                          className="w-2 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: MEAL_COLORS[m.meal_type] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{m.description || type}</p>
                          <p className="text-xs text-muted font-num mt-0.5">{m.calories} kcal · {m.protein_g}g protein</p>
                        </div>
                        <button
                          onClick={() => deleteMeal(m.id)}
                          className="w-7 h-7 rounded-lg bg-bg flex items-center justify-center shrink-0"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => setShowAddMeal(true)}
              className="w-full py-4 rounded-2xl bg-accent text-white font-semibold text-sm mt-2 flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Log Meal
            </button>
          </>
        )}

        {activeTab === 'water' && (
          <>
            {/* Water visual */}
            <div className="bg-card rounded-2xl p-6 mb-4 text-center">
              <div className="text-5xl mb-3">💧</div>
              <p className="font-num text-4xl font-bold text-blue-400">
                {(waterTotal / 1000).toFixed(2)}
                <span className="text-xl text-muted ml-1">L</span>
              </p>
              <p className="text-muted text-sm mt-1">Target: 3.0 L</p>
              <div className="mt-4">
                <ProgressBar
                  value={waterTotal}
                  max={WATER_TARGET_ML}
                  color="#60a5fa"
                  showValue={false}
                  height="h-3"
                />
              </div>
              <p className="text-xs text-muted mt-2 font-num">
                {Math.max(0, WATER_TARGET_ML - waterTotal)} mL remaining
              </p>
            </div>

            {/* Quick add buttons */}
            <p className="text-xs text-muted uppercase tracking-wider mb-3 px-1">Quick Add</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {WATER_OPTIONS.map((ml) => (
                <button
                  key={ml}
                  onClick={() => addWater(ml)}
                  className="bg-card rounded-2xl py-5 flex flex-col items-center gap-1 active:bg-card-hover transition-colors"
                >
                  <span className="text-2xl">
                    {ml <= 250 ? '🥃' : ml <= 350 ? '🧃' : ml <= 500 ? '🥤' : '🍶'}
                  </span>
                  <span className="font-num text-lg font-bold text-blue-400">{ml}</span>
                  <span className="text-xs text-muted">mL</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Meal Sheet */}
      <Sheet open={showAddMeal} onClose={() => setShowAddMeal(false)} title="Log Meal">
        <div className="space-y-4">
          {/* Meal type */}
          <div>
            <label className="text-xs text-muted mb-2 block">Meal Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, meal_type: t }))}
                  className={`py-2.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                    form.meal_type === t ? 'text-white' : 'bg-border text-muted'
                  }`}
                  style={form.meal_type === t ? { backgroundColor: MEAL_COLORS[t] } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div>
            <label className="text-xs text-muted mb-2 block">Quick Templates</label>
            <div className="space-y-2">
              {MEAL_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(t)}
                  className="w-full bg-bg rounded-xl p-3 text-left hover:bg-border transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted font-num">{t.calories} kcal</p>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{t.protein_g}g protein</p>
                </button>
              ))}
            </div>
          </div>

          {/* Manual entry */}
          <div>
            <label className="text-xs text-muted mb-2 block">Description (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Grilled chicken + rice"
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted mb-2 block">Calories (kcal)</label>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                placeholder="450"
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs text-muted mb-2 block">Protein (g)</label>
              <input
                type="number"
                value={form.protein_g}
                onChange={(e) => setForm((f) => ({ ...f, protein_g: e.target.value }))}
                placeholder="30"
                className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm font-num outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            onClick={addMeal}
            disabled={!form.calories}
            className="w-full py-4 rounded-2xl bg-accent text-white font-semibold disabled:opacity-40"
          >
            Save Meal
          </button>
        </div>
      </Sheet>

      <BottomNav />
    </div>
  )
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg rounded-xl p-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-num text-base font-bold mt-0.5" style={{ color }}>{value}</p>
    </div>
  )
}
