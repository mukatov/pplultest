import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, WorkoutSet, Day, Split, PersonalRecord, DayType, SetEntry } from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';

const DEMO_UID = 'demo-user-001';
function ds(eid: string) { return `${DEMO_UID}:${eid}`; }

const DEMO_WORKOUT_SETS: WorkoutSet[] = [
  // Bench Press
  { id: 'demo-bp-1', exerciseId: ds('bench-press'), sets: [{weight:70,reps:8},{weight:70,reps:8},{weight:70,reps:7}], date: '2026-02-09T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-bp-2', exerciseId: ds('bench-press'), sets: [{weight:72.5,reps:8},{weight:72.5,reps:8},{weight:72.5,reps:8}], date: '2026-02-16T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-bp-3', exerciseId: ds('bench-press'), sets: [{weight:75,reps:7},{weight:75,reps:7},{weight:75,reps:8},{weight:75,reps:6}], date: '2026-02-23T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-bp-4', exerciseId: ds('bench-press'), sets: [{weight:75,reps:8},{weight:75,reps:8},{weight:75,reps:8},{weight:75,reps:7}], date: '2026-03-02T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-bp-5', exerciseId: ds('bench-press'), sets: [{weight:77.5,reps:7},{weight:77.5,reps:7},{weight:77.5,reps:7},{weight:77.5,reps:6}], date: '2026-03-09T10:00:00.000Z', dayType: 'upper' },
  { id: 'demo-bp-6', exerciseId: ds('bench-press'), sets: [{weight:77.5,reps:8},{weight:77.5,reps:8},{weight:77.5,reps:7},{weight:77.5,reps:8}], date: '2026-03-16T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-bp-7', exerciseId: ds('bench-press'), sets: [{weight:80,reps:7},{weight:80,reps:7},{weight:80,reps:6},{weight:80,reps:7}], date: '2026-03-23T10:00:00.000Z', dayType: 'push' },
  // Squat
  { id: 'demo-sq-1', exerciseId: ds('squat'), sets: [{weight:90,reps:6},{weight:90,reps:6},{weight:90,reps:5}], date: '2026-02-10T10:00:00.000Z', dayType: 'legs' },
  { id: 'demo-sq-2', exerciseId: ds('squat'), sets: [{weight:92.5,reps:6},{weight:92.5,reps:6},{weight:92.5,reps:6}], date: '2026-02-17T10:00:00.000Z', dayType: 'legs' },
  { id: 'demo-sq-3', exerciseId: ds('squat'), sets: [{weight:95,reps:5},{weight:95,reps:5},{weight:95,reps:5},{weight:95,reps:5}], date: '2026-02-24T10:00:00.000Z', dayType: 'legs' },
  { id: 'demo-sq-4', exerciseId: ds('squat'), sets: [{weight:97.5,reps:5},{weight:97.5,reps:5},{weight:97.5,reps:5},{weight:97.5,reps:4}], date: '2026-03-03T10:00:00.000Z', dayType: 'lower' },
  { id: 'demo-sq-5', exerciseId: ds('squat'), sets: [{weight:100,reps:5},{weight:100,reps:5},{weight:100,reps:5},{weight:100,reps:5}], date: '2026-03-10T10:00:00.000Z', dayType: 'legs' },
  { id: 'demo-sq-6', exerciseId: ds('squat'), sets: [{weight:102.5,reps:5},{weight:102.5,reps:5},{weight:102.5,reps:4}], date: '2026-03-17T10:00:00.000Z', dayType: 'lower' },
  { id: 'demo-sq-7', exerciseId: ds('squat'), sets: [{weight:100,reps:6},{weight:100,reps:6},{weight:100,reps:6},{weight:100,reps:5}], date: '2026-03-24T10:00:00.000Z', dayType: 'legs' },
  // Overhead Press
  { id: 'demo-ohp-1', exerciseId: ds('overhead-press'), sets: [{weight:50,reps:8},{weight:50,reps:8},{weight:50,reps:7}], date: '2026-02-11T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-ohp-2', exerciseId: ds('overhead-press'), sets: [{weight:52.5,reps:7},{weight:52.5,reps:7},{weight:52.5,reps:6}], date: '2026-02-18T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-ohp-3', exerciseId: ds('overhead-press'), sets: [{weight:52.5,reps:8},{weight:52.5,reps:8},{weight:52.5,reps:7}], date: '2026-02-25T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-ohp-4', exerciseId: ds('overhead-press'), sets: [{weight:55,reps:7},{weight:55,reps:7},{weight:55,reps:6}], date: '2026-03-04T10:00:00.000Z', dayType: 'upper' },
  { id: 'demo-ohp-5', exerciseId: ds('overhead-press'), sets: [{weight:55,reps:8},{weight:55,reps:8},{weight:55,reps:7}], date: '2026-03-11T10:00:00.000Z', dayType: 'push' },
  { id: 'demo-ohp-6', exerciseId: ds('overhead-press'), sets: [{weight:57.5,reps:7},{weight:57.5,reps:6},{weight:57.5,reps:6}], date: '2026-03-18T10:00:00.000Z', dayType: 'push' },
  // Barbell Row
  { id: 'demo-row-1', exerciseId: ds('barbell-row'), sets: [{weight:65,reps:6},{weight:65,reps:6},{weight:65,reps:6},{weight:65,reps:5}], date: '2026-02-12T10:00:00.000Z', dayType: 'pull' },
  { id: 'demo-row-2', exerciseId: ds('barbell-row'), sets: [{weight:67.5,reps:6},{weight:67.5,reps:6},{weight:67.5,reps:6},{weight:67.5,reps:6}], date: '2026-02-19T10:00:00.000Z', dayType: 'pull' },
  { id: 'demo-row-3', exerciseId: ds('barbell-row'), sets: [{weight:70,reps:5},{weight:70,reps:5},{weight:70,reps:5},{weight:70,reps:5}], date: '2026-02-26T10:00:00.000Z', dayType: 'pull' },
  { id: 'demo-row-4', exerciseId: ds('barbell-row'), sets: [{weight:70,reps:6},{weight:70,reps:6},{weight:70,reps:6},{weight:70,reps:5}], date: '2026-03-05T10:00:00.000Z', dayType: 'upper' },
  { id: 'demo-row-5', exerciseId: ds('barbell-row'), sets: [{weight:72.5,reps:6},{weight:72.5,reps:6},{weight:72.5,reps:6},{weight:72.5,reps:5}], date: '2026-03-12T10:00:00.000Z', dayType: 'pull' },
  { id: 'demo-row-6', exerciseId: ds('barbell-row'), sets: [{weight:75,reps:6},{weight:75,reps:6},{weight:75,reps:5}], date: '2026-03-19T10:00:00.000Z', dayType: 'pull' },
];

const DEMO_PERSONAL_RECORDS: PersonalRecord[] = [
  { exerciseId: ds('bench-press'),    weight: 80,    reps: 7, date: '2026-03-23T10:00:00.000Z' },
  { exerciseId: ds('squat'),          weight: 102.5, reps: 5, date: '2026-03-17T10:00:00.000Z' },
  { exerciseId: ds('overhead-press'), weight: 57.5,  reps: 7, date: '2026-03-18T10:00:00.000Z' },
  { exerciseId: ds('barbell-row'),    weight: 75,    reps: 6, date: '2026-03-19T10:00:00.000Z' },
];

const PUSH_DAY: Day = { type: 'push', label: 'Push', color: 'indigo', exerciseIds: ['bench-press', 'overhead-press', 'incline-bench', 'lateral-raise', 'tricep-pushdown'] };
const PULL_DAY: Day = { type: 'pull', label: 'Pull', color: 'violet', exerciseIds: ['barbell-row', 'pull-up', 'lat-pulldown', 'face-pull', 'barbell-curl'] };
const LEGS_DAY: Day = { type: 'legs', label: 'Legs', color: 'purple', exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] };
const UPPER_DAY: Day = { type: 'upper', label: 'Upper', color: 'blue', exerciseIds: ['bench-press', 'barbell-row', 'overhead-press', 'lat-pulldown', 'lateral-raise', 'hammer-curl', 'tricep-pushdown'] };
const LOWER_DAY: Day = { type: 'lower', label: 'Lower', color: 'cyan', exerciseIds: ['squat', 'deadlift', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] };

export const BUILT_IN_SPLITS: Split[] = [
  {
    id: 'pplul',
    name: 'PPL/UL',
    isBuiltIn: true,
    days: [PUSH_DAY, PULL_DAY, LEGS_DAY, UPPER_DAY, LOWER_DAY],
  },
  {
    id: 'ppl',
    name: 'PPL',
    isBuiltIn: true,
    days: [{ ...PUSH_DAY }, { ...PULL_DAY }, { ...LEGS_DAY }],
  },
  {
    id: 'ul',
    name: 'UL',
    isBuiltIn: true,
    days: [{ ...UPPER_DAY }, { ...LOWER_DAY }],
  },
  {
    id: 'bro',
    name: 'Bro Split',
    isBuiltIn: true,
    days: [
      { type: 'chest',     label: 'Chest',     color: 'rose',    exerciseIds: ['bench-press', 'incline-bench', 'cable-fly', 'dips', 'front-raise'] },
      { type: 'back',      label: 'Back',       color: 'emerald', exerciseIds: ['barbell-row', 'pull-up', 'lat-pulldown', 'seated-row', 'face-pull'] },
      { type: 'legs-bro',  label: 'Legs',       color: 'purple',  exerciseIds: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise'] },
      { type: 'shoulders', label: 'Shoulders',  color: 'amber',   exerciseIds: ['overhead-press', 'lateral-raise', 'face-pull'] },
      { type: 'arms',      label: 'Arms',       color: 'yellow',  exerciseIds: ['barbell-curl', 'hammer-curl', 'tricep-pushdown', 'skull-crusher'] },
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
            days: (split.days ?? []).map(d => ({
              ...d,
              exerciseIds: d.exerciseIds.filter(eid => eid !== id),
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
                  days: (split.days ?? []).map(d =>
                    d.type === dayType ? { ...d, exerciseIds } : d
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
    {
      name: 'ppl-workouts',
      version: 1,
      migrate: (stored: any) => {
        // v0→v1: renamed split.sessions → split.days
        if (stored?.splits) {
          stored.splits = stored.splits.map((s: any) => ({
            ...s,
            days: s.days ?? s.sessions ?? [],
            sessions: undefined,
          }));
        }
        return stored;
      },
      merge: (persisted: any, current: WorkoutState) => {
        const sets: WorkoutSet[] = persisted?.workoutSets ?? [];
        const prs: PersonalRecord[] = persisted?.personalRecords ?? [];
        const demoPRKeys = new Set(DEMO_PERSONAL_RECORDS.map(p => p.exerciseId));
        const demoSetIds = new Set(DEMO_WORKOUT_SETS.map(s => s.id));
        return {
          ...current,
          ...persisted,
          workoutSets: [
            ...DEMO_WORKOUT_SETS,
            ...sets.filter((s: WorkoutSet) => !demoSetIds.has(s.id)),
          ],
          personalRecords: [
            ...DEMO_PERSONAL_RECORDS,
            ...prs.filter((p: PersonalRecord) => !demoPRKeys.has(p.exerciseId)),
          ],
        };
      },
    }
  )
);
