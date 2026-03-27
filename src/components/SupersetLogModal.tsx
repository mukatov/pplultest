import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../utils/haptic';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { Superset, DayType, SetEntry } from '../types';

// ─── Stepper ────────────────────────────────────────────────────────────────────
function Stepper({ value, onChange, step, min, label, unit, className }: {
  value: number; onChange: (v: number) => void; step: number; min: number;
  label: string; unit?: string; className?: string;
}) {
  const dec = () => { onChange(Math.max(min, parseFloat((value - step).toFixed(2)))); triggerHaptic(); };
  const inc = () => { onChange(parseFloat((value + step).toFixed(2))); triggerHaptic(); };

  const dragRef  = useRef<{ lastY: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragRef.current = { lastY: e.clientY };
    trackRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.lastY - e.clientY;
    if (Math.abs(dy) >= 8) { if (dy > 0) inc(); else dec(); dragRef.current.lastY = e.clientY; }
  };
  const onUp = () => { dragRef.current = null; setDragging(false); };

  return (
    <div className={`bg-[#262626] rounded-3xl flex flex-col items-center gap-2 py-5 px-4 transition-colors ${className ?? 'flex-1'} ${dragging ? 'bg-[#1f1f1f]' : ''}`}>
      <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{label}</p>
      <div ref={trackRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ touchAction: 'none' }} className="w-full cursor-ns-resize select-none flex items-center justify-center">
        <span className="text-5xl font-mono text-[#fafafa] text-center w-full leading-[48px]">{value}</span>
      </div>
      {unit && <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{unit}</p>}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
interface Props {
  superset: Superset;
  dayType: DayType;
  onClose: () => void;
}

export default function SupersetLogModal({ superset, dayType, onClose }: Props) {
  const { exercises, logWorkout, getLastWorkout } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [round, setRound]           = useState(1);
  const [weight, setWeight]         = useState(20);
  const [reps, setReps]             = useState(12);
  // exerciseId → all sets logged so far this session
  const [completed, setCompleted]   = useState<Record<string, SetEntry[]>>({});
  const [saved, setSaved]           = useState(false);
  const scrollHapticRef = useRef(0);

  const exObjects = superset.exerciseIds.map(id => exercises.find(e => e.id === id)).filter(Boolean);
  const currentEx = exObjects[currentIdx];
  const isLastInChain = currentIdx === superset.exerciseIds.length - 1;
  const totalSetsAcrossAll = Object.values(completed).reduce((s, arr) => s + arr.length, 0);

  // Pre-fill weight/reps when current exercise changes
  useEffect(() => {
    if (!currentEx || !currentUser) return;
    // 1. Last set logged this session for this exercise
    const prev = completed[currentEx.id];
    if (prev && prev.length > 0) {
      setWeight(prev[prev.length - 1].weight);
      setReps(prev[prev.length - 1].reps);
      return;
    }
    // 2. Last workout history
    const last = getLastWorkout(currentEx.id, currentUser.id);
    if (last?.sets?.[0]) {
      setWeight(last.sets[0].weight);
      setReps(last.sets[0].reps);
    }
  }, [currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogAndAdvance = () => {
    if (!currentEx) return;
    triggerHaptic(12);
    setCompleted(prev => ({
      ...prev,
      [currentEx.id]: [...(prev[currentEx.id] ?? []), { weight, reps }],
    }));
    if (isLastInChain) {
      setRound(r => r + 1);
      setCurrentIdx(0);
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const handleFinish = () => {
    if (!currentUser) return;
    for (const exId of superset.exerciseIds) {
      const sets = completed[exId];
      if (sets && sets.length > 0) {
        logWorkout(exId, sets, dayType, currentUser.id, superset.id);
      }
    }
    setSaved(true);
    setTimeout(onClose, 700);
  };

  if (!currentEx) return null;

  const currentSets = completed[currentEx.id] ?? [];
  const nextEx = isLastInChain ? exObjects[0] : exObjects[currentIdx + 1];
  const nextLabel = isLastInChain
    ? `Round ${round + 1} · ${exObjects[0]?.name}`
    : nextEx?.name;

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col screen-enter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10 flex-shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0">
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-[#fafafa] uppercase tracking-wide leading-none">{currentEx.name}</h1>
          <p className="text-xs text-[#737373] mt-1 uppercase tracking-[1.5px]">Round {round}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Superset chain progress */}
      <div className="flex items-center justify-center gap-0 px-4 py-3 flex-shrink-0">
        {exObjects.map((ex, idx) => (
          <div key={ex?.id ?? idx} className="flex items-center">
            <button
              onClick={() => { triggerHaptic(10); setCurrentIdx(idx); }}
              className="flex flex-col items-center gap-1"
            >
              <div className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentIdx
                  ? 'bg-[#fd9a00] scale-125'
                  : (completed[ex?.id ?? '']?.length ?? 0) > 0
                    ? 'bg-[#737373]'
                    : 'bg-[#333]'
              }`} />
            </button>
            {idx < exObjects.length - 1 && (
              <div className="w-8 h-px bg-[#333] mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Exercise names row */}
      <div className="flex items-center justify-center gap-1 px-4 pb-2 flex-shrink-0">
        {exObjects.map((ex, idx) => (
          <span
            key={ex?.id ?? idx}
            className={`text-[10px] uppercase tracking-[1px] transition-colors ${
              idx === currentIdx ? 'text-[#fd9a00] font-bold' : 'text-[#525252]'
            }`}
          >
            {ex?.name}{idx < exObjects.length - 1 ? ' ·' : ''}
          </span>
        ))}
      </div>

      {/* Inputs pinned below header */}
      <div className="flex-shrink-0 px-4 pt-2 pb-4 flex flex-col gap-3">
        <p className="text-center text-xl font-semibold text-[#fafafa] uppercase tracking-wide">
          SET {currentSets.length + 1}
        </p>
        <div className="flex gap-2.5">
          <Stepper value={weight} onChange={setWeight} step={2.5} min={0} label="WEIGHT" unit="KG" className="flex-[3]" />
          <Stepper value={reps}   onChange={setReps}   step={1}   min={1} label="REPS"   className="flex-[2]" />
        </div>
      </div>

      {/* Scrollable: sets logged this session */}
      <div
        className="flex-1 overflow-y-auto min-h-0 px-4 pb-3 overscroll-contain"
        onScroll={(e) => {
          const y = e.currentTarget.scrollTop;
          if (Math.abs(y - scrollHapticRef.current) >= 80) {
            scrollHapticRef.current = y;
            triggerHaptic(5);
          }
        }}
      >
        {currentSets.length > 0 && (
          <div className="bg-[#262626] rounded-2xl p-3">
            <p className="text-[10px] text-[#525252] uppercase tracking-[1.5px] mb-2 text-center">
              {currentSets.length} {currentSets.length === 1 ? 'set' : 'sets'} logged this session
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {currentSets.map((s, i) => (
                <div key={i} className="bg-[#1c1c1c] rounded-lg px-3 py-1.5 text-center">
                  <span className="text-sm font-semibold text-[#fafafa]">{s.weight}kg</span>
                  <span className="text-xs text-[#525252] ml-1">×{s.reps}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-6 flex flex-col gap-3 flex-shrink-0">
        {/* Log + advance */}
        <button
          onClick={handleLogAndAdvance}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-semibold text-sm active:scale-[0.98] transition-transform"
        >
          Log Set
          <span className="flex items-center gap-1 text-[#737373] font-normal">
            <ChevronRight size={14} />
            {nextLabel}
          </span>
        </button>

        {/* Finish */}
        {totalSetsAcrossAll > 0 && (
          <button
            onClick={handleFinish}
            className={`w-full py-3 rounded-full font-medium text-sm active:scale-[0.98] transition-all ${
              saved
                ? 'bg-[#16a34a] text-white'
                : 'bg-[#262626] text-[#fafafa] border border-[#404040]'
            }`}
          >
            {saved ? '✓ Saved' : `Finish Superset · ${totalSetsAcrossAll} sets`}
          </button>
        )}
      </div>
    </div>
  );
}
