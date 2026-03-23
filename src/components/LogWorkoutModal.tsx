import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Trophy } from 'lucide-react';
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
    setTimeout(onClose, 800);
  };

  const maxWeight = Math.max(...sets.map(s => s.weight));
  const isNewPR = pr ? maxWeight > pr.weight : maxWeight > 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-gray-200 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{exerciseName}</h2>
            {lastWorkout && (
              <p className="text-xs text-gray-400 mt-0.5">
                Last: {lastWorkout.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}
              </p>
            )}
            {pr && (
              <p className="text-xs text-yellow-500 flex items-center gap-1 mt-0.5">
                <Trophy size={11} /> PR: {pr.weight}kg × {pr.reps} reps
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Sets */}
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1 uppercase tracking-wider">
            <span className="col-span-1">Set</span>
            <span className="col-span-5">Weight (kg)</span>
            <span className="col-span-5">Reps</span>
            <span className="col-span-1"></span>
          </div>

          {sets.map((set, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-sm text-gray-400 text-center">{i + 1}</span>
              <div className="col-span-5">
                <input
                  type="number"
                  value={set.weight || ''}
                  onChange={e => updateSet(i, 'weight', e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>
              <div className="col-span-5">
                <input
                  type="number"
                  value={set.reps || ''}
                  onChange={e => updateSet(i, 'reps', e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                {sets.length > 1 && (
                  <button onClick={() => removeSet(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={addSet}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all text-sm"
          >
            <Plus size={14} /> Add set
          </button>

          {isNewPR && maxWeight > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-yellow-600 text-sm">
              <Trophy size={16} /> New Personal Record!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {saved ? 'Saved!' : 'Log Workout'}
          </button>
        </div>
      </div>
    </div>
  );
}
