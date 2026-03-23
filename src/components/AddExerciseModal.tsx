import { useState } from 'react';
import { ChevronLeft, Sparkles, ChevronDown } from 'lucide-react';
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
          <p className="text-base font-semibold text-[#fafafa]">Add Exercise</p>
          <p className="text-xs text-[#a3a3a3]">{dayLabel} session</p>
        </div>
        <div className="w-10 h-10 flex-shrink-0" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#262626] flex-shrink-0 mx-4">
        <button
          onClick={() => setTab('library')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'library'
              ? 'text-[#fafafa] border-b-2 border-[#fafafa]'
              : 'text-[#525252]'
          }`}
        >
          From Library
        </button>
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'new'
              ? 'text-[#fafafa] border-b-2 border-[#fafafa]'
              : 'text-[#525252]'
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
              className="w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#a3a3a3] transition-colors"
            />

            {forThisDay.length > 0 && (
              <div>
                <p className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3] px-1 mb-2">
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
                      className="w-full flex items-center justify-center py-6 rounded-full bg-[#262626] border border-[#404040] hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <p className="font-semibold text-[#fafafa] uppercase text-[1.25rem] tracking-[0]">{exercise.name}</p>
                        <p className="text-xs text-[#a3a3a3]">{exercise.muscleGroups.join(' · ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div>
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex items-center gap-1.5 text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#525252] px-1 mb-2 hover:text-[#a3a3a3] transition-colors"
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
                        className="w-full flex items-center justify-between py-5 px-5 rounded-full bg-[#262626] border border-[#404040] hover:bg-[#2a2a2a] active:scale-[0.98] transition-all"
                      >
                        <div className="text-left">
                          <p className="font-semibold text-[#fafafa]">{exercise.name}</p>
                          <p className="text-xs text-[#a3a3a3] mt-0.5">{exercise.muscleGroups.join(' · ')}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          {exercise.suggestedDays.map(d => (
                            <span key={d} className="text-xs px-1.5 py-0.5 rounded-md bg-[#404040] text-[#a3a3a3]">{d}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {forThisDay.length === 0 && others.length === 0 && (
              <p className="text-center text-[#525252] text-sm py-16">No exercises found</p>
            )}
          </div>
        ) : (
          <div className="px-4 py-6 space-y-5">
            <div>
              <label className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">
                Exercise Name
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Incline Dumbbell Press"
                className="mt-2 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#a3a3a3] transition-colors"
              />
            </div>

            <div>
              <label className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">
                Muscle Groups
              </label>
              <input
                type="text"
                value={muscles}
                onChange={e => setMuscles(e.target.value)}
                placeholder="e.g. Chest, Triceps (comma separated)"
                className="mt-2 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#a3a3a3] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">
                  Training Days
                </label>
                {suggested.length > 0 && name.length > 2 && (
                  <span className="flex items-center gap-1 text-xs text-[#fafafa] font-medium">
                    <Sparkles size={11} /> Suggested
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {ALL_DAYS.map(({ type, label }) => (
                  <button
                    key={type}
                    onClick={() => toggleDay(type)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                      selectedDays.includes(type)
                        ? 'bg-[#f5f5f5] border-[#f5f5f5] text-[#0a0a0a]'
                        : 'bg-transparent border-[#404040] text-[#a3a3a3] hover:border-[#fafafa]'
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
              className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-base font-medium text-[#0a0a0a] transition-colors"
            >
              Create & Add to Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
