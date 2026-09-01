import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, WorkoutSet, Day, Split, Superset, PersonalRecord, DayType, SetEntry } from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';
import { pullCloudData, pushCloudData, mergeWorkoutSets, mergePersonalRecords } from '../lib/cloudSync';

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

  // ── Bench Press extensions (Apr → Aug 2026) ────────────────────────────────
  { id:'demo-bp-8',  exerciseId:ds('bench-press'), sets:s4(80,8,7,7,7),   date:'2026-04-06T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-9',  exerciseId:ds('bench-press'), sets:s4(80,8,8,7,7),   date:'2026-04-20T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-10', exerciseId:ds('bench-press'), sets:s4(82.5,7,7,6,6), date:'2026-05-04T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-11', exerciseId:ds('bench-press'), sets:s4(82.5,8,7,7,7), date:'2026-05-18T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-12', exerciseId:ds('bench-press'), sets:s4(85,6,6,6,5),   date:'2026-06-01T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-13', exerciseId:ds('bench-press'), sets:s4(85,7,7,6,6),   date:'2026-06-15T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-14', exerciseId:ds('bench-press'), sets:s4(85,7,7,7,6),   date:'2026-06-29T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-15', exerciseId:ds('bench-press'), sets:s4(87.5,6,6,6,5), date:'2026-07-13T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-16', exerciseId:ds('bench-press'), sets:s4(87.5,7,7,6,6), date:'2026-07-27T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-17', exerciseId:ds('bench-press'), sets:s4(90,6,6,5,5),   date:'2026-08-10T10:00:00.000Z', dayType:'push' },
  { id:'demo-bp-18', exerciseId:ds('bench-press'), sets:s4(90,7,6,6,6),   date:'2026-08-24T10:00:00.000Z', dayType:'push' },

  // ── Squat extensions (Apr → Aug 2026) ─────────────────────────────────────
  { id:'demo-sq-8',  exerciseId:ds('squat'), sets:s4(102.5,5,5,5,5), date:'2026-04-08T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-9',  exerciseId:ds('squat'), sets:s4(105,5,5,4,4),   date:'2026-04-22T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-10', exerciseId:ds('squat'), sets:s4(105,5,5,5,5),   date:'2026-05-06T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-11', exerciseId:ds('squat'), sets:s4(107.5,5,5,4,4), date:'2026-05-20T10:00:00.000Z', dayType:'lower' },
  { id:'demo-sq-12', exerciseId:ds('squat'), sets:s4(107.5,5,5,5,5), date:'2026-06-03T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-13', exerciseId:ds('squat'), sets:s4(110,5,5,4,4),   date:'2026-06-17T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-14', exerciseId:ds('squat'), sets:s4(110,5,5,5,5),   date:'2026-07-01T10:00:00.000Z', dayType:'lower' },
  { id:'demo-sq-15', exerciseId:ds('squat'), sets:s4(112.5,5,4,4,4), date:'2026-07-15T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-16', exerciseId:ds('squat'), sets:s4(112.5,5,5,5,4), date:'2026-07-29T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-17', exerciseId:ds('squat'), sets:s4(115,5,4,4,4),   date:'2026-08-12T10:00:00.000Z', dayType:'legs' },
  { id:'demo-sq-18', exerciseId:ds('squat'), sets:s4(115,5,5,5,5),   date:'2026-08-26T10:00:00.000Z', dayType:'legs' },

  // ── OHP extensions (Apr → Aug 2026) ───────────────────────────────────────
  { id:'demo-ohp-7',  exerciseId:ds('overhead-press'), sets:s3(57.5,8,8,7), date:'2026-04-06T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-8',  exerciseId:ds('overhead-press'), sets:s3(60,6,6,6),   date:'2026-04-20T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-9',  exerciseId:ds('overhead-press'), sets:s3(60,7,7,6),   date:'2026-05-04T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-10', exerciseId:ds('overhead-press'), sets:s3(62.5,6,6,5), date:'2026-05-18T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-11', exerciseId:ds('overhead-press'), sets:s3(62.5,7,7,6), date:'2026-06-01T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-12', exerciseId:ds('overhead-press'), sets:s3(65,6,5,5),   date:'2026-06-15T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-13', exerciseId:ds('overhead-press'), sets:s3(65,7,6,6),   date:'2026-06-29T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-14', exerciseId:ds('overhead-press'), sets:s3(67.5,6,5,5), date:'2026-07-13T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-15', exerciseId:ds('overhead-press'), sets:s3(67.5,7,6,6), date:'2026-07-27T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-16', exerciseId:ds('overhead-press'), sets:s3(70,5,5,5),   date:'2026-08-10T11:00:00.000Z', dayType:'push' },
  { id:'demo-ohp-17', exerciseId:ds('overhead-press'), sets:s3(70,6,5,5),   date:'2026-08-24T11:00:00.000Z', dayType:'push' },

  // ── Barbell Row extensions (Apr → Aug 2026) ────────────────────────────────
  { id:'demo-row-7',  exerciseId:ds('barbell-row'), sets:s4(75,6,6,6,5),   date:'2026-04-07T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-8',  exerciseId:ds('barbell-row'), sets:s4(77.5,5,5,5,5), date:'2026-04-21T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-9',  exerciseId:ds('barbell-row'), sets:s4(77.5,6,6,5,5), date:'2026-05-05T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-10', exerciseId:ds('barbell-row'), sets:s4(80,5,5,5,5),   date:'2026-05-19T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-11', exerciseId:ds('barbell-row'), sets:s4(80,6,6,5,5),   date:'2026-06-02T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-12', exerciseId:ds('barbell-row'), sets:s4(82.5,5,5,5,4), date:'2026-06-16T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-13', exerciseId:ds('barbell-row'), sets:s4(82.5,6,5,5,5), date:'2026-06-30T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-14', exerciseId:ds('barbell-row'), sets:s4(85,5,5,5,4),   date:'2026-07-14T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-15', exerciseId:ds('barbell-row'), sets:s4(85,6,5,5,5),   date:'2026-07-28T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-16', exerciseId:ds('barbell-row'), sets:s4(87.5,5,5,4,4), date:'2026-08-11T10:00:00.000Z', dayType:'pull' },
  { id:'demo-row-17', exerciseId:ds('barbell-row'), sets:s4(87.5,6,5,5,5), date:'2026-08-25T10:00:00.000Z', dayType:'pull' },

  // ── Incline Bench Press (push, 42.5 → 82.5 kg) ────────────────────────────
  { id:'demo-ib-1',  exerciseId:ds('incline-bench'), sets:s3(42.5,7,7,6), date:'2025-03-25T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-2',  exerciseId:ds('incline-bench'), sets:s3(42.5,8,8,7), date:'2025-04-22T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-3',  exerciseId:ds('incline-bench'), sets:s3(45,7,7,6),   date:'2025-05-20T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-4',  exerciseId:ds('incline-bench'), sets:s3(47.5,7,6,6), date:'2025-06-17T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-5',  exerciseId:ds('incline-bench'), sets:s3(47.5,8,7,7), date:'2025-07-15T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-6',  exerciseId:ds('incline-bench'), sets:s3(50,7,7,6),   date:'2025-08-12T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-7',  exerciseId:ds('incline-bench'), sets:s3(52.5,7,6,6), date:'2025-09-09T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-8',  exerciseId:ds('incline-bench'), sets:s3(55,7,6,6),   date:'2025-10-07T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-9',  exerciseId:ds('incline-bench'), sets:s3(55,7,7,7),   date:'2025-11-04T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-10', exerciseId:ds('incline-bench'), sets:s3(57.5,7,6,6), date:'2025-12-02T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-11', exerciseId:ds('incline-bench'), sets:s3(60,7,6,6),   date:'2025-12-30T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-12', exerciseId:ds('incline-bench'), sets:s3(60,7,7,7),   date:'2026-01-27T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-13', exerciseId:ds('incline-bench'), sets:s3(62.5,7,7,6), date:'2026-02-23T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-14', exerciseId:ds('incline-bench'), sets:s3(65,7,7,6),   date:'2026-04-06T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-15', exerciseId:ds('incline-bench'), sets:s3(67.5,7,7,7), date:'2026-05-04T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-16', exerciseId:ds('incline-bench'), sets:s3(70,7,7,6),   date:'2026-05-18T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-17', exerciseId:ds('incline-bench'), sets:s3(70,7,7,7),   date:'2026-06-01T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-18', exerciseId:ds('incline-bench'), sets:s3(72.5,7,7,6), date:'2026-06-29T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-19', exerciseId:ds('incline-bench'), sets:s3(75,7,7,6),   date:'2026-07-27T10:45:00.000Z', dayType:'push' },
  { id:'demo-ib-20', exerciseId:ds('incline-bench'), sets:s3(77.5,7,7,7), date:'2026-08-24T10:45:00.000Z', dayType:'push' },

  // ── Lateral Raise (push, 10 → 20 kg, 3×12-15) ─────────────────────────────
  { id:'demo-lr-1',  exerciseId:ds('lateral-raise'), sets:s3(10,15,12,12), date:'2025-03-25T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-2',  exerciseId:ds('lateral-raise'), sets:s3(10,15,15,12), date:'2025-04-22T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-3',  exerciseId:ds('lateral-raise'), sets:s3(12,12,12,10), date:'2025-05-20T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-4',  exerciseId:ds('lateral-raise'), sets:s3(12,15,12,12), date:'2025-06-17T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-5',  exerciseId:ds('lateral-raise'), sets:s3(14,12,10,10), date:'2025-07-15T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-6',  exerciseId:ds('lateral-raise'), sets:s3(14,12,12,12), date:'2025-08-12T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-7',  exerciseId:ds('lateral-raise'), sets:s3(14,15,12,12), date:'2025-09-09T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-8',  exerciseId:ds('lateral-raise'), sets:s3(16,12,10,10), date:'2025-10-07T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-9',  exerciseId:ds('lateral-raise'), sets:s3(16,12,12,12), date:'2025-11-04T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-10', exerciseId:ds('lateral-raise'), sets:s3(16,15,12,12), date:'2025-12-02T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-11', exerciseId:ds('lateral-raise'), sets:s3(18,12,10,10), date:'2025-12-30T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-12', exerciseId:ds('lateral-raise'), sets:s3(18,12,12,12), date:'2026-01-27T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-13', exerciseId:ds('lateral-raise'), sets:s3(18,15,12,12), date:'2026-02-23T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-14', exerciseId:ds('lateral-raise'), sets:s3(20,12,10,10), date:'2026-04-06T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-15', exerciseId:ds('lateral-raise'), sets:s3(20,12,12,12), date:'2026-06-01T12:00:00.000Z', dayType:'push' },
  { id:'demo-lr-16', exerciseId:ds('lateral-raise'), sets:s3(20,15,12,12), date:'2026-07-27T12:00:00.000Z', dayType:'push' },

  // ── Tricep Pushdown (push, 27.5 → 52.5 kg, 3×12-15) ──────────────────────
  { id:'demo-tp-1',  exerciseId:ds('tricep-pushdown'), sets:s3(27.5,15,12,12), date:'2025-03-25T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-2',  exerciseId:ds('tricep-pushdown'), sets:s3(30,12,12,10),   date:'2025-04-22T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-3',  exerciseId:ds('tricep-pushdown'), sets:s3(30,15,12,12),   date:'2025-05-20T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-4',  exerciseId:ds('tricep-pushdown'), sets:s3(32.5,12,12,10), date:'2025-06-17T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-5',  exerciseId:ds('tricep-pushdown'), sets:s3(35,12,10,10),   date:'2025-07-15T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-6',  exerciseId:ds('tricep-pushdown'), sets:s3(35,15,12,12),   date:'2025-08-12T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-7',  exerciseId:ds('tricep-pushdown'), sets:s3(37.5,12,12,10), date:'2025-09-09T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-8',  exerciseId:ds('tricep-pushdown'), sets:s3(40,12,10,10),   date:'2025-10-07T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-9',  exerciseId:ds('tricep-pushdown'), sets:s3(40,15,12,12),   date:'2025-11-04T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-10', exerciseId:ds('tricep-pushdown'), sets:s3(42.5,12,12,10), date:'2025-12-02T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-11', exerciseId:ds('tricep-pushdown'), sets:s3(45,12,10,10),   date:'2025-12-30T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-12', exerciseId:ds('tricep-pushdown'), sets:s3(45,12,12,12),   date:'2026-01-27T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-13', exerciseId:ds('tricep-pushdown'), sets:s3(47.5,12,12,10), date:'2026-02-23T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-14', exerciseId:ds('tricep-pushdown'), sets:s3(50,12,10,10),   date:'2026-04-06T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-15', exerciseId:ds('tricep-pushdown'), sets:s3(50,12,12,12),   date:'2026-06-01T12:15:00.000Z', dayType:'push' },
  { id:'demo-tp-16', exerciseId:ds('tricep-pushdown'), sets:s3(52.5,12,12,10), date:'2026-08-10T12:15:00.000Z', dayType:'push' },

  // ── Pull-up (pull, 0 → +22.5 kg added, 3×6-8) ────────────────────────────
  { id:'demo-pu-1',  exerciseId:ds('pull-up'), sets:s3(0,8,6,6),      date:'2025-03-27T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-2',  exerciseId:ds('pull-up'), sets:s3(0,8,8,6),      date:'2025-04-24T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-3',  exerciseId:ds('pull-up'), sets:s3(2.5,6,6,5),    date:'2025-05-22T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-4',  exerciseId:ds('pull-up'), sets:s3(2.5,8,6,6),    date:'2025-06-19T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-5',  exerciseId:ds('pull-up'), sets:s3(5,6,6,5),      date:'2025-07-17T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-6',  exerciseId:ds('pull-up'), sets:s3(5,7,6,6),      date:'2025-08-14T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-7',  exerciseId:ds('pull-up'), sets:s3(7.5,6,5,5),    date:'2025-09-11T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-8',  exerciseId:ds('pull-up'), sets:s3(7.5,7,6,6),    date:'2025-10-09T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-9',  exerciseId:ds('pull-up'), sets:s3(10,6,5,5),     date:'2025-11-06T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-10', exerciseId:ds('pull-up'), sets:s3(10,7,6,6),     date:'2025-12-04T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-11', exerciseId:ds('pull-up'), sets:s3(12.5,6,5,5),   date:'2026-01-01T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-12', exerciseId:ds('pull-up'), sets:s3(12.5,7,6,6),   date:'2026-01-29T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-13', exerciseId:ds('pull-up'), sets:s3(15,6,6,6),     date:'2026-02-26T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-14', exerciseId:ds('pull-up'), sets:s3(17.5,6,5,5),   date:'2026-04-09T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-15', exerciseId:ds('pull-up'), sets:s3(17.5,7,6,6),   date:'2026-05-21T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-16', exerciseId:ds('pull-up'), sets:s3(20,6,5,5),     date:'2026-07-02T10:45:00.000Z', dayType:'pull' },
  { id:'demo-pu-17', exerciseId:ds('pull-up'), sets:s3(22.5,6,5,5),   date:'2026-08-13T10:45:00.000Z', dayType:'pull' },

  // ── Lat Pulldown (pull, 55 → 92.5 kg, 4×8-12) ────────────────────────────
  { id:'demo-ld-1',  exerciseId:ds('lat-pulldown'), sets:s4(55,12,10,10,8),  date:'2025-03-27T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-2',  exerciseId:ds('lat-pulldown'), sets:s4(60,10,10,8,8),   date:'2025-04-24T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-3',  exerciseId:ds('lat-pulldown'), sets:s4(62.5,10,8,8,8),  date:'2025-05-22T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-4',  exerciseId:ds('lat-pulldown'), sets:s4(65,10,8,8,8),    date:'2025-06-19T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-5',  exerciseId:ds('lat-pulldown'), sets:s4(67.5,8,8,8,8),   date:'2025-07-17T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-6',  exerciseId:ds('lat-pulldown'), sets:s4(70,8,8,8,8),     date:'2025-08-14T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-7',  exerciseId:ds('lat-pulldown'), sets:s4(72.5,8,8,8,8),   date:'2025-09-11T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-8',  exerciseId:ds('lat-pulldown'), sets:s4(75,8,8,8,8),     date:'2025-10-09T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-9',  exerciseId:ds('lat-pulldown'), sets:s4(75,10,8,8,8),    date:'2025-11-06T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-10', exerciseId:ds('lat-pulldown'), sets:s4(77.5,8,8,8,8),   date:'2025-12-04T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-11', exerciseId:ds('lat-pulldown'), sets:s4(80,8,8,8,8),     date:'2026-01-01T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-12', exerciseId:ds('lat-pulldown'), sets:s4(82.5,8,8,8,8),   date:'2026-01-29T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-13', exerciseId:ds('lat-pulldown'), sets:s4(85,8,8,8,8),     date:'2026-02-26T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-14', exerciseId:ds('lat-pulldown'), sets:s4(87.5,8,8,8,8),   date:'2026-04-09T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-15', exerciseId:ds('lat-pulldown'), sets:s4(90,8,8,8,8),     date:'2026-05-21T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-16', exerciseId:ds('lat-pulldown'), sets:s4(90,10,8,8,8),    date:'2026-07-02T11:15:00.000Z', dayType:'pull' },
  { id:'demo-ld-17', exerciseId:ds('lat-pulldown'), sets:s4(92.5,8,8,8,8),   date:'2026-08-13T11:15:00.000Z', dayType:'pull' },

  // ── Face Pull (pull, 17.5 → 40 kg, 3×15) ─────────────────────────────────
  { id:'demo-fp-1',  exerciseId:ds('face-pull'), sets:s3(17.5,15,15,12), date:'2025-03-27T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-2',  exerciseId:ds('face-pull'), sets:s3(20,15,15,12),   date:'2025-04-24T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-3',  exerciseId:ds('face-pull'), sets:s3(22.5,15,12,12), date:'2025-05-22T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-4',  exerciseId:ds('face-pull'), sets:s3(25,15,12,12),   date:'2025-06-19T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-5',  exerciseId:ds('face-pull'), sets:s3(25,15,15,12),   date:'2025-07-17T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-6',  exerciseId:ds('face-pull'), sets:s3(27.5,15,12,12), date:'2025-08-14T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-7',  exerciseId:ds('face-pull'), sets:s3(30,15,12,12),   date:'2025-09-11T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-8',  exerciseId:ds('face-pull'), sets:s3(30,15,15,15),   date:'2025-10-09T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-9',  exerciseId:ds('face-pull'), sets:s3(32.5,15,12,12), date:'2025-11-06T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-10', exerciseId:ds('face-pull'), sets:s3(32.5,15,15,15), date:'2025-12-04T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-11', exerciseId:ds('face-pull'), sets:s3(35,15,15,12),   date:'2026-01-01T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-12', exerciseId:ds('face-pull'), sets:s3(35,15,15,15),   date:'2026-01-29T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-13', exerciseId:ds('face-pull'), sets:s3(37.5,15,15,12), date:'2026-02-26T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-14', exerciseId:ds('face-pull'), sets:s3(40,15,12,12),   date:'2026-04-09T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-15', exerciseId:ds('face-pull'), sets:s3(40,15,15,15),   date:'2026-07-02T11:45:00.000Z', dayType:'pull' },
  { id:'demo-fp-16', exerciseId:ds('face-pull'), sets:s3(40,15,15,15),   date:'2026-08-13T11:45:00.000Z', dayType:'pull' },

  // ── Barbell Curl (pull, 30 → 50 kg, 3×8-10) ──────────────────────────────
  { id:'demo-bc-1',  exerciseId:ds('barbell-curl'), sets:s3(30,10,8,8),   date:'2025-03-27T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-2',  exerciseId:ds('barbell-curl'), sets:s3(30,10,10,8),  date:'2025-04-24T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-3',  exerciseId:ds('barbell-curl'), sets:s3(32.5,8,8,6),  date:'2025-05-22T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-4',  exerciseId:ds('barbell-curl'), sets:s3(35,8,8,6),    date:'2025-06-19T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-5',  exerciseId:ds('barbell-curl'), sets:s3(35,8,8,8),    date:'2025-07-17T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-6',  exerciseId:ds('barbell-curl'), sets:s3(37.5,8,8,6),  date:'2025-08-14T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-7',  exerciseId:ds('barbell-curl'), sets:s3(37.5,8,8,8),  date:'2025-09-11T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-8',  exerciseId:ds('barbell-curl'), sets:s3(40,8,8,6),    date:'2025-10-09T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-9',  exerciseId:ds('barbell-curl'), sets:s3(40,8,8,8),    date:'2025-11-06T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-10', exerciseId:ds('barbell-curl'), sets:s3(42.5,8,8,6),  date:'2025-12-04T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-11', exerciseId:ds('barbell-curl'), sets:s3(42.5,8,8,8),  date:'2026-01-01T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-12', exerciseId:ds('barbell-curl'), sets:s3(45,8,8,6),    date:'2026-01-29T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-13', exerciseId:ds('barbell-curl'), sets:s3(45,8,8,8),    date:'2026-02-26T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-14', exerciseId:ds('barbell-curl'), sets:s3(47.5,8,8,6),  date:'2026-04-09T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-15', exerciseId:ds('barbell-curl'), sets:s3(47.5,8,8,8),  date:'2026-05-21T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-16', exerciseId:ds('barbell-curl'), sets:s3(50,8,8,6),    date:'2026-07-02T12:00:00.000Z', dayType:'pull' },
  { id:'demo-bc-17', exerciseId:ds('barbell-curl'), sets:s3(50,8,8,8),    date:'2026-08-13T12:00:00.000Z', dayType:'pull' },

  // ── Hammer Curl (upper/pull, 16 → 28 kg, 3×10-12) ────────────────────────
  { id:'demo-hc-1',  exerciseId:ds('hammer-curl'), sets:s3(16,12,10,10), date:'2025-03-27T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-2',  exerciseId:ds('hammer-curl'), sets:s3(16,12,12,10), date:'2025-04-24T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-3',  exerciseId:ds('hammer-curl'), sets:s3(18,10,10,10), date:'2025-06-19T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-4',  exerciseId:ds('hammer-curl'), sets:s3(18,12,10,10), date:'2025-07-17T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-5',  exerciseId:ds('hammer-curl'), sets:s3(18,12,12,10), date:'2025-08-14T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-6',  exerciseId:ds('hammer-curl'), sets:s3(20,10,10,10), date:'2025-09-11T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-7',  exerciseId:ds('hammer-curl'), sets:s3(20,12,10,10), date:'2025-10-09T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-8',  exerciseId:ds('hammer-curl'), sets:s3(20,12,12,12), date:'2025-11-06T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-9',  exerciseId:ds('hammer-curl'), sets:s3(22,12,10,10), date:'2025-12-04T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-10', exerciseId:ds('hammer-curl'), sets:s3(22,12,12,12), date:'2026-01-01T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-11', exerciseId:ds('hammer-curl'), sets:s3(24,12,10,10), date:'2026-01-29T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-12', exerciseId:ds('hammer-curl'), sets:s3(24,12,12,12), date:'2026-02-26T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-13', exerciseId:ds('hammer-curl'), sets:s3(26,12,10,10), date:'2026-04-09T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-14', exerciseId:ds('hammer-curl'), sets:s3(26,12,12,10), date:'2026-05-21T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-15', exerciseId:ds('hammer-curl'), sets:s3(28,12,10,10), date:'2026-07-02T12:15:00.000Z', dayType:'upper' },
  { id:'demo-hc-16', exerciseId:ds('hammer-curl'), sets:s3(28,12,12,10), date:'2026-08-13T12:15:00.000Z', dayType:'upper' },

  // ── Romanian Deadlift (legs, 60 → 115 kg, 3×8-10) ────────────────────────
  { id:'demo-rdl-1',  exerciseId:ds('romanian-deadlift'), sets:s3(60,10,10,8),  date:'2025-03-26T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-2',  exerciseId:ds('romanian-deadlift'), sets:s3(65,10,8,8),   date:'2025-04-23T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-3',  exerciseId:ds('romanian-deadlift'), sets:s3(70,10,8,8),   date:'2025-05-21T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-4',  exerciseId:ds('romanian-deadlift'), sets:s3(75,8,8,8),    date:'2025-06-18T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-5',  exerciseId:ds('romanian-deadlift'), sets:s3(77.5,8,8,8),  date:'2025-07-16T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-6',  exerciseId:ds('romanian-deadlift'), sets:s3(80,8,8,8),    date:'2025-08-13T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-7',  exerciseId:ds('romanian-deadlift'), sets:s3(82.5,8,8,8),  date:'2025-09-10T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-8',  exerciseId:ds('romanian-deadlift'), sets:s3(85,8,8,8),    date:'2025-10-08T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-9',  exerciseId:ds('romanian-deadlift'), sets:s3(87.5,8,8,6),  date:'2025-11-05T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-10', exerciseId:ds('romanian-deadlift'), sets:s3(90,8,8,6),    date:'2025-12-03T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-11', exerciseId:ds('romanian-deadlift'), sets:s3(92.5,8,8,6),  date:'2025-12-31T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-12', exerciseId:ds('romanian-deadlift'), sets:s3(95,8,8,6),    date:'2026-01-28T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-13', exerciseId:ds('romanian-deadlift'), sets:s3(100,8,8,6),   date:'2026-02-25T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-14', exerciseId:ds('romanian-deadlift'), sets:s3(105,8,6,6),   date:'2026-04-08T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-15', exerciseId:ds('romanian-deadlift'), sets:s3(107.5,8,6,6), date:'2026-05-20T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-16', exerciseId:ds('romanian-deadlift'), sets:s3(110,8,6,6),   date:'2026-07-01T10:50:00.000Z', dayType:'legs' },
  { id:'demo-rdl-17', exerciseId:ds('romanian-deadlift'), sets:s3(115,8,6,6),   date:'2026-08-12T10:50:00.000Z', dayType:'legs' },

  // ── Leg Press (legs, 100 → 200 kg, 4×10-15) ──────────────────────────────
  { id:'demo-lp-1',  exerciseId:ds('leg-press'), sets:s4(100,15,12,12,10), date:'2025-03-26T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-2',  exerciseId:ds('leg-press'), sets:s4(110,12,12,10,10), date:'2025-04-23T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-3',  exerciseId:ds('leg-press'), sets:s4(120,12,10,10,10), date:'2025-05-21T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-4',  exerciseId:ds('leg-press'), sets:s4(130,12,10,10,10), date:'2025-06-18T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-5',  exerciseId:ds('leg-press'), sets:s4(140,12,10,10,10), date:'2025-07-16T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-6',  exerciseId:ds('leg-press'), sets:s4(150,12,10,10,10), date:'2025-08-13T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-7',  exerciseId:ds('leg-press'), sets:s4(150,15,12,12,12), date:'2025-09-10T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-8',  exerciseId:ds('leg-press'), sets:s4(160,12,12,10,10), date:'2025-10-08T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-9',  exerciseId:ds('leg-press'), sets:s4(165,12,10,10,10), date:'2025-11-05T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-10', exerciseId:ds('leg-press'), sets:s4(170,12,10,10,10), date:'2025-12-03T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-11', exerciseId:ds('leg-press'), sets:s4(175,12,10,10,10), date:'2025-12-31T11:30:00.000Z', dayType:'lower' },
  { id:'demo-lp-12', exerciseId:ds('leg-press'), sets:s4(180,12,10,10,10), date:'2026-01-28T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-13', exerciseId:ds('leg-press'), sets:s4(185,12,10,10,10), date:'2026-02-25T11:30:00.000Z', dayType:'lower' },
  { id:'demo-lp-14', exerciseId:ds('leg-press'), sets:s4(190,12,10,10,10), date:'2026-04-08T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-15', exerciseId:ds('leg-press'), sets:s4(195,12,10,10,10), date:'2026-05-20T11:30:00.000Z', dayType:'legs' },
  { id:'demo-lp-16', exerciseId:ds('leg-press'), sets:s4(200,10,10,10,10), date:'2026-07-01T11:30:00.000Z', dayType:'lower' },
  { id:'demo-lp-17', exerciseId:ds('leg-press'), sets:s4(200,12,10,10,10), date:'2026-08-12T11:30:00.000Z', dayType:'legs' },

  // ── Leg Curl (legs, 40 → 75 kg, 3×10-15) ─────────────────────────────────
  { id:'demo-lc-1',  exerciseId:ds('leg-curl'), sets:s3(40,15,12,12),  date:'2025-03-26T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-2',  exerciseId:ds('leg-curl'), sets:s3(42.5,12,12,10),date:'2025-04-23T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-3',  exerciseId:ds('leg-curl'), sets:s3(45,12,10,10),  date:'2025-05-21T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-4',  exerciseId:ds('leg-curl'), sets:s3(47.5,12,10,10),date:'2025-06-18T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-5',  exerciseId:ds('leg-curl'), sets:s3(50,12,10,10),  date:'2025-07-16T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-6',  exerciseId:ds('leg-curl'), sets:s3(52.5,12,10,10),date:'2025-08-13T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-7',  exerciseId:ds('leg-curl'), sets:s3(55,12,10,10),  date:'2025-09-10T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-8',  exerciseId:ds('leg-curl'), sets:s3(57.5,12,12,10),date:'2025-10-08T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-9',  exerciseId:ds('leg-curl'), sets:s3(60,12,10,10),  date:'2025-11-05T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-10', exerciseId:ds('leg-curl'), sets:s3(62.5,12,10,10),date:'2025-12-03T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-11', exerciseId:ds('leg-curl'), sets:s3(65,12,10,10),  date:'2025-12-31T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-12', exerciseId:ds('leg-curl'), sets:s3(65,12,12,10),  date:'2026-01-28T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-13', exerciseId:ds('leg-curl'), sets:s3(67.5,12,10,10),date:'2026-02-25T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-14', exerciseId:ds('leg-curl'), sets:s3(70,12,10,10),  date:'2026-04-08T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-15', exerciseId:ds('leg-curl'), sets:s3(72.5,12,10,10),date:'2026-05-20T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-16', exerciseId:ds('leg-curl'), sets:s3(75,12,10,10),  date:'2026-07-01T12:00:00.000Z', dayType:'legs' },
  { id:'demo-lc-17', exerciseId:ds('leg-curl'), sets:s3(75,12,12,10),  date:'2026-08-12T12:00:00.000Z', dayType:'legs' },

  // ── Calf Raise (legs, 80 → 150 kg, 4×15-20) ──────────────────────────────
  { id:'demo-cr-1',  exerciseId:ds('calf-raise'), sets:s4(80,20,18,15,15),  date:'2025-03-26T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-2',  exerciseId:ds('calf-raise'), sets:s4(90,15,15,15,15),  date:'2025-04-23T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-3',  exerciseId:ds('calf-raise'), sets:s4(100,15,15,15,15), date:'2025-05-21T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-4',  exerciseId:ds('calf-raise'), sets:s4(105,15,15,15,15), date:'2025-06-18T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-5',  exerciseId:ds('calf-raise'), sets:s4(110,15,15,15,15), date:'2025-07-16T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-6',  exerciseId:ds('calf-raise'), sets:s4(115,15,15,15,15), date:'2025-08-13T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-7',  exerciseId:ds('calf-raise'), sets:s4(120,15,15,15,15), date:'2025-09-10T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-8',  exerciseId:ds('calf-raise'), sets:s4(125,15,15,15,15), date:'2025-10-08T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-9',  exerciseId:ds('calf-raise'), sets:s4(130,15,15,15,15), date:'2025-11-05T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-10', exerciseId:ds('calf-raise'), sets:s4(130,20,15,15,15), date:'2025-12-03T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-11', exerciseId:ds('calf-raise'), sets:s4(135,15,15,15,15), date:'2025-12-31T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-12', exerciseId:ds('calf-raise'), sets:s4(140,15,15,15,15), date:'2026-01-28T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-13', exerciseId:ds('calf-raise'), sets:s4(140,20,15,15,15), date:'2026-02-25T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-14', exerciseId:ds('calf-raise'), sets:s4(145,15,15,15,15), date:'2026-04-08T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-15', exerciseId:ds('calf-raise'), sets:s4(150,15,15,15,15), date:'2026-05-20T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-16', exerciseId:ds('calf-raise'), sets:s4(150,20,15,15,15), date:'2026-07-01T12:20:00.000Z', dayType:'legs' },
  { id:'demo-cr-17', exerciseId:ds('calf-raise'), sets:s4(150,20,15,15,15), date:'2026-08-12T12:20:00.000Z', dayType:'legs' },

  // ── Deadlift (lower, 80 → 150 kg, 3×5) ───────────────────────────────────
  { id:'demo-dl-1',  exerciseId:ds('deadlift'), sets:s3(80,5,5,5),    date:'2025-04-09T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-2',  exerciseId:ds('deadlift'), sets:s3(87.5,5,5,5),  date:'2025-06-04T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-3',  exerciseId:ds('deadlift'), sets:s3(95,5,5,4),    date:'2025-07-02T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-4',  exerciseId:ds('deadlift'), sets:s3(100,5,5,5),   date:'2025-07-30T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-5',  exerciseId:ds('deadlift'), sets:s3(107.5,5,5,4), date:'2025-09-24T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-6',  exerciseId:ds('deadlift'), sets:s3(112.5,5,5,5), date:'2025-11-19T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-7',  exerciseId:ds('deadlift'), sets:s3(120,5,5,4),   date:'2026-01-14T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-8',  exerciseId:ds('deadlift'), sets:s3(125,5,5,5),   date:'2026-03-04T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-9',  exerciseId:ds('deadlift'), sets:s3(132.5,5,4,4), date:'2026-04-22T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-10', exerciseId:ds('deadlift'), sets:s3(137.5,5,5,4), date:'2026-06-10T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-11', exerciseId:ds('deadlift'), sets:s3(142.5,5,4,4), date:'2026-07-22T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-12', exerciseId:ds('deadlift'), sets:s3(147.5,5,4,4), date:'2026-08-05T10:50:00.000Z', dayType:'lower' },
  { id:'demo-dl-13', exerciseId:ds('deadlift'), sets:s3(150,5,4,4),   date:'2026-08-26T10:50:00.000Z', dayType:'lower' },
];

const DEMO_PERSONAL_RECORDS: PersonalRecord[] = [
  { exerciseId: ds('bench-press'),       weight: 90,    reps: 7,  date: '2026-08-24T10:00:00.000Z' },
  { exerciseId: ds('squat'),             weight: 115,   reps: 5,  date: '2026-08-26T10:00:00.000Z' },
  { exerciseId: ds('overhead-press'),    weight: 70,    reps: 5,  date: '2026-08-24T11:00:00.000Z' },
  { exerciseId: ds('barbell-row'),       weight: 87.5,  reps: 6,  date: '2026-08-25T10:00:00.000Z' },
  { exerciseId: ds('incline-bench'),     weight: 77.5,  reps: 7,  date: '2026-08-24T10:45:00.000Z' },
  { exerciseId: ds('lateral-raise'),     weight: 20,    reps: 15, date: '2026-07-27T12:00:00.000Z' },
  { exerciseId: ds('tricep-pushdown'),   weight: 52.5,  reps: 12, date: '2026-08-10T12:15:00.000Z' },
  { exerciseId: ds('pull-up'),           weight: 22.5,  reps: 6,  date: '2026-08-13T10:45:00.000Z' },
  { exerciseId: ds('lat-pulldown'),      weight: 92.5,  reps: 8,  date: '2026-08-13T11:15:00.000Z' },
  { exerciseId: ds('face-pull'),         weight: 40,    reps: 15, date: '2026-08-13T11:45:00.000Z' },
  { exerciseId: ds('barbell-curl'),      weight: 50,    reps: 8,  date: '2026-08-13T12:00:00.000Z' },
  { exerciseId: ds('hammer-curl'),       weight: 28,    reps: 12, date: '2026-08-13T12:15:00.000Z' },
  { exerciseId: ds('romanian-deadlift'), weight: 115,   reps: 8,  date: '2026-08-12T10:50:00.000Z' },
  { exerciseId: ds('leg-press'),         weight: 200,   reps: 12, date: '2026-08-12T11:30:00.000Z' },
  { exerciseId: ds('leg-curl'),          weight: 75,    reps: 12, date: '2026-08-12T12:00:00.000Z' },
  { exerciseId: ds('calf-raise'),        weight: 150,   reps: 20, date: '2026-08-12T12:20:00.000Z' },
  { exerciseId: ds('deadlift'),          weight: 150,   reps: 5,  date: '2026-08-26T10:50:00.000Z' },
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
  finishedDays: Record<string, string>; // dayType → toDateString() of finished date

  addExercise: (exercise: Exercise) => void;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;
  removeWorkout: (id: string) => void;

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
  markDayFinished: (dayType: string) => void;

  syncFromCloud: (userId: string) => Promise<void>;
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
      finishedDays: {},

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

      removeWorkout: (id) => {
        set(state => ({ workoutSets: state.workoutSets.filter(ws => ws.id !== id) }));
        const { workoutSets, personalRecords } = get();
        // Derive userId from the first remaining user set (any non-demo entry)
        const anySet = workoutSets.find(ws => !ws.id.startsWith('demo-'));
        const userId = anySet?.exerciseId.split(':')[0];
        if (userId) {
          const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${userId}:`));
          const userPRs  = personalRecords.filter(pr => pr.exerciseId.startsWith(`${userId}:`));
          pushCloudData(userId, userSets, userPRs);
        }
      },

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
          pushCloudData(
            userId,
            updated.filter(ws => ws.exerciseId.startsWith(`${userId}:`)),
            newPRs.filter(pr => pr.exerciseId.startsWith(`${userId}:`)),
          );
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

      markDayFinished: (dayType) =>
        set(state => ({
          finishedDays: { ...state.finishedDays, [dayType]: new Date().toDateString() },
        })),

      syncFromCloud: async (userId: string) => {
        if (userId === 'demo-user-001') return;
        const cloud = await pullCloudData(userId);
        if (!cloud) {
          // No cloud data yet — push local data up so it's backed up
          const { workoutSets, personalRecords } = get();
          const localSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${userId}:`));
          const localPRs  = personalRecords.filter(pr => pr.exerciseId.startsWith(`${userId}:`));
          if (localSets.length > 0) pushCloudData(userId, localSets, localPRs);
          return;
        }
        set(state => {
          const demoSets = state.workoutSets.filter(ws => ws.id.startsWith('demo-'));
          const localSets = state.workoutSets.filter(ws => ws.exerciseId.startsWith(`${userId}:`));
          const localPRs  = state.personalRecords.filter(pr => pr.exerciseId.startsWith(`${userId}:`));
          const mergedSets = mergeWorkoutSets(localSets, cloud.workoutSets);
          const mergedPRs  = mergePersonalRecords(localPRs, cloud.personalRecords);
          // Push merged result back so cloud stays up to date
          pushCloudData(userId, mergedSets, mergedPRs);
          return {
            workoutSets:     [...demoSets, ...mergedSets],
            personalRecords: mergedPRs,
          };
        });
      },
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
