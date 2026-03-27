import { Exercise, DayType } from '../types';

export const DEFAULT_EXERCISES: Exercise[] = [
  // PUSH
  { id: 'bench-press',    name: 'Bench Press',           equipment: 'barbell',    muscleGroups: ['Chest', 'Triceps', 'Front Deltoid'],         suggestedDays: ['push', 'upper'] },
  { id: 'incline-bench',  name: 'Incline Bench Press',   equipment: 'barbell',    muscleGroups: ['Upper Chest', 'Triceps', 'Front Deltoid'],    suggestedDays: ['push', 'upper'] },
  { id: 'overhead-press', name: 'Overhead Press',        equipment: 'barbell',    muscleGroups: ['Shoulders', 'Triceps'],                      suggestedDays: ['push', 'upper'] },
  { id: 'dumbbell-press', name: 'Dumbbell Press',        equipment: 'dumbbell',   muscleGroups: ['Chest', 'Triceps'],                          suggestedDays: ['push', 'upper'] },
  { id: 'lateral-raise',  name: 'Lateral Raise',         equipment: 'dumbbell',   muscleGroups: ['Side Deltoid'],                              suggestedDays: ['push', 'upper'] },
  { id: 'tricep-pushdown',name: 'Tricep Pushdown',       equipment: 'cable',      muscleGroups: ['Triceps'],                                   suggestedDays: ['push', 'upper'] },
  { id: 'skull-crusher',  name: 'Skull Crusher',         equipment: 'barbell',    muscleGroups: ['Triceps'],                                   suggestedDays: ['push'] },
  { id: 'cable-fly',      name: 'Cable Fly',             equipment: 'cable',      muscleGroups: ['Chest'],                                     suggestedDays: ['push', 'upper'] },
  { id: 'dips',           name: 'Dips',                  equipment: 'bodyweight', muscleGroups: ['Chest', 'Triceps', 'Shoulders'],             suggestedDays: ['push'] },
  { id: 'front-raise',    name: 'Front Raise',           equipment: 'dumbbell',   muscleGroups: ['Front Deltoid'],                             suggestedDays: ['push'] },
  // PULL
  { id: 'deadlift',            name: 'Deadlift',              equipment: 'barbell',    muscleGroups: ['Back', 'Hamstrings', 'Glutes'],               suggestedDays: ['pull', 'lower'] },
  { id: 'pull-up',             name: 'Pull-up',               equipment: 'bodyweight', muscleGroups: ['Back', 'Biceps'],                             suggestedDays: ['pull', 'upper'] },
  { id: 'barbell-row',         name: 'Barbell Row',           equipment: 'barbell',    muscleGroups: ['Back', 'Biceps'],                             suggestedDays: ['pull', 'upper'] },
  { id: 'lat-pulldown',        name: 'Lat Pulldown',          equipment: 'cable',      muscleGroups: ['Back', 'Biceps'],                             suggestedDays: ['pull', 'upper'] },
  { id: 'seated-row',          name: 'Seated Cable Row',      equipment: 'cable',      muscleGroups: ['Back', 'Biceps'],                             suggestedDays: ['pull', 'upper'] },
  { id: 'face-pull',           name: 'Face Pull',             equipment: 'cable',      muscleGroups: ['Rear Deltoid', 'Traps'],                      suggestedDays: ['pull', 'upper'] },
  { id: 'barbell-curl',        name: 'Barbell Curl',          equipment: 'barbell',    muscleGroups: ['Biceps'],                                     suggestedDays: ['pull', 'upper'] },
  { id: 'hammer-curl',         name: 'Hammer Curl',           equipment: 'dumbbell',   muscleGroups: ['Biceps', 'Brachialis'],                       suggestedDays: ['pull', 'upper'] },
  { id: 'incline-curl',        name: 'Incline Dumbbell Curl', equipment: 'dumbbell',   muscleGroups: ['Biceps'],                                     suggestedDays: ['pull'] },
  { id: 'chest-supported-row', name: 'Chest Supported Row',  equipment: 'machine',    muscleGroups: ['Back'],                                       suggestedDays: ['pull', 'upper'] },
  // LEGS
  { id: 'squat',            name: 'Squat',                equipment: 'barbell',    muscleGroups: ['Quads', 'Glutes', 'Hamstrings'],             suggestedDays: ['legs', 'lower'] },
  { id: 'leg-press',        name: 'Leg Press',            equipment: 'machine',    muscleGroups: ['Quads', 'Glutes'],                           suggestedDays: ['legs', 'lower'] },
  { id: 'romanian-deadlift',name: 'Romanian Deadlift',    equipment: 'barbell',    muscleGroups: ['Hamstrings', 'Glutes'],                      suggestedDays: ['legs', 'lower'] },
  { id: 'leg-curl',         name: 'Leg Curl',             equipment: 'machine',    muscleGroups: ['Hamstrings'],                                suggestedDays: ['legs', 'lower'] },
  { id: 'leg-extension',    name: 'Leg Extension',        equipment: 'machine',    muscleGroups: ['Quads'],                                     suggestedDays: ['legs', 'lower'] },
  { id: 'walking-lunge',    name: 'Walking Lunge',        equipment: 'dumbbell',   muscleGroups: ['Quads', 'Glutes'],                           suggestedDays: ['legs', 'lower'] },
  { id: 'hip-thrust',       name: 'Hip Thrust',           equipment: 'barbell',    muscleGroups: ['Glutes', 'Hamstrings'],                      suggestedDays: ['legs', 'lower'] },
  { id: 'calf-raise',       name: 'Calf Raise',           equipment: 'machine',    muscleGroups: ['Calves'],                                    suggestedDays: ['legs', 'lower'] },
  { id: 'bulgarian-split',  name: 'Bulgarian Split Squat',equipment: 'dumbbell',   muscleGroups: ['Quads', 'Glutes'],                           suggestedDays: ['legs', 'lower'] },
  { id: 'hack-squat',       name: 'Hack Squat',           equipment: 'machine',    muscleGroups: ['Quads'],                                     suggestedDays: ['legs', 'lower'] },
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
