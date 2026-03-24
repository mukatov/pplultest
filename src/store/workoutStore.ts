import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, WorkoutSet, TrainingDay, PersonalRecord, DayType, SetEntry } from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';

const DEFAULT_DAYS: TrainingDay[] = [
  { type: 'push', label: 'Push', color: '#e5e5e5', description: 'Chest · Shoulders · Triceps', exerciseIds: ['bench-press', 'overhead-press', 'incline-bench', 'lateral-raise', 'tricep-pushdown'] },
  { type: 'pull', label: 'Pull', color: '#a3a3a3', description: 'Back · Biceps · Rear Delts', exerciseIds: ['barbell-row', 'pull-up', 'lat-pulldown', 'face-pull', 'barbell-curl'] },
  { type: 'legs', label: 'Legs', color: '#737373', description: 'Quads · Hamstrings · Glutes · Calves', exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] },
  { type: 'upper', label: 'Upper', color: '#d4d4d4', description: 'Full Upper Body', exerciseIds: ['bench-press', 'barbell-row', 'overhead-press', 'lat-pulldown', 'lateral-raise', 'hammer-curl', 'tricep-pushdown'] },
  { type: 'lower', label: 'Lower', color: '#525252', description: 'Full Lower Body', exerciseIds: ['squat', 'deadlift', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] },
];

interface WorkoutState {
  exercises: Exercise[];
  workoutSets: WorkoutSet[];
  trainingDays: TrainingDay[];
  personalRecords: PersonalRecord[];

  addExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;

  logWorkout: (exerciseId: string, sets: SetEntry[], dayType: DayType, userId: string) => void;
  getLastWorkout: (exerciseId: string, userId: string) => WorkoutSet | undefined;
  getWorkoutHistory: (exerciseId: string, userId: string) => WorkoutSet[];

  updateDayExercises: (dayType: DayType, exerciseIds: string[]) => void;
  addTrainingDay: (day: TrainingDay) => void;
  removeTrainingDay: (type: string) => void;

  getPersonalRecord: (exerciseId: string, userId: string) => PersonalRecord | undefined;
}

// Key for user-scoped data
function scopedKey(key: string, userId: string) {
  return `${userId}:${key}`;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      exercises: DEFAULT_EXERCISES,
      workoutSets: [],
      trainingDays: DEFAULT_DAYS,
      personalRecords: [],

      addExercise: (exercise) =>
        set(state => ({ exercises: [...state.exercises, exercise] })),

      updateExercise: (exercise) =>
        set(state => ({
          exercises: state.exercises.map(e => e.id === exercise.id ? exercise : e),
        })),

      deleteExercise: (id) =>
        set(state => ({
          exercises: state.exercises.filter(e => e.id !== id),
          trainingDays: state.trainingDays.map(d => ({
            ...d,
            exerciseIds: d.exerciseIds.filter(eid => eid !== id),
          })),
        })),

      logWorkout: (exerciseId, sets, dayType, userId) => {
        const entry: WorkoutSet = {
          id: crypto.randomUUID(),
          exerciseId: `${userId}:${exerciseId}`,
          sets,
          date: new Date().toISOString(),
          dayType,
        };
        set(state => {
          const updated = [...state.workoutSets, entry];
          // Update PR
          const maxWeight = Math.max(...sets.map(s => s.weight));
          const maxRepsAtMax = Math.max(...sets.filter(s => s.weight === maxWeight).map(s => s.reps));
          const prKey = scopedKey(exerciseId, userId);
          const existingPR = state.personalRecords.find(pr => pr.exerciseId === prKey);
          let newPRs = state.personalRecords;
          if (!existingPR || maxWeight > existingPR.weight || (maxWeight === existingPR.weight && maxRepsAtMax > existingPR.reps)) {
            newPRs = [
              ...state.personalRecords.filter(pr => pr.exerciseId !== prKey),
              { exerciseId: prKey, weight: maxWeight, reps: maxRepsAtMax, date: new Date().toISOString() },
            ];
          }
          return { workoutSets: updated, personalRecords: newPRs };
        });
      },

      getLastWorkout: (exerciseId, userId) => {
        const { workoutSets } = get();
        const key = `${userId}:${exerciseId}`;
        const history = workoutSets.filter(ws => ws.exerciseId === key);
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      },

      getWorkoutHistory: (exerciseId, userId) => {
        const { workoutSets } = get();
        const key = `${userId}:${exerciseId}`;
        return workoutSets
          .filter(ws => ws.exerciseId === key)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      },

      updateDayExercises: (dayType, exerciseIds) =>
        set(state => ({
          trainingDays: state.trainingDays.map(d =>
            d.type === dayType ? { ...d, exerciseIds } : d
          ),
        })),

      addTrainingDay: (day) =>
        set(state => ({ trainingDays: [...state.trainingDays, day] })),

      removeTrainingDay: (type) =>
        set(state => ({ trainingDays: state.trainingDays.filter(d => d.type !== type) })),

      getPersonalRecord: (exerciseId, userId) => {
        const { personalRecords } = get();
        const key = scopedKey(exerciseId, userId);
        return personalRecords.find(pr => pr.exerciseId === key);
      },
    }),
    { name: 'ppl-workouts' }
  )
);
