import { useState } from 'react';
import { X, Check, Search } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 capitalize">{dayType} Day — Edit Exercises</h2>
            <p className="text-xs text-gray-400 mt-0.5">{selected.length} exercises selected</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {filtered.map(exercise => {
              const isSelected = selected.includes(exercise.id);
              const suggested = exercise.suggestedDays.includes(dayType);
              return (
                <button
                  key={exercise.id}
                  onClick={() => toggle(exercise.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
                    isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{exercise.name}</p>
                    <p className="text-xs text-gray-500 truncate">{exercise.muscleGroups.join(', ')}</p>
                  </div>
                  {suggested && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex-shrink-0">
                      Suggested
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
