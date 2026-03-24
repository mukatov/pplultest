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
}

export interface Session {
  type: string;
  label: string;
  color: string;
  exerciseIds: string[];
}

export type TrainingDay = Session;

export interface Split {
  id: string;
  name: string;
  sessions: Session[];
  isBuiltIn: boolean;
}

export interface PersonalRecord {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
}
