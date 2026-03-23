import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Trophy } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType, SetEntry } from '../types';

interface Props {
  exerciseId: string;
  exerciseName: string;
  dayType: DayType;
  onClose: () => void;
}

export default function LogWorkoutModal({ exerciseId, exerciseName, dayType, onClose }: Props) {
  const { logWorkout, getLastWorkout, getPersonalRecord } = useWorkoutStore();
  const { currentUser } = useAuthStore();
  const [sets, setSets] = useState<SetEntry[]>([{ weight: 0, reps: 0 }]);
  const [saved, setSaved] = useState(false);

  const lastWorkout = currentUser ? getLastWorkout(exerciseId, currentUser.id) : undefined;
  const pr = currentUser ? getPersonalRecord(exerciseId, currentUser.id) : undefined;

  useEffect(() => {
    if (lastWorkout?.sets?.length) {
      setSets(lastWorkout.sets.map(s => ({ ...s })));
    }
  }, [lastWorkout]);

  const updateSet = (index: number, field: keyof SetEntry, value: string) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: parseFloat(value) || 0 } : s));
  };

  const addSet = () => setSets(prev => [...prev, { ...prev[prev.length - 1] }]);
  const removeSet = (i: number) => setSets(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!currentUser) return;
    logWorkout(exerciseId, sets, dayType, currentUser.id);
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const maxWeight = Math.max(...sets.map(s => s.weight));
  const isNewPR = pr ? maxWeight > pr.weight : maxWeight > 0;

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
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{exerciseName}</h1>
          {lastWorkout && (
            <p className="text-xs text-gray-400 truncate">
              Last: {lastWorkout.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}
            </p>
          )}
        </div>
        {pr && (
          <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
            <Trophy size={14} />
            <span className="text-sm font-bold">{pr.weight}kg</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* PR banner */}
        {isNewPR && maxWeight > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-yellow-600 mb-6">
            <Trophy size={18} />
            <span className="font-bold">New Personal Record!</span>
          </div>
        )}

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-3 px-1 mb-3">
          <span className="col-span-1 text-xs font-bold text-gray-400 text-center">#</span>
          <span className="col-span-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Weight kg</span>
          <span className="col-span-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Reps</span>
          <span className="col-span-1" />
        </div>

        {/* Sets */}
        <div className="space-y-3">
          {sets.map((set, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <span className="col-span-1 text-sm font-bold text-gray-400 text-center">{i + 1}</span>
              <div className="col-span-5">
                <input
                  type="number"
                  inputMode="decimal"
                  value={set.weight || ''}
                  onChange={e => updateSet(i, 'weight', e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-base font-semibold text-gray-900 text-center focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.reps || ''}
                  onChange={e => updateSet(i, 'reps', e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-base font-semibold text-gray-900 text-center focus:outline-none focus:border-indigo-400 transition-colors shadow-sm"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {sets.length > 1 && (
                  <button onClick={() => removeSet(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add set */}
        <button
          onClick={addSet}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all text-sm font-semibold"
        >
          <Plus size={16} /> Add Set
        </button>
      </div>

      {/* Bottom action */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-4 rounded-2xl text-base font-bold transition-all shadow-sm ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {saved ? '✓ Saved!' : `Log ${sets.length} Set${sets.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
