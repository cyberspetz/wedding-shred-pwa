'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  GOAL_WEIGHT,
  START_WEIGHT,
  PROTEIN_TARGET,
  PROTOCOL_START,
  WEDDING_DATE,
} from '@/lib/utils'
import type { UserSettings } from '@/types'

export interface ResolvedSettings {
  goal_weight_kg: number
  start_weight_kg: number
  wedding_date: string  // yyyy-mm-dd
  protocol_start: string // yyyy-mm-dd
  protein_target_g: number
}

const DEFAULTS: ResolvedSettings = {
  goal_weight_kg: GOAL_WEIGHT,
  start_weight_kg: START_WEIGHT,
  wedding_date: WEDDING_DATE.toISOString().slice(0, 10),
  protocol_start: PROTOCOL_START.toISOString().slice(0, 10),
  protein_target_g: PROTEIN_TARGET,
}

export function resolveSettings(row: UserSettings | null): ResolvedSettings {
  if (!row) return DEFAULTS
  return {
    goal_weight_kg: row.goal_weight_kg ?? DEFAULTS.goal_weight_kg,
    start_weight_kg: row.start_weight_kg ?? DEFAULTS.start_weight_kg,
    wedding_date: row.wedding_date ?? DEFAULTS.wedding_date,
    protocol_start: row.protocol_start ?? DEFAULTS.protocol_start,
    protein_target_g: row.protein_target_g ?? DEFAULTS.protein_target_g,
  }
}

export function useUserSettings() {
  const [row, setRow] = useState<UserSettings | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (data) setRow(data as UserSettings)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const save = useCallback(async (updates: Partial<ResolvedSettings>) => {
    if (!userId) return
    const payload = {
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle()
    if (data) setRow(data as UserSettings)
  }, [userId])

  return {
    settings: resolveSettings(row),
    raw: row,
    loading,
    save,
  }
}
