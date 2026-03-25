import { useState } from 'react';
import { ChevronLeft, Check, Link2 } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { Exercise, DayType } from '../types';

function generateId(): string {
  try { return crypto.randomUUID(); }
  catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

interface Props {
  dayType: DayType;
  onClose: () => void;
}

export default function SupersetModal({ dayType, onClose }: Props) {
  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { exercises, addSuperset } = useWorkoutStore();

  const trainingDay = splits
    .find(s => s.id === activeSplitId)
    ?.days.find(d => d.type === dayType);

  const alreadyGrouped = new Set(
    (trainingDay?.supersets ?? []).flatMap(ss => ss.exerciseIds)
  );

  const available: Exercise[] = (trainingDay?.exerciseIds ?? [])
    .map(id => exercises.find(e => e.id === id))
    .filter((e): e is Exercise => !!e);

  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );

  const handleCreate = () => {
    if (selected.length < 2) return;
    // Preserve Day order
    const ordered = (trainingDay?.exerciseIds ?? []).filter(id => selected.includes(id));
    addSuperset(dayType, { id: generateId(), exerciseIds: ordered });
    onClose();
  };

  const freeExercises = available.filter(e => !alreadyGrouped.has(e.id));

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
          >
            <ChevronLeft size={16} className="text-[#fafafa]" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-semibold tracking-tight text-[#fafafa] uppercase">
            Create Superset
          </h1>
          <div className="w-10" />
        </div>
        <p className="text-center text-sm text-[#737373]">Select 2 or more exercises</p>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {freeExercises.length === 0 ? (
          <div className="text-center py-16">
            <Link2 size={28} className="text-[#525252] mx-auto mb-3" />
            <p className="text-[#737373] font-medium text-sm">All exercises are already in a superset.</p>
            <p className="text-[#525252] text-xs mt-1">Remove an existing superset first.</p>
          </div>
        ) : (
          freeExercises.map(exercise => {
            const isSelected = selected.includes(exercise.id);
            return (
              <button
                key={exercise.id}
                onClick={() => toggle(exercise.id)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all active:scale-[0.98] ${
                  isSelected ? 'bg-[#2a2a2a] border border-[#fd9a00]/40' : 'bg-[#262626]'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-[#fd9a00]' : 'bg-[#404040]'
                }`}>
                  {isSelected && <Check size={14} className="text-[#0a0a0a]" strokeWidth={3} />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-[#fafafa] uppercase tracking-wide text-sm">{exercise.name}</p>
                  <p className="text-xs text-[#737373] mt-0.5">{exercise.muscleGroups.join(' · ')}</p>
                </div>
              </button>
            );
          })
        )}

        {/* Exercises already in supersets (disabled, informational) */}
        {available.filter(e => alreadyGrouped.has(e.id)).map(exercise => (
          <div
            key={exercise.id}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#1c1c1c] opacity-50"
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#333]">
              <Link2 size={12} className="text-[#737373]" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-[#737373] uppercase tracking-wide text-sm">{exercise.name}</p>
              <p className="text-xs text-[#525252] mt-0.5">Already in a superset</p>
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="px-4 py-6">
        <button
          onClick={handleCreate}
          disabled={selected.length < 2}
          className="w-full py-3 rounded-full font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-40 bg-[#fd9a00] text-[#0a0a0a]"
        >
          {selected.length < 2
            ? `Select ${2 - selected.length} more`
            : `Create Superset · ${selected.length} exercises`}
        </button>
      </div>
    </div>
  );
}
