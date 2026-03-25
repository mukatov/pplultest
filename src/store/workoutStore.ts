import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, WorkoutSet, Day, Split, Superset, PersonalRecord, DayType, SetEntry } from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';

const DEMO_UID = 'demo-user-001';
function ds(eid: string) { return `${DEMO_UID}:${eid}`; }

// Helper to make compact sets
function s3(w: number, r1: number, r2: number, r3: number): SetEntry[] { return [{weight:w,reps:r1},{weight:w,reps:r2},{weight:w,reps:r3}]; }
function s4(w: number, r1: number, r2: number, r3: number, r4: number): SetEntry[] { return [{weight:w,reps:r1},{weight:w,reps:r2},{weight:w,reps:r3},{weight:w,reps:r4}]; }

const DEMO_WORKOUT_SETS: WorkoutSet[] = [
  // ── Bench Press (50 kg Mar 2025 → 80 kg Mar 2026) ──────────────────────────
  { id:'demo-bp-y01', exerciseId:ds('bench-press'), sets:s3(50,8,7,7),   date:'2025-03-25T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y02', exerciseId:ds('bench-press'), sets:s3(50,8,8,7),   date:'2025-04-08T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y03', exerciseId:ds('bench-press'), sets:s3(52.5,7,7,6), date:'2025-04-22T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y04', exerciseId:ds('bench-press'), sets:s3(52.5,8,8,7), date:'2025-05-06T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y05', exerciseId:ds('bench-press'), sets:s3(55,7,7,6),   date:'2025-05-20T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y06', exerciseId:ds('bench-press'), sets:s3(55,8,8,7),   date:'2025-06-03T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y07', exerciseId:ds('bench-press'), sets:s3(57.5,7,6,6), date:'2025-06-17T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y08', exerciseId:ds('bench-press'), sets:s3(57.5,8,7,7), date:'2025-07-01T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y09', exerciseId:ds('bench-press'), sets:s3(60,7,7,6),   date:'2025-07-15T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y10', exerciseId:ds('bench-press'), sets:s3(60,8,8,7),   date:'2025-07-29T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y11', exerciseId:ds('bench-press'), sets:s3(62.5,7,7,6), date:'2025-08-12T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y12', exerciseId:ds('bench-press'), sets:s3(62.5,8,7,7), date:'2025-08-26T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y13', exerciseId:ds('bench-press'), sets:s3(65,7,6,6),   date:'2025-09-09T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y14', exerciseId:ds('bench-press'), sets:s3(65,8,7,7),   date:'2025-09-23T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y15', exerciseId:ds('bench-press'), sets:s4(65,8,8,8,7), date:'2025-10-07T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y16', exerciseId:ds('bench-press'), sets:s4(67.5,7,7,6,6), date:'2025-10-21T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y17', exerciseId:ds('bench-press'), sets:s4(67.5,8,7,7,7), date:'2025-11-04T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y18', exerciseId:ds('bench-press'), sets:s4(67.5,8,8,8,7), date:'2025-11-18T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y19', exerciseId:ds('bench-press'), sets:s4(70,6,6,6,5), date:'2025-12-02T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y20', exerciseId:ds('bench-press'), sets:s4(70,7,7,6,6), date:'2025-12-16T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y21', exerciseId:ds('bench-press'), sets:s4(70,8,7,7,6), date:'2025-12-30T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y22', exerciseId:ds('bench-press'), sets:s4(70,8,8,7,7), date:'2026-01-13T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-y23', exerciseId:ds('bench-press'), sets:s4(70,8,8,8,7), date:'2026-01-27T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-1',   exerciseId:ds('bench-press'), sets:s3(70,8,8,7),   date:'2026-02-09T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-2',   exerciseId:ds('bench-press'), sets:s3(72.5,8,8,8), date:'2026-02-16T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-3',   exerciseId:ds('bench-press'), sets:s4(75,7,7,8,6), date:'2026-02-23T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-4',   exerciseId:ds('bench-press'), sets:s4(75,8,8,8,7), date:'2026-03-02T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-5',   exerciseId:ds('bench-press'), sets:s4(77.5,7,7,7,6), date:'2026-03-09T10:00:00.000Z', dayType:'upper' },
  { id:'demo-bp-6',   exerciseId:ds('bench-press'), sets:s4(77.5,8,8,7,8), date:'2026-03-16T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-7',   exerciseId:ds('bench-press'), sets:s4(80,7,7,6,7), date:'2026-03-23T10:00:00.000Z', dayType:'push' },

  // ── Squat (70 kg Mar 2025 → 102.5 kg Mar 2026) ─────────────────────────────
  { id:'demo-sq-y01', exerciseId:ds('squat'), sets:s3(70,6,6,5),   date:'2025-03-26T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y02', exerciseId:ds('squat'), sets:s3(70,6,6,6),   date:'2025-04-09T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y03', exerciseId:ds('squat'), sets:s3(72.5,6,5,5), date:'2025-04-23T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y04', exerciseId:ds('squat'), sets:s3(72.5,6,6,6), date:'2025-05-07T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y05', exerciseId:ds('squat'), sets:s3(75,6,5,5),   date:'2025-05-21T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y06', exerciseId:ds('squat'), sets:s4(75,6,6,6,5), date:'2025-06-04T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y07', exerciseId:ds('squat'), sets:s4(77.5,5,5,5,4), date:'2025-06-18T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y08', exerciseId:ds('squat'), sets:s4(77.5,6,6,5,5), date:'2025-07-02T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y09', exerciseId:ds('squat'), sets:s4(80,5,5,5,4),   date:'2025-07-16T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y10', exerciseId:ds('squat'), sets:s4(80,6,5,5,5),   date:'2025-07-30T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y11', exerciseId:ds('squat'), sets:s4(82.5,5,5,4,4), date:'2025-08-13T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y12', exerciseId:ds('squat'), sets:s4(82.5,6,5,5,5), date:'2025-08-27T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y13', exerciseId:ds('squat'), sets:s4(85,5,5,4,4),   date:'2025-09-10T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y14', exerciseId:ds('squat'), sets:s4(85,6,5,5,5),   date:'2025-09-24T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y15', exerciseId:ds('squat'), sets:s4(87.5,5,5,5,4), date:'2025-10-08T10:00:00.000Z', dayType:'lower' },
  { id:'demo-sq-y16', exerciseId:ds('squat'), sets:s4(87.5,6,6,5,5), date:'2025-10-22T10:00:00.000Z', dayType:'lower' },
  { id:'demo-sq-y17', exerciseId:ds('squat'), sets:s4(87.5,6,6,6,5), date:'2025-11-05T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y18', exerciseId:ds('squat'), sets:s4(90,5,5,5,4),   date:'2025-11-19T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y19', exerciseId:ds('squat'), sets:s4(90,6,5,5,5),   date:'2025-12-03T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y20', exerciseId:ds('squat'), sets:s4(90,6,6,5,5),   date:'2025-12-17T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y21', exerciseId:ds('squat'), sets:s4(90,6,6,6,5),   date:'2025-12-31T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y22', exerciseId:ds('squat'), sets:s3(90,6,6,6),     date:'2026-01-14T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-y23', exerciseId:ds('squat'), sets:s3(90,6,6,6),     date:'2026-01-28T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-1',   exerciseId:ds('squat'), sets:s3(90,6,6,5),     date:'2026-02-10T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-2',   exerciseId:ds('squat'), sets:s3(92.5,6,6,6),   date:'2026-02-17T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-3',   exerciseId:ds('squat'), sets:s4(95,5,5,5,5),   date:'2026-02-24T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-4',   exerciseId:ds('squat'), sets:s4(97.5,5,5,5,4), date:'2026-03-03T10:00:00.000Z', dayType:'lower' },
  { id:'demo-sq-5',   exerciseId:ds('squat'), sets:s4(100,5,5,5,5),  date:'2026-03-10T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-6',   exerciseId:ds('squat'), sets:s3(102.5,5,5,4),  date:'2026-03-17T10:00:00.000Z', dayType:'lower' },
  { id:'demo-sq-7',   exerciseId:ds('squat'), sets:s4(100,6,6,6,5),  date:'2026-03-24T10:00:00.000Z', dayType:'legs' },

  // ── Overhead Press (37.5 kg Mar 2025 → 57.5 kg Mar 2026) ──────────────────
  { id:'demo-ohp-y01', exerciseId:ds('overhead-press'), sets:s3(37.5,8,8,7), date:'2025-03-25T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y02', exerciseId:ds('overhead-press'), sets:s3(37.5,8,8,8), date:'2025-04-08T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y03', exerciseId:ds('overhead-press'), sets:s3(40,7,7,6),   date:'2025-04-22T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y04', exerciseId:ds('overhead-press'), sets:s3(40,8,8,7),   date:'2025-05-06T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y05', exerciseId:ds('overhead-press'), sets:s3(42.5,7,6,6), date:'2025-05-20T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y06', exerciseId:ds('overhead-press'), sets:s3(42.5,8,7,7), date:'2025-06-03T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y07', exerciseId:ds('overhead-press'), sets:s3(42.5,8,8,7), date:'2025-06-17T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y08', exerciseId:ds('overhead-press'), sets:s3(45,7,6,6),   date:'2025-07-01T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y09', exerciseId:ds('overhead-press'), sets:s3(45,8,7,7),   date:'2025-07-15T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y10', exerciseId:ds('overhead-press'), sets:s3(45,8,8,7),   date:'2025-07-29T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y11', exerciseId:ds('overhead-press'), sets:s3(47.5,7,6,6), date:'2025-08-12T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y12', exerciseId:ds('overhead-press'), sets:s3(47.5,8,7,7), date:'2025-08-26T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y13', exerciseId:ds('overhead-press'), sets:s3(47.5,8,8,7), date:'2025-09-09T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y14', exerciseId:ds('overhead-press'), sets:s3(50,7,6,6),   date:'2025-09-23T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y15', exerciseId:ds('overhead-press'), sets:s3(50,7,7,6),   date:'2025-10-07T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y16', exerciseId:ds('overhead-press'), sets:s3(50,8,7,7),   date:'2025-10-21T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y17', exerciseId:ds('overhead-press'), sets:s3(50,8,8,7),   date:'2025-11-04T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y18', exerciseId:ds('overhead-press'), sets:s3(50,8,8,8),   date:'2025-11-18T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y19', exerciseId:ds('overhead-press'), sets:s3(50,8,8,8),   date:'2025-12-02T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y20', exerciseId:ds('overhead-press'), sets:s3(50,8,8,8),   date:'2025-12-16T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y21', exerciseId:ds('overhead-press'), sets:s3(50,8,8,8),   date:'2025-12-30T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y22', exerciseId:ds('overhead-press'), sets:s3(50,8,8,8),   date:'2026-01-13T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-y23', exerciseId:ds('overhead-press'), sets:s3(50,8,8,8),   date:'2026-01-27T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-1',   exerciseId:ds('overhead-press'), sets:s3(50,8,8,7),   date:'2026-02-11T10:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-2',   exerciseId:ds('overhead-press'), sets:s3(52.5,7,7,6), date:'2026-02-18T10:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-3',   exerciseId:ds('overhead-press'), sets:s3(52.5,8,8,7), date:'2026-02-25T10:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-4',   exerciseId:ds('overhead-press'), sets:s3(55,7,7,6),   date:'2026-03-04T10:00:00.000Z', dayType:'upper' },
  { id:'demo-ohp-5',   exerciseId:ds('overhead-press'), sets:s3(55,8,8,7),   date:'2026-03-11T10:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-6',   exerciseId:ds('overhead-press'), sets:s3(57.5,7,6,6), date:'2026-03-18T10:00:00.000Z', dayType:'push' },

  // ── Barbell Row (50 kg Mar 2025 → 75 kg Mar 2026) ──────────────────────────
  { id:'demo-row-y01', exerciseId:ds('barbell-row'), sets:s4(50,6,6,6,5),   date:'2025-03-27T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y02', exerciseId:ds('barbell-row'), sets:s4(50,6,6,6,6),   date:'2025-04-10T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y03', exerciseId:ds('barbell-row'), sets:s4(52.5,6,6,5,5), date:'2025-04-24T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y04', exerciseId:ds('barbell-row'), sets:s4(52.5,6,6,6,5), date:'2025-05-08T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y05', exerciseId:ds('barbell-row'), sets:s4(55,5,5,5,5),   date:'2025-05-22T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y06', exerciseId:ds('barbell-row'), sets:s4(55,6,6,5,5),   date:'2025-06-05T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y07', exerciseId:ds('barbell-row'), sets:s4(55,6,6,6,5),   date:'2025-06-19T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y08', exerciseId:ds('barbell-row'), sets:s4(57.5,5,5,5,4), date:'2025-07-03T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y09', exerciseId:ds('barbell-row'), sets:s4(57.5,6,6,5,5), date:'2025-07-17T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y10', exerciseId:ds('barbell-row'), sets:s4(57.5,6,6,6,5), date:'2025-07-31T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y11', exerciseId:ds('barbell-row'), sets:s4(60,5,5,5,4),   date:'2025-08-14T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y12', exerciseId:ds('barbell-row'), sets:s4(60,6,5,5,5),   date:'2025-08-28T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y13', exerciseId:ds('barbell-row'), sets:s4(60,6,6,6,5),   date:'2025-09-11T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y14', exerciseId:ds('barbell-row'), sets:s4(62.5,5,5,5,5), date:'2025-09-25T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y15', exerciseId:ds('barbell-row'), sets:s4(62.5,6,6,5,5), date:'2025-10-09T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y16', exerciseId:ds('barbell-row'), sets:s4(62.5,6,6,6,5), date:'2025-10-23T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y17', exerciseId:ds('barbell-row'), sets:s4(65,5,5,5,4),   date:'2025-11-06T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y18', exerciseId:ds('barbell-row'), sets:s4(65,6,5,5,5),   date:'2025-11-20T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y19', exerciseId:ds('barbell-row'), sets:s4(65,6,6,6,5),   date:'2025-12-04T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y20', exerciseId:ds('barbell-row'), sets:s4(65,6,6,6,6),   date:'2025-12-18T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y21', exerciseId:ds('barbell-row'), sets:s4(65,6,6,6,6),   date:'2026-01-01T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y22', exerciseId:ds('barbell-row'), sets:s4(65,6,6,6,6),   date:'2026-01-15T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-y23', exerciseId:ds('barbell-row'), sets:s4(65,6,6,6,6),   date:'2026-01-29T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-1',   exerciseId:ds('barbell-row'), sets:s4(65,6,6,6,5),   date:'2026-02-12T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-2',   exerciseId:ds('barbell-row'), sets:s4(67.5,6,6,6,6), date:'2026-02-19T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-3',   exerciseId:ds('barbell-row'), sets:s4(70,5,5,5,5),   date:'2026-02-26T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-4',   exerciseId:ds('barbell-row'), sets:s4(70,6,6,6,5),   date:'2026-03-05T10:00:00.000Z', dayType:'upper' },
  { id:'demo-row-5',   exerciseId:ds('barbell-row'), sets:s4(72.5,6,6,6,5), date:'2026-03-12T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-6',   exerciseId:ds('barbell-row'), sets:s3(75,6,6,5),     date:'2026-03-19T10:00:00.000Z', dayType:'pull' },
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

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

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

  logWorkout: (exerciseId: string, sets: SetEntry[], dayType: DayType, userId: string, supersetId?: string) => void;
  getLastWorkout: (exerciseId: string, userId: string) => WorkoutSet | undefined;
  getWorkoutHistory: (exerciseId: string, userId: string) => WorkoutSet[];

  updateDayExercises: (dayType: string, exerciseIds: string[]) => void;
  addSuperset: (dayType: string, superset: Superset) => void;
  removeSuperset: (dayType: string, supersetId: string) => void;

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
              supersets: (d.supersets ?? [])
                .map(ss => ({ ...ss, exerciseIds: ss.exerciseIds.filter(eid => eid !== id) }))
                .filter(ss => ss.exerciseIds.length >= 2),
            })),
          })),
        })),

      logWorkout: (exerciseId, sets, dayType, userId, supersetId?) => {
        const entry: WorkoutSet = {
          id: generateId(),
          exerciseId: `${userId}:${exerciseId}`,
          sets,
          date: new Date().toISOString(),
          dayType,
          ...(supersetId ? { supersetId } : {}),
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

      addSuperset: (dayType, superset) =>
        set(state => ({
          splits: state.splits.map(split =>
            split.id === state.activeSplitId
              ? {
                  ...split,
                  days: (split.days ?? []).map(d =>
                    d.type === dayType
                      ? { ...d, supersets: [...(d.supersets ?? []), superset] }
                      : d
                  ),
                }
              : split
          ),
        })),

      removeSuperset: (dayType, supersetId) =>
        set(state => ({
          splits: state.splits.map(split =>
            split.id === state.activeSplitId
              ? {
                  ...split,
                  days: (split.days ?? []).map(d =>
                    d.type === dayType
                      ? { ...d, supersets: (d.supersets ?? []).filter(ss => ss.id !== supersetId) }
                      : d
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
