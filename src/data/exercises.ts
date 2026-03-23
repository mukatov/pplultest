import { Exercise, DayType } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // PUSH
  { id: 'bench-press', name: 'Bench Press', muscleGroups: ['Chest', 'Triceps', 'Front Deltoid'], suggestedDays: ['push', 'upper'] },
  { id: 'incline-bench', name: 'Incline Bench Press', muscleGroups: ['Upper Chest', 'Triceps', 'Front Deltoid'], suggestedDays: ['push', 'upper'] },
  { id: 'overhead-press', name: 'Overhead Press', muscleGroups: ['Shoulders', 'Triceps'], suggestedDays: ['push', 'upper'] },
  { id: 'dumbbell-press', name: 'Dumbbell Press', muscleGroups: ['Chest', 'Triceps'], suggestedDays: ['push', 'upper'] },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroups: ['Side Deltoid'], suggestedDays: ['push', 'upper'] },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroups: ['Triceps'], suggestedDays: ['push', 'upper'] },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroups: ['Triceps'], suggestedDays: ['push'] },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroups: ['Chest'], suggestedDays: ['push', 'upper'] },
  { id: 'dips', name: 'Dips', muscleGroups: ['Chest', 'Triceps', 'Shoulders'], suggestedDays: ['push'] },
  { id: 'front-raise', name: 'Front Raise', muscleGroups: ['Front Deltoid'], suggestedDays: ['push'] },
  // PULL
  { id: 'deadlift', name: 'Deadlift', muscleGroups: ['Back', 'Hamstrings', 'Glutes'], suggestedDays: ['pull', 'lower'] },
  { id: 'pull-up', name: 'Pull-up', muscleGroups: ['Back', 'Biceps'], suggestedDays: ['pull', 'upper'] },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroups: ['Back', 'Biceps'], suggestedDays: ['pull', 'upper'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroups: ['Back', 'Biceps'], suggestedDays: ['pull', 'upper'] },
  { id: 'seated-row', name: 'Seated Cable Row', muscleGroups: ['Back', 'Biceps'], suggestedDays: ['pull', 'upper'] },
  { id: 'face-pull', name: 'Face Pull', muscleGroups: ['Rear Deltoid', 'Traps'], suggestedDays: ['pull', 'upper'] },
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroups: ['Biceps'], suggestedDays: ['pull', 'upper'] },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroups: ['Biceps', 'Brachialis'], suggestedDays: ['pull', 'upper'] },
  { id: 'incline-curl', name: 'Incline Dumbbell Curl', muscleGroups: ['Biceps'], suggestedDays: ['pull'] },
  { id: 'chest-supported-row', name: 'Chest Supported Row', muscleGroups: ['Back'], suggestedDays: ['pull', 'upper'] },
  // LEGS
  { id: 'squat', name: 'Squat', muscleGroups: ['Quads', 'Glutes', 'Hamstrings'], suggestedDays: ['legs', 'lower'] },
  { id: 'leg-press', name: 'Leg Press', muscleGroups: ['Quads', 'Glutes'], suggestedDays: ['legs', 'lower'] },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroups: ['Hamstrings', 'Glutes'], suggestedDays: ['legs', 'lower'] },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroups: ['Hamstrings'], suggestedDays: ['legs', 'lower'] },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroups: ['Quads'], suggestedDays: ['legs', 'lower'] },
  { id: 'walking-lunge', name: 'Walking Lunge', muscleGroups: ['Quads', 'Glutes'], suggestedDays: ['legs', 'lower'] },
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroups: ['Glutes', 'Hamstrings'], suggestedDays: ['legs', 'lower'] },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroups: ['Calves'], suggestedDays: ['legs', 'lower'] },
  { id: 'bulgarian-split', name: 'Bulgarian Split Squat', muscleGroups: ['Quads', 'Glutes'], suggestedDays: ['legs', 'lower'] },
  { id: 'hack-squat', name: 'Hack Squat', muscleGroups: ['Quads'], suggestedDays: ['legs', 'lower'] },
];

export function suggestDays(exerciseName: string): DayType[] {
  const name = exerciseName.toLowerCase();
  const suggestions: DayType[] = [];

  if (/press|fly|dip|push|pec|chest|tricep|delt|shoulder|lateral|front raise/.test(name)) {
    suggestions.push('push');
  }
  if (/row|pull|chin|curl|deadlift|lat|back|rear|face pull|bicep|rhomboid|trap/.test(name)) {
    suggestions.push('pull');
  }
  if (/squat|lunge|leg|quad|hamstring|glute|calf|hip thrust|rdl|hack/.test(name)) {
    suggestions.push('legs');
  }
  if (/press|row|pull|chin|curl|delt|shoulder|chest|back|tricep|bicep/.test(name)) {
    if (!suggestions.includes('upper')) suggestions.push('upper');
  }
  if (/squat|leg|quad|hamstring|glute|calf|hip|rdl|deadlift/.test(name)) {
    if (!suggestions.includes('lower')) suggestions.push('lower');
  }

  return suggestions.length > 0 ? suggestions : ['push', 'pull', 'legs', 'upper', 'lower'];
}
