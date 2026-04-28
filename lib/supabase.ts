import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // Return a no-op client during build / when env vars are missing
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }
  _client = createClient(url, key)
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type Database = {
  public: {
    Tables: {
      weight_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          weight_kg: number
          body_fat_pct: number | null
          smm_kg: number | null
          fat_mass_kg: number | null
          whr: number | null
          bmi: number | null
          source: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['weight_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['weight_logs']['Insert']>
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          workout_type: string
          started_at: string
          completed_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>
      }
      exercise_logs: {
        Row: {
          id: string
          session_id: string
          exercise_name: string
          set_number: number
          reps: number | null
          weight_kg: number | null
          duration_sec: number | null
          completed: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exercise_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exercise_logs']['Insert']>
      }
      nutrition_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          meal_type: string
          description: string
          calories: number
          protein_g: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['nutrition_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['nutrition_logs']['Insert']>
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          date: string
          amount_ml: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['water_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['water_logs']['Insert']>
      }
      progress_photos: {
        Row: {
          id: string
          user_id: string
          date: string
          photo_url: string
          view_type: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['progress_photos']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['progress_photos']['Insert']>
      }
    }
  }
}
