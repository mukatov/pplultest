import { useState } from 'react';
import { ChevronLeft, Plus, X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { Split, Day } from '../types';
import { DEFAULT_EXERCISES } from '../data/exercises';

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

interface DayDraft {
  label: string;
  exerciseIds: string[];
}

const EMPTY_DAY: DayDraft = { label: '', exerciseIds: [] };

// All muscle groups from default exercises (for filter chips)
const ALL_MUSCLES = Array.from(
  new Set(DEFAULT_EXERCISES.flatMap(e => e.muscleGroups))
).sort();

export default function CreateSplitPage() {
  const navigate = useNavigate();
  const { exercises, addSplit, setActiveSplit } = useWorkoutStore();
  const allExercises = [
    ...DEFAULT_EXERCISES,
    ...exercises.filter(e => !DEFAULT_EXERCISES.find(d => d.id === e.id)),
  ];

  const [splitName, setSplitName] = useState('');
  const [days, setDays] = useState<DayDraft[]>([{ ...EMPTY_DAY }]);
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [exSearch, setExSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);

  const handleCreate = () => {
    setError('');
    if (!splitName.trim()) { setError('Split name is required'); return; }
    if (days.length === 0) { setError('Add at least one day'); return; }
    if (days.some(d => !d.label.trim())) { setError('All days need a name'); return; }

    const newSplit: Split = {
      id: generateId(),
      name: splitName.trim(),
      isBuiltIn: false,
      days: days.map(d => ({
        type: d.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        label: d.label.trim(),
        color: 'indigo',
        exerciseIds: d.exerciseIds,
      } as Day)),
    };
    addSplit(newSplit);
    setActiveSplit(newSplit.id);
    navigate('/settings');
  };

  const updateDay = (idx: number, patch: Partial<DayDraft>) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  const removeDay = (idx: number) => {
    setDays(prev => {
      const next = prev.filter((_, i) => i !== idx);
      if (expandedDay >= next.length) setExpandedDay(Math.max(0, next.length - 1));
      return next;
    });
  };

  const toggleExercise = (idx: number, exerciseId: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== idx) return d;
      const has = d.exerciseIds.includes(exerciseId);
      return { ...d, exerciseIds: has ? d.exerciseIds.filter(id => id !== exerciseId) : [...d.exerciseIds, exerciseId] };
    }));
  };

  const filteredExercises = allExercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(exSearch.toLowerCase());
    const matchMuscle = !muscleFilter || e.muscleGroups.some(m => m === muscleFilter);
    return matchSearch && matchMuscle;
  });

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10 flex-shrink-0">
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-2xl font-semibold tracking-[-0.5px] text-[#fafafa]">
          New Split
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Split Name */}
        <div>
          <label className="text-xs font-bold text-[#737373] uppercase tracking-wider">Split Name</label>
          <input
            autoFocus
            type="text"
            value={splitName}
            onChange={e => { setSplitName(e.target.value); setError(''); }}
            placeholder="e.g. My Custom Split"
            className="mt-2 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
          />
        </div>

        {/* Days */}
        <div>
          <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">Days</p>
          <div className="space-y-2">
            {days.map((day, idx) => (
              <div key={idx} className="bg-[#262626] rounded-2xl overflow-hidden">
                {/* Day header row */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    onClick={() => setExpandedDay(expandedDay === idx ? -1 : idx)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <span className="text-xs font-bold text-[#525252] uppercase w-12 flex-shrink-0">
                      Day {idx + 1}
                    </span>
                    <span className={`text-sm font-medium flex-1 ${day.label ? 'text-[#fafafa]' : 'text-[#525252]'}`}>
                      {day.label || 'Untitled'}
                    </span>
                    {day.exerciseIds.length > 0 && (
                      <span className="text-xs text-[#737373]">{day.exerciseIds.length} exercises</span>
                    )}
                  </button>
                  {days.length > 1 && (
                    <button
                      onClick={() => removeDay(idx)}
                      className="w-8 h-8 flex items-center justify-center text-[#525252] hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {expandedDay === idx && (
                  <div className="px-4 pb-4 space-y-4 border-t border-[#333333] pt-4">
                    {/* Day name input */}
                    <input
                      type="text"
                      value={day.label}
                      onChange={e => updateDay(idx, { label: e.target.value })}
                      placeholder={`Day name (e.g. Push, Pull, Legs)`}
                      className="w-full bg-[#171717] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
                    />

                    {/* Exercise picker */}
                    <div>
                      <p className="text-xs text-[#737373] uppercase tracking-wider font-medium mb-2">
                        Exercises
                      </p>
                      {/* Search + muscle filter */}
                      <input
                        type="text"
                        value={exSearch}
                        onChange={e => setExSearch(e.target.value)}
                        placeholder="Search exercises..."
                        className="w-full bg-[#171717] border border-[#404040] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors mb-2"
                      />
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {ALL_MUSCLES.map(m => (
                          <button
                            key={m}
                            onClick={() => setMuscleFilter(prev => prev === m ? null : m)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                              muscleFilter === m
                                ? 'bg-[#f5f5f5] border-[#f5f5f5] text-[#0a0a0a]'
                                : 'bg-[#171717] border-[#404040] text-[#737373]'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                      {/* Exercise list */}
                      <div className="space-y-1.5">
                        {filteredExercises.map(ex => {
                          const checked = day.exerciseIds.includes(ex.id);
                          return (
                            <button
                              key={ex.id}
                              onClick={() => toggleExercise(idx, ex.id)}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-colors ${checked ? 'bg-[#f5f5f5] text-[#0a0a0a]' : 'bg-[#171717] text-[#a3a3a3] hover:bg-[#1f1f1f]'}`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#0a0a0a]' : 'border border-[#404040]'}`}>
                                {checked && <Check size={12} className="text-[#f5f5f5]" strokeWidth={3} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{ex.name}</p>
                                <p className={`text-xs mt-0.5 ${checked ? 'text-[#525252]' : 'text-[#525252]'}`}>
                                  {ex.muscleGroups.join(' · ')}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                        {filteredExercises.length === 0 && (
                          <p className="text-center text-[#525252] text-xs py-4">No exercises match</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setDays(prev => [...prev, { ...EMPTY_DAY }]);
              setExpandedDay(days.length);
            }}
            className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#404040] text-[#737373] text-sm font-medium hover:border-[#525252] hover:text-[#a3a3a3] transition-colors"
          >
            <Plus size={15} />
            Add day
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Create button */}
        <button
          onClick={handleCreate}
          className="w-full py-4 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-base font-medium transition-colors"
        >
          Create Split
        </button>
      </div>
    </div>
  );
}
