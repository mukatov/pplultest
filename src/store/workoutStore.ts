import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, WorkoutSet, Session, Split, PersonalRecord, DayType, SetEntry } from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';

const PUSH_SESSIONS: Session = { type: 'push', label: 'Push', color: 'indigo', exerciseIds: ['bench-press', 'overhead-press', 'incline-bench', 'lateral-raise', 'tricep-pushdown'] };
const PULL_SESSION: Session = { type: 'pull', label: 'Pull', color: 'violet', exerciseIds: ['barbell-row', 'pull-up', 'lat-pulldown', 'face-pull', 'barbell-curl'] };
const LEGS_SESSION: Session = { type: 'legs', label: 'Legs', color: 'purple', exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] };
const UPPER_SESSION: Session = { type: 'upper', label: 'Upper', color: 'blue', exerciseIds: ['bench-press', 'barbell-row', 'overhead-press', 'lat-pulldown', 'lateral-raise', 'hammer-curl', 'tricep-pushdown'] };
const LOWER_SESSION: Session = { type: 'lower', label: 'Lower', color: 'cyan', exerciseIds: ['squat', 'deadlift', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] };

export const BUILT_IN_SPLITS: Split[] = [
  {
    id: 'pplul',
    name: 'PPL/UL',
    isBuiltIn: true,
    sessions: [PUSH_SESSIONS, PULL_SESSION, LEGS_SESSION, UPPER_SESSION, LOWER_SESSION],
  },
  {
    id: 'ppl',
    name: 'PPL',
    isBuiltIn: true,
    sessions: [
      { ...PUSH_SESSIONS },
      { ...PULL_SESSION },
      { ...LEGS_SESSION },
    ],
  },
  {
    id: 'ul',
    name: 'UL',
    isBuiltIn: true,
    sessions: [
      { ...UPPER_SESSION },
      { ...LOWER_SESSION },
    ],
  },
  {
    id: 'bro',
    name: 'Bro Split',
    isBuiltIn: true,
    sessions: [
      { type: 'chest', label: 'Chest', color: 'rose', exerciseIds: ['bench-press', 'incline-bench', 'cable-fly', 'dips', 'front-raise'] },
      { type: 'back', label: 'Back', color: 'emerald', exerciseIds: ['barbell-row', 'pull-up', 'lat-pulldown', 'seated-row', 'face-pull'] },
      { type: 'legs-bro', label: 'Legs', color: 'purple', exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] },
      { type: 'shoulders', label: 'Shoulders', color: 'amber', exerciseIds: ['overhead-press', 'lateral-raise', 'face-pull'] },
      { type: 'arms', label: 'Arms', color: 'yellow', exerciseIds: ['barbell-curl', 'hammer-curl', 'tricep-pushdown', 'skull-crusher'] },
    ],
  },
];

interface WorkoutState {
  exercises: Exercise[];
  workoutSets: WorkoutSet[];
  splits: Split[];
  activeSplitId: string;
  personalRecords: PersonalRecord[];

  addExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;

  logWorkout: (exerciseId: string, sets: SetEntry[], dayType: DayType, userId: string) => void;
  getLastWorkout: (exerciseId: string, userId: string) => WorkoutSet | undefined;
  getWorkoutHistory: (exerciseId: string, userId: string) => WorkoutSet[];

  updateDayExercises: (dayType: string, exerciseIds: string[]) => void;

  getPersonalRecord: (exerciseId: string, userId: string) => PersonalRecord | undefined;

  addSplit: (split: Split) => void;
  deleteSplit: (id: string) => void;
  setActiveSplit: (id: string) => void;
}

function scopedKey(key: string, userId: string) {
  return `${userId}:${key}`;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      exercises: DEFAULT_EXERCISES,
      workoutSets: [],
      splits: BUILT_IN_SPLITS,
      activeSplitId: 'pplul',
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
          splits: state.splits.map(split => ({
            ...split,
            sessions: split.sessions.map(s => ({
              ...s,
              exerciseIds: s.exerciseIds.filter(eid => eid !== id),
            })),
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
          splits: state.splits.map(split =>
            split.id === state.activeSplitId
              ? {
                  ...split,
                  sessions: split.sessions.map(s =>
                    s.type === dayType ? { ...s, exerciseIds } : s
                  ),
                }
              : split
          ),
        })),

      getPersonalRecord: (exerciseId, userId) => {
        const { personalRecords } = get();
        const key = scopedKey(exerciseId, userId);
        return personalRecords.find(pr => pr.exerciseId === key);
      },

      addSplit: (split) =>
        set(state => ({ splits: [...state.splits, split] })),

      deleteSplit: (id) =>
        set(state => {
          const target = state.splits.find(s => s.id === id);
          if (!target || target.isBuiltIn) return state;
          const newSplits = state.splits.filter(s => s.id !== id);
          const newActiveId = state.activeSplitId === id
            ? (newSplits[0]?.id ?? 'pplul')
            : state.activeSplitId;
          return { splits: newSplits, activeSplitId: newActiveId };
        }),

      setActiveSplit: (id) =>
        set({ activeSplitId: id }),
    }),
    { name: 'ppl-workouts' }
  )
);
