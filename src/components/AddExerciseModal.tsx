import { useState } from 'react';
import { ArrowLeft, Sparkles, ChevronDown } from 'lucide-react';
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
  dayType: DayType;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
}

export default function AddExerciseModal({ dayType, onClose, onAdd }: Props) {
  const { exercises, addExercise } = useWorkoutStore();
  const [name, setName] = useState('');
  const [muscles, setMuscles] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayType[]>([dayType]);
  const [suggested, setSuggested] = useState<DayType[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'library' | 'new'>('library');
  const [showAll, setShowAll] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.length > 2) {
      const s = suggestDays(val);
      setSuggested(s);
      setSelectedDays(s.length ? s : [dayType]);
    }
  };

  const toggleDay = (day: DayType) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleCreate = () => {
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
  ];

  const forThisDay = allExercises.filter(e =>
    e.suggestedDays.includes(dayType) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );
  const others = allExercises.filter(e =>
    !e.suggestedDays.includes(dayType) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-base font-bold text-gray-900 leading-tight">Add Exercise</h1>
          <p className="text-xs text-gray-400">{dayLabel} session</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 flex flex-shrink-0">
        <button
          onClick={() => setTab('library')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'library' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
          }`}
        >
          From Library
        </button>
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'new' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'
          }`}
        >
          Create New
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'library' ? (
          <div className="px-4 py-4 space-y-4">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
            />

            {/* Exercises for this day */}
            {forThisDay.length > 0 && (
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider px-1 mb-2">
                  {dayLabel} exercises
                </p>
                <div className="space-y-2">
                  {forThisDay.map(exercise => (
                    <button
                      key={exercise.id}
                      onClick={() => {
                        if (!exercises.some(e => e.id === exercise.id)) addExercise(exercise);
                        onAdd(exercise);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm active:scale-[0.98] hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{exercise.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{exercise.muscleGroups.join(' · ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other exercises */}
            {others.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2 hover:text-gray-600 transition-colors"
                >
                  Other exercises
                  <ChevronDown size={13} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
                {showAll && (
                  <div className="space-y-2">
                    {others.map(exercise => (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          if (!exercises.some(e => e.id === exercise.id)) addExercise(exercise);
                          onAdd(exercise);
                          onClose();
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm active:scale-[0.98] hover:border-gray-300 transition-all text-left"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{exercise.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{exercise.muscleGroups.join(' · ')}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {exercise.suggestedDays.map(d => (
                            <span key={d} className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">{d}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {forThisDay.length === 0 && others.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-16">No exercises found</p>
            )}
          </div>
        ) : (
          <div className="px-4 py-6 space-y-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exercise Name</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Incline Dumbbell Press"
                className="mt-2 w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Muscle Groups</label>
              <input
                type="text"
                value={muscles}
                onChange={e => setMuscles(e.target.value)}
                placeholder="e.g. Chest, Triceps (comma separated)"
                className="mt-2 w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Training Days</label>
                {suggested.length > 0 && name.length > 2 && (
                  <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                    <Sparkles size={11} /> Suggested
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {ALL_DAYS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => toggleDay(type)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                      selectedDays.includes(type)
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-base font-bold text-white transition-colors shadow-sm mt-2"
            >
              Create & Add to Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
