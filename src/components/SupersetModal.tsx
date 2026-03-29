import { useState } from 'react';
import { ChevronLeft, Check, Link2, Search } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { Exercise, DayType } from '../types';
import { useT } from '../hooks/useT';

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
  const t = useT();
  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { exercises, addSuperset, updateDayExercises } = useWorkoutStore();

  const trainingDay = splits
    .find(s => s.id === activeSplitId)
    ?.days.find(d => d.type === dayType);

  const inDay = new Set(trainingDay?.exerciseIds ?? []);
  const alreadyGrouped = new Set(
    (trainingDay?.supersets ?? []).flatMap(ss => ss.exerciseIds)
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const toggle = (id: string) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );

  const handleCreate = () => {
    if (selected.length < 2) return;
    const existingOrder = (trainingDay?.exerciseIds ?? []).filter(id => selected.includes(id));
    const newOnes = selected.filter(id => !inDay.has(id));
    const ordered = [...existingOrder, ...newOnes];

    if (newOnes.length > 0) {
      updateDayExercises(dayType, [...(trainingDay?.exerciseIds ?? []), ...newOnes]);
    }
    addSuperset(dayType, { id: generateId(), exerciseIds: ordered });
    onClose();
  };

  const q = search.toLowerCase();
  const filtered = exercises.filter(e => e.name.toLowerCase().includes(q));

  const inDayFree    = filtered.filter(e => inDay.has(e.id) && !alreadyGrouped.has(e.id));
  const inDayGrouped = filtered.filter(e => inDay.has(e.id) && alreadyGrouped.has(e.id));
  const notInDay     = filtered.filter(e => !inDay.has(e.id));

  function ExRow({ exercise, disabled, subtitle }: { exercise: Exercise; disabled?: boolean; subtitle?: string }) {
    const t = useT();
    const isSelected = selected.includes(exercise.id);
    if (disabled) {
      return (
        <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#1c1c1c] opacity-50">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#333]">
            <Link2 size={12} className="text-[#737373]" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-[#737373] uppercase tracking-wide text-sm">{exercise.name}</p>
            <p className="text-xs text-[#525252] mt-0.5">{subtitle ?? t.alreadyInSuperset}</p>
          </div>
        </div>
      );
    }
    return (
      <button
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
          <p className="text-xs text-[#737373] mt-0.5">
            {subtitle ? <span className="text-[#fd9a00]">{subtitle} · </span> : null}
            {exercise.muscleGroups.join(' · ')}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
          >
            <ChevronLeft size={16} className="text-[#fafafa]" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-semibold tracking-tight text-[#fafafa] uppercase">
            {t.createSuperset}
          </h1>
          <div className="w-10" />
        </div>
        <p className="text-center text-sm text-[#737373] mb-3">{t.select2orMore}</p>

        {/* Search */}
        <div className="flex items-center gap-2 bg-[#262626] rounded-xl px-3 py-2.5">
          <Search size={14} className="text-[#525252] flex-shrink-0" />
          <input
            type="text"
            placeholder={t.searchExercises}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#fafafa] placeholder:text-[#525252] outline-none"
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {/* In this day */}
        {inDayFree.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-[#525252] uppercase tracking-[2px] px-1 pt-1">{t.inThisDay}</p>
            {inDayFree.map(e => <ExRow key={e.id} exercise={e} />)}
          </>
        )}

        {/* Other exercises */}
        {notInDay.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-[#525252] uppercase tracking-[2px] px-1 pt-2">{t.allExercises}</p>
            {notInDay.map(e => <ExRow key={e.id} exercise={e} subtitle={t.addsToDay} />)}
          </>
        )}

        {/* Already in a superset */}
        {inDayGrouped.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-[#525252] uppercase tracking-[2px] px-1 pt-2">{t.alreadyGrouped}</p>
            {inDayGrouped.map(e => <ExRow key={e.id} exercise={e} disabled />)}
          </>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-[#525252] text-sm py-12">{t.noExercisesFound}</p>
        )}
      </div>

      {/* Save button */}
      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={handleCreate}
          disabled={selected.length < 2}
          className="w-full py-3 rounded-full font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-40 bg-[#fd9a00] text-[#0a0a0a]"
        >
          {selected.length < 2
            ? t.selectMore(2 - selected.length)
            : t.createSupersetWith(selected.length)}
        </button>
      </div>
    </div>
  );
}
