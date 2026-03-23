import { useState } from 'react';
import { ArrowLeft, Check, Search } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col screen-enter">
      {/* Nav bar */}
      <div className="bg-white border-b border-gray-100 px-4 flex items-center gap-3 h-14 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-bold text-gray-900 leading-tight">{dayLabel} Day</h1>
          <p className="text-xs text-gray-400">{selected.length} exercises selected</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
        >
          Save
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {filtered.map(exercise => {
          const isSelected = selected.includes(exercise.id);
          const isSuggested = exercise.suggestedDays.includes(dayType);
          return (
            <button
              key={exercise.id}
              onClick={() => toggle(exercise.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left active:scale-[0.98] ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
              }`}>
                {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{exercise.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{exercise.muscleGroups.join(' · ')}</p>
              </div>
              {isSuggested && (
                <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium flex-shrink-0">
                  Suggested
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom save button */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold transition-colors shadow-sm"
        >
          Save Changes · {selected.length} exercises
        </button>
      </div>
    </div>
  );
}
