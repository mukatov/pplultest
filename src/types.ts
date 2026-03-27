export type DayType = string;

// User type is defined in authStore.ts (Supabase-backed)
// Re-exported here for convenience
export type { User } from './store/authStore';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  suggestedDays: DayType[];
  notes?: string;
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
