export type DayType = string;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

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
