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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#262626] flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-base font-semibold text-[#fafafa]">{dayLabel} Day</p>
          <p className="text-xs text-[#a3a3a3]">{selected.length} exercises selected</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-semibold transition-colors flex-shrink-0"
        >
          Save
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#525252]" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-[#262626] border border-[#404040] rounded-full pl-10 pr-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#a3a3a3] transition-colors"
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
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-full border transition-all text-left active:scale-[0.98] ${
                isSelected
                  ? 'bg-[#f5f5f5] border-[#f5f5f5]'
                  : 'bg-[#262626] border-[#404040] hover:bg-[#2a2a2a]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                isSelected ? 'bg-[#0a0a0a] border-[#0a0a0a]' : 'border-[#525252] bg-transparent'
              }`}>
                {isSelected && <Check size={12} className="text-[#fafafa]" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isSelected ? 'text-[#0a0a0a]' : 'text-[#fafafa]'}`}>
                  {exercise.name}
                </p>
                <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-[#525252]' : 'text-[#a3a3a3]'}`}>
                  {exercise.muscleGroups.join(' · ')}
                </p>
              </div>
              {isSuggested && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  isSelected ? 'bg-[#262626] text-[#a3a3a3]' : 'bg-[#404040] text-[#a3a3a3]'
                }`}>
                  Suggested
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom save */}
      <div className="px-4 py-4 flex-shrink-0">
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
