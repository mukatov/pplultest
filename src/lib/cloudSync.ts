import { supabase } from './supabase';
import type { WorkoutSet, PersonalRecord } from '../types';

const TABLE    = 'user_workout_data';
const DEMO_UID = 'demo-user-001';

function canSync(userId: string) {
  return !!userId && userId !== DEMO_UID;
}

// ─── Pull ─────────────────────────────────────────────────────────────────────

export async function pullCloudData(userId: string): Promise<{
  workoutSets: WorkoutSet[];
  personalRecords: PersonalRecord[];
} | null> {
  if (!canSync(userId)) return null;
  const { data } = await supabase
    .from(TABLE)
    .select('workout_sets, personal_records')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  return {
    workoutSets:     (data.workout_sets     ?? []) as WorkoutSet[],
    personalRecords: (data.personal_records ?? []) as PersonalRecord[],
  };
}

// ─── Push ─────────────────────────────────────────────────────────────────────

export function pushCloudData(
  userId: string,
  workoutSets: WorkoutSet[],
  personalRecords: PersonalRecord[],
) {
  if (!canSync(userId)) return;
  // fire-and-forget — never block UI
  supabase.from(TABLE).upsert({
    user_id:          userId,
    workout_sets:     workoutSets,
    personal_records: personalRecords,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id' }).then();
}

// ─── Merge helpers ────────────────────────────────────────────────────────────
// Cloud wins for duplicate IDs; local-only entries are preserved.

export function mergeWorkoutSets(local: WorkoutSet[], cloud: WorkoutSet[]): WorkoutSet[] {
  const m = new Map<string, WorkoutSet>();
  for (const ws of cloud)  m.set(ws.id, ws);
  for (const ws of local)  if (!m.has(ws.id)) m.set(ws.id, ws);
  return Array.from(m.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function mergePersonalRecords(local: PersonalRecord[], cloud: PersonalRecord[]): PersonalRecord[] {
  const m = new Map<string, PersonalRecord>();
  for (const pr of cloud) m.set(pr.exerciseId, pr);
  for (const pr of local) if (!m.has(pr.exerciseId)) m.set(pr.exerciseId, pr);
  return Array.from(m.values());
}
