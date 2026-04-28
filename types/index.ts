export interface WeightLog {
  id: string
  user_id: string
  date: string
  weight_kg: number
  body_fat_pct: number | null
  smm_kg: number | null
  fat_mass_kg: number | null
  whr: number | null
  bmi: number | null
  source: 'scale' | 'inbody' | null
  notes: string | null
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  date: string
  workout_type: 'A' | 'B' | 'C' | 'badminton' | 'rest'
  started_at: string
  completed_at: string | null
  notes: string | null
  created_at: string
}

export interface ExerciseLog {
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

export interface NutritionLog {
  id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  description: string
  calories: number
  protein_g: number
  created_at: string
}

export interface WaterLog {
  id: string
  user_id: string
  date: string
  amount_ml: number
  created_at: string
}

export interface ProgressPhoto {
  id: string
  user_id: string
  date: string
  photo_url: string
  view_type: 'front' | 'side' | 'back'
  created_at: string
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  cue: string
  youtube?: string
  musclewiki?: string
}

export interface WorkoutProgram {
  id: 'A' | 'B' | 'C'
  name: string
  subtitle: string
  rest: string
  color: string
  exercises: Exercise[]
}

export interface MealTemplate {
  label: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  description: string
  calories: number
  protein_g: number
}

export interface DailyNutrition {
  calories: number
  protein_g: number
  water_ml: number
}
