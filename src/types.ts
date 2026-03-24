export type DayType = 'push' | 'pull' | 'legs' | 'upper' | 'lower';

export interface User {
  id: string;
  username: string;
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
}

export interface TrainingDay {
  type: DayType;
  label: string;
  color: string;
  exerciseIds: string[];
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
}
