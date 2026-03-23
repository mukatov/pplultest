import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
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
  const [tab, setTab] = useState<'new' | 'existing'>('existing');

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

  const allExercises = [
    ...DEFAULT_EXERCISES,
    ...exercises.filter(e => !DEFAULT_EXERCISES.find(d => d.id === e.id)),
  ].filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Exercise to Session</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['existing', 'new'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'existing' ? 'From Library' : 'Create New'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'existing' ? (
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
              />
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {allExercises.map(exercise => {
                  const inStore = exercises.some(e => e.id === exercise.id);
                  return (
                    <button
                      key={exercise.id}
                      onClick={() => {
                        if (!inStore) addExercise(exercise);
                        onAdd(exercise);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 border border-gray-200 cursor-pointer transition-all text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{exercise.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{exercise.muscleGroups.join(', ')}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {exercise.suggestedDays.map(d => (
                          <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">{d}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Exercise Name</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Incline Dumbbell Press"
                  className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Muscle Groups</label>
                <input
                  type="text"
                  value={muscles}
                  onChange={e => setMuscles(e.target.value)}
                  placeholder="e.g. Chest, Triceps (comma separated)"
                  className="mt-1.5 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-medium">Training Days</label>
                  {suggested.length > 0 && name.length > 2 && (
                    <span className="flex items-center gap-1 text-xs text-indigo-500">
                      <Sparkles size={11} /> Suggested
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
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
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
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
              >
                Create & Add to Session
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
