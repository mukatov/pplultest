import { ChevronLeft, Check, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';

export default function Settings() {
  const navigate = useNavigate();
  const { splits, activeSplitId, setActiveSplit, deleteSplit } = useWorkoutStore();

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
                  {split.days.map(d => d.label).join(' · ')}
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

      </div>

      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={() => navigate('/settings/new-split')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-[#404040] text-[#737373] text-sm font-medium hover:border-[#737373] hover:text-[#a3a3a3] transition-colors"
        >
          <Plus size={16} />
          Create custom split
        </button>
      </div>
    </div>
  );
}
