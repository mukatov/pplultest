import { useState } from 'react';
import { ChevronLeft, Check, Search } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { DayType } from '../types';

interface Props {
  dayType: DayType;
  onClose: () => void;
}

export default function EditDayModal({ dayType, onClose }: Props) {
  const { exercises, trainingDays, updateDayExercises } = useWorkoutStore();
  const day = trainingDays.find(d => d.type === dayType)!;
  const [selected, setSelected] = useState<string[]>([...day.exerciseIds]);
  const [search, setSearch] = useState('');

  const filtered = exercises.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.muscleGroups.some(m => m.toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSave = () => {
    updateDayExercises(dayType, selected);
    onClose();
  };

  const dayLabel = dayType.charAt(0).toUpperCase() + dayType.slice(1);

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col screen-enter">
      {/* Nav bar */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-[#fafafa] leading-tight uppercase">{dayLabel} Day</h1>
          <p className="text-xs text-[#737373]">{selected.length} exercises selected</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors"
        >
          Save
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737373]" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-[#262626] border border-[#404040] rounded-xl pl-9 pr-3 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {filtered.map(exercise => {
          const isSelected = selected.includes(exercise.id);
          const isSuggested = exercise.suggestedDays.includes(dayType);
          return (
            <button
              key={exercise.id}
              onClick={() => toggle(exercise.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left active:scale-[0.98] ${
                isSelected
                  ? 'bg-[#262626] border-[#737373]'
                  : 'bg-[#262626] border-[#404040] hover:border-[#525252]'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                isSelected ? 'bg-[#fafafa] border-[#fafafa]' : 'border-[#525252] bg-transparent'
              }`}>
                {isSelected && <Check size={13} className="text-[#0a0a0a]" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#fafafa] uppercase text-sm">{exercise.name}</p>
                <p className="text-xs text-[#737373] mt-0.5 truncate">{exercise.muscleGroups.join(' · ')}</p>
              </div>
              {isSuggested && (
                <span className="text-xs px-2 py-1 rounded-lg bg-[#171717] text-[#737373] border border-[#404040] font-medium flex-shrink-0">
                  Suggested
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom save button */}
      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-base font-medium transition-colors"
        >
          Save Changes · {selected.length} exercises
        </button>
      </div>
    </div>
  );
}
