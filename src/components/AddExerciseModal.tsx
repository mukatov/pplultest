import { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { DayType, Exercise } from '../types';
import { suggestDays, DEFAULT_EXERCISES } from '../data/exercises';

const ALL_DAYS: { type: DayType; label: string }[] = [
  { type: 'push', label: 'Push' },
  { type: 'pull', label: 'Pull' },
  { type: 'legs', label: 'Legs' },
  { type: 'upper', label: 'Upper' },
  { type: 'lower', label: 'Lower' },
];

interface Props {
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

export default function AddExerciseModal({ onClose, onAdd }: Props) {
  const { exercises, addExercise } = useWorkoutStore();
  const [name, setName] = useState('');
  const [muscles, setMuscles] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayType[]>([]);
  const [suggested, setSuggested] = useState<DayType[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'new' | 'existing'>('new');

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.length > 2) {
      const s = suggestDays(val);
      setSuggested(s);
      setSelectedDays(s);
    }
  };

  const toggleDay = (day: DayType) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAdd = () => {
    if (!name.trim()) return;
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      name: name.trim(),
      muscleGroups: muscles.split(',').map(m => m.trim()).filter(Boolean),
      suggestedDays: selectedDays,
    };
    addExercise(exercise);
    onAdd(exercise);
    onClose();
  };

  const filteredExisting = [...DEFAULT_EXERCISES, ...exercises.filter(e => !DEFAULT_EXERCISES.find(d => d.id === e.id))]
    .filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Add Exercise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['new', 'existing'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'new' ? 'New Exercise' : 'From Library'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'new' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Exercise Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Incline Dumbbell Press"
                  className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider">Muscle Groups</label>
                <input
                  type="text"
                  value={muscles}
                  onChange={e => setMuscles(e.target.value)}
                  placeholder="e.g. Chest, Triceps (comma separated)"
                  className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Training Days</label>
                  {suggested.length > 0 && name.length > 2 && (
                    <span className="flex items-center gap-1 text-xs text-indigo-400">
                      <Sparkles size={11} /> AI suggested
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {ALL_DAYS.map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => toggleDay(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        selectedDays.includes(type)
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!name.trim()}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                Add Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {filteredExisting.map(exercise => {
                  const already = exercises.some(e => e.id === exercise.id);
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => { if (!already) { onAdd(exercise); onClose(); } }}
                      className={`w-full flex items-center justify-between p-3 rounded-lg transition-all text-left ${
                        already
                          ? 'bg-gray-800/50 opacity-50 cursor-default'
                          : 'bg-gray-800 hover:bg-gray-750 hover:border-indigo-500/50 border border-gray-700 cursor-pointer'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{exercise.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{exercise.muscleGroups.join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {exercise.suggestedDays.map(d => (
                            <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">{d}</span>
                          ))}
                        </div>
                        {already && <Check size={14} className="text-green-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
