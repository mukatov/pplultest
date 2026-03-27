export type DayType = string;
export type Equipment = 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';

// User type is defined in authStore.ts (Supabase-backed)
// Re-exported here for convenience
export type { User } from './store/authStore';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  suggestedDays: DayType[];
  equipment?: Equipment;
  notes?: string;
}

/** Weight increment step in kg based on equipment type */
export function weightStep(equipment?: Equipment): number {
  switch (equipment) {
    case 'dumbbell':   return 2;
    case 'machine':    return 5;
    case 'cable':      return 2.5;
    case 'bodyweight': return 1;
    default:           return 2.5; // barbell
  }
}

export interface SetEntry {
  weight: number;
  reps: number;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  sets: SetEntry[];
  date: string;
  dayType: DayType;
  supersetId?: string;
}

export interface Superset {
  id: string;
  exerciseIds: string[];
}

export interface Day {
  type: string;
  label: string;
  color: string;
  exerciseIds: string[];
  supersets?: Superset[];
}

export type TrainingDay = Day;

export interface Split {
  id: string;
  name: string;
  days: Day[];
  isBuiltIn: boolean;
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
}
