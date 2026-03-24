import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, BarChart2 } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { TrainingDay } from '../types';

const COLORS = ['#e5e5e5', '#a3a3a3', '#737373', '#d4d4d4', '#525252', '#f5f5f5', '#404040'];

export default function Settings() {
  const navigate = useNavigate();
  const { trainingDays, addTrainingDay, removeTrainingDay } = useWorkoutStore();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const type = trimmed.toLowerCase().replace(/\s+/g, '-');
    if (trainingDays.find(d => d.type === type)) {
      setError('A split with that name already exists');
      return;
    }
    const color = COLORS[trainingDays.length % COLORS.length];
    const day: TrainingDay = { type, label: trimmed, color, exerciseIds: [] };
    addTrainingDay(day);
    setNewName('');
    setError('');
  };

  const handleRemove = (type: string) => {
    if (trainingDays.length <= 1) return;
    removeTrainingDay(type);
  };

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">
          SETTINGS
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Stats link */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center gap-3 bg-[#262626] rounded-2xl px-4 py-4 transition-all active:scale-[0.98]"
        >
          <div className="w-8 h-8 flex items-center justify-center bg-[#171717] rounded-lg">
            <BarChart2 size={16} className="text-[#fafafa]" />
          </div>
          <span className="text-sm font-semibold text-[#fafafa]">View Stats</span>
        </button>

        {/* Splits section */}
        <div>
          <h2 className="text-xs font-semibold text-[#737373] uppercase tracking-[1.5px] mb-3">Splits</h2>

          <div className="space-y-2">
            {trainingDays.map(day => (
              <div
                key={day.type}
                className="bg-[#262626] rounded-2xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: day.color }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#fafafa]">{day.label}</p>
                    <p className="text-xs text-[#737373]">{day.exerciseIds.length} exercises</p>
                  </div>
                </div>
                {trainingDays.length > 1 && (
                  <button
                    onClick={() => handleRemove(day.type)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#737373] hover:text-red-400 hover:bg-[#171717] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add new split */}
          <div className="flex gap-2 mt-3">
            <input
              value={newName}
              onChange={e => { setNewName(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
              placeholder="New split name (e.g. Full Body)"
              className="flex-1 bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
            />
            <button
              onClick={handleAdd}
              className="w-12 h-12 flex items-center justify-center bg-[#f5f5f5] rounded-xl flex-shrink-0 active:scale-95 transition-all"
            >
              <Plus size={16} className="text-[#0a0a0a]" />
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
