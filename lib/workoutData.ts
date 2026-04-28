import type { WorkoutProgram, MealTemplate } from '@/types'

// Two gym sessions/week, both 5-exercise rotations matching the protocol:
//   A (Mon) — Lower + Pull. RDL primary + Row primary, then accessories.
//   B (Fri) — Upper + Push. DB Bench primary + OHP primary, then accessories.
//   No Workout C — protocol caps at 2 gym sessions/wk to preserve recovery
//   under deficit alongside 2× intense badminton (Tue/Thu).
//
// Primaries run 4×5 RPE 7 in P1, 4×4 RPE 8 in P2, deload in P3.
// Accessories stay 3×10–12 throughout.
export const WORKOUTS: WorkoutProgram[] = [
  {
    id: 'A',
    name: 'Workout A',
    subtitle: 'Lower + Pull',
    rest: '90–120 sec on primaries, 60 sec on accessories',
    color: '#e85d3a',
    exercises: [
      {
        name: 'Romanian Deadlift',
        sets: 4,
        reps: '5',
        cue: 'Hinge at hips, feel hamstrings load. P1: RPE 7. Add +2.5kg if last set ≥ 6 reps.',
        is_primary: true,
        youtube: 'https://www.youtube.com/results?search_query=romanian+deadlift+dumbbell+form+tutorial',
        musclewiki: 'https://musclewiki.com/exercise/dumbbell-romanian-deadlift',
      },
      {
        name: 'Bent-Over Row',
        sets: 4,
        reps: '5',
        cue: 'Squeeze shoulder blades. P1: RPE 7. Heavy enough that set 4 feels tough.',
        is_primary: true,
        youtube: 'https://www.youtube.com/results?search_query=bent+over+dumbbell+row+proper+form',
        musclewiki: 'https://musclewiki.com/exercise/dumbbell-row-bilateral',
      },
      {
        name: 'Lat Pulldown',
        sets: 3,
        reps: '10',
        cue: 'Wide grip, pull to upper chest. Drive elbows down, not back.',
        youtube: 'https://www.youtube.com/results?search_query=lat+pulldown+proper+form+technique',
        musclewiki: 'https://musclewiki.com/exercise/cable-lat-pulldown',
      },
      {
        name: 'Pallof Press',
        sets: 3,
        reps: '10 each side',
        cue: 'Cable or band, resist rotation. Slow controlled press.',
        youtube: 'https://www.youtube.com/results?search_query=pallof+press+cable+form+tutorial',
        musclewiki: 'https://musclewiki.com/exercise/cable-pallof-press',
      },
      {
        name: 'Hanging Knee Raise',
        sets: 3,
        reps: '12',
        cue: 'Curl pelvis up, control descent. Alt: lying leg raises.',
        youtube: 'https://www.youtube.com/results?search_query=hanging+knee+raise+proper+form',
      },
    ],
  },
  {
    id: 'B',
    name: 'Workout B',
    subtitle: 'Upper + Push',
    rest: '90–120 sec on primaries, 60 sec on accessories',
    color: '#3ecf8e',
    exercises: [
      {
        name: 'Dumbbell Bench Press',
        sets: 4,
        reps: '5',
        cue: '3 sec negative on every rep. P1: RPE 7. Bump weight when set 4 hits ≥ 6 reps.',
        is_primary: true,
        youtube: 'https://www.youtube.com/results?search_query=dumbbell+bench+press+proper+form',
        musclewiki: 'https://musclewiki.com/exercise/dumbbell-bench-press',
      },
      {
        name: 'Standing Overhead Press',
        sets: 4,
        reps: '5',
        cue: 'Brace core, no lumbar arching. Glutes tight. P1: RPE 7.',
        is_primary: true,
        youtube: 'https://www.youtube.com/results?search_query=standing+dumbbell+overhead+press+form',
        musclewiki: 'https://musclewiki.com/exercise/dumbbell-standing-overhead-press',
      },
      {
        name: 'Lateral Raise',
        sets: 3,
        reps: '12',
        cue: 'Light dumbbells. Lead with elbows, no swinging.',
        youtube: 'https://www.youtube.com/results?search_query=dumbbell+lateral+raise+proper+form',
        musclewiki: 'https://musclewiki.com/exercise/dumbbell-lateral-raise',
      },
      {
        name: 'Plank',
        sets: 3,
        reps: '45 sec',
        cue: 'Squeeze glutes, ribs down to hips. Stop when hips drop.',
        youtube: 'https://www.youtube.com/results?search_query=plank+proper+form+common+mistakes',
      },
      {
        name: 'Dead Bug',
        sets: 3,
        reps: '10 each side',
        cue: 'Anti-extension core — protects lower back. Diet removes belly fat, not this.',
        youtube: 'https://www.youtube.com/results?search_query=dead+bug+exercise+proper+form+core',
      },
    ],
  },
]

export const MEAL_TEMPLATES: MealTemplate[] = [
  {
    label: 'Eggs + Avocado Toast + Coffee',
    meal_type: 'breakfast',
    description: '3–4 eggs + avocado toast (1 slice) + coffee',
    calories: 450,
    protein_g: 30,
  },
  {
    label: 'Com Tam — Chicken/Fish',
    meal_type: 'lunch',
    description: 'Grilled chicken/fish + half rice + vegetables',
    calories: 550,
    protein_g: 40,
  },
  {
    label: 'Protein Shake + Banana',
    meal_type: 'snack',
    description: 'Protein shake + banana or nuts',
    calories: 300,
    protein_g: 30,
  },
  {
    label: 'Protein + Vegetables',
    meal_type: 'dinner',
    description: 'Protein + vegetables + optional small noodles',
    calories: 500,
    protein_g: 35,
  },
]

// Schedule per protocol: 2 gym sessions (Mon, Fri), 3 badminton (Tue, Thu, Sat),
// rest Wed + Sun. Sauna lives Tue PM (after badminton) and Sun PM —
// not on gym days (cortisol/recovery interference per protocol).
export const WEEKLY_SCHEDULE = [
  { day: 'Sun', label: 'Rest + Sauna PM', type: 'rest', color: '#6b7280' },
  { day: 'Mon', label: 'Workout A · Lower + Pull', type: 'A', color: '#e85d3a', duration: '~45 min' },
  { day: 'Tue', label: 'Badminton + Sauna PM', type: 'badminton', color: '#3ecf8e', duration: '~60 min' },
  { day: 'Wed', label: 'Rest / Walk', type: 'rest', color: '#6b7280' },
  { day: 'Thu', label: 'Badminton', type: 'badminton', color: '#3ecf8e', duration: '~60 min' },
  { day: 'Fri', label: 'Workout B · Upper + Push', type: 'B', color: '#3ecf8e', duration: '~45 min' },
  { day: 'Sat', label: 'Badminton (light/conditional)', type: 'badminton', color: '#f5c542', duration: 'Skip if Readiness < 50' },
]
