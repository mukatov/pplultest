import { useState } from 'react';
import { ChevronLeft, Check, Trash2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { Split, Session } from '../types';

const COLOR_OPTIONS = [
  { name: 'indigo', bg: 'bg-indigo-500' },
  { name: 'violet', bg: 'bg-violet-500' },
  { name: 'purple', bg: 'bg-purple-500' },
  { name: 'blue', bg: 'bg-blue-500' },
  { name: 'cyan', bg: 'bg-cyan-500' },
  { name: 'rose', bg: 'bg-rose-500' },
  { name: 'emerald', bg: 'bg-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500' },
  { name: 'yellow', bg: 'bg-yellow-500' },
  { name: 'pink', bg: 'bg-pink-500' },
];

interface SessionDraft {
  label: string;
  color: string;
  exerciseIds: string[];
}

const EMPTY_SESSION: SessionDraft = { label: '', color: 'indigo', exerciseIds: [] };

export default function Settings() {
  const navigate = useNavigate();
  const { splits, activeSplitId, setActiveSplit, deleteSplit, addSplit, exercises } = useWorkoutStore();

  const [creating, setCreating] = useState(false);
  const [splitName, setSplitName] = useState('');
  const [sessions, setSessions] = useState<SessionDraft[]>([{ ...EMPTY_SESSION }]);
  const [createError, setCreateError] = useState('');

  const handleCreate = () => {
    setCreateError('');
    if (!splitName.trim()) { setCreateError('Split name is required'); return; }
    if (sessions.some(s => !s.label.trim())) { setCreateError('All sessions need a name'); return; }
    if (sessions.length === 0) { setCreateError('Add at least one session'); return; }

    const newSplit: Split = {
      id: crypto.randomUUID(),
      name: splitName.trim(),
      isBuiltIn: false,
      sessions: sessions.map(s => ({
        type: s.label.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        label: s.label.trim(),
        color: s.color,
        exerciseIds: s.exerciseIds,
      } as Session)),
    };
    addSplit(newSplit);
    setActiveSplit(newSplit.id);
    setSplitName('');
    setSessions([{ ...EMPTY_SESSION }]);
    setCreating(false);
  };

  const updateSession = (idx: number, patch: Partial<SessionDraft>) => {
    setSessions(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };

  const removeSession = (idx: number) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleExercise = (idx: number, exerciseId: string) => {
    setSessions(prev => prev.map((s, i) => {
      if (i !== idx) return s;
      const has = s.exerciseIds.includes(exerciseId);
      return { ...s, exerciseIds: has ? s.exerciseIds.filter(id => id !== exerciseId) : [...s.exerciseIds, exerciseId] };
    }));
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
        <h1 className="flex-1 text-center text-2xl font-semibold tracking-[-0.5px] text-[#fafafa]">
          Splits
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Split list */}
        {splits.map(split => (
          <div
            key={split.id}
            className="flex items-center gap-3 bg-[#262626] rounded-2xl px-4 py-4"
          >
            <button
              onClick={() => setActiveSplit(split.id)}
              className="flex-1 flex items-center gap-3 text-left"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${activeSplitId === split.id ? 'border-[#f5f5f5] bg-[#f5f5f5]' : 'border-[#525252]'}`}>
                {activeSplitId === split.id && <Check size={12} className="text-[#0a0a0a]" strokeWidth={3} />}
              </div>
              <div>
                <p className="text-[#fafafa] font-medium text-sm">{split.name}</p>
                <p className="text-[#525252] text-xs mt-0.5">
                  {split.sessions.map(s => s.label).join(' · ')}
                </p>
              </div>
            </button>
            {!split.isBuiltIn && (
              <button
                onClick={() => deleteSplit(split.id)}
                className="w-8 h-8 flex items-center justify-center text-[#525252] hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}

        {/* Create new split */}
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#404040] text-[#737373] text-sm font-medium hover:border-[#737373] hover:text-[#a3a3a3] transition-colors"
          >
            <Plus size={16} />
            Create custom split
          </button>
        ) : (
          <div className="bg-[#262626] rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[#fafafa] font-semibold text-sm">New Split</p>
              <button onClick={() => { setCreating(false); setCreateError(''); }} className="text-[#525252] hover:text-[#fafafa]">
                <X size={16} />
              </button>
            </div>

            {createError && (
              <p className="text-red-400 text-xs">{createError}</p>
            )}

            <div>
              <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">Split Name</label>
              <input
                type="text"
                value={splitName}
                onChange={e => setSplitName(e.target.value)}
                placeholder="e.g. My Custom Split"
                className="mt-1.5 w-full bg-[#171717] border border-[#404040] rounded-xl px-4 py-2.5 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-[#737373] uppercase tracking-wider font-medium">Sessions</p>
              {sessions.map((session, idx) => (
                <div key={idx} className="bg-[#171717] rounded-xl p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={session.label}
                      onChange={e => updateSession(idx, { label: e.target.value })}
                      placeholder={`Session ${idx + 1} name`}
                      className="flex-1 bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
                    />
                    {sessions.length > 1 && (
                      <button onClick={() => removeSession(idx)} className="text-[#525252] hover:text-red-400 transition-colors">
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Color picker */}
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => updateSession(idx, { color: c.name })}
                        className={`w-6 h-6 rounded-full ${c.bg} flex items-center justify-center transition-transform ${session.color === c.name ? 'ring-2 ring-white ring-offset-1 ring-offset-[#171717] scale-110' : ''}`}
                      >
                        {session.color === c.name && <Check size={11} className="text-white" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>

                  {/* Exercise picker */}
                  <div>
                    <p className="text-xs text-[#525252] mb-2">Exercises ({session.exerciseIds.length} selected)</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {exercises.map(ex => {
                        const checked = session.exerciseIds.includes(ex.id);
                        return (
                          <button
                            key={ex.id}
                            onClick={() => toggleExercise(idx, ex.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${checked ? 'bg-[#f5f5f5] text-[#0a0a0a]' : 'bg-[#262626] text-[#a3a3a3]'}`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#0a0a0a]' : 'border border-[#404040]'}`}>
                              {checked && <Check size={10} className="text-[#f5f5f5]" strokeWidth={3} />}
                            </div>
                            {ex.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setSessions(prev => [...prev, { ...EMPTY_SESSION }])}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#404040] text-[#737373] text-xs hover:border-[#525252] transition-colors"
              >
                <Plus size={13} />
                Add session
              </button>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] text-sm font-medium hover:bg-white transition-colors"
            >
              Create Split
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
