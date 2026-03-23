import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Trophy, Minus, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType, SetEntry } from '../types';

interface Props {
  exerciseId: string;
  exerciseName: string;
  dayType: DayType;
  onClose: () => void;
}

function Stepper({
  value,
  onChange,
  step,
  min,
  label,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  label: string;
  unit?: string;
}) {
  const dec = () => onChange(Math.max(min, parseFloat((value - step).toFixed(2))));
  const inc = () => onChange(parseFloat((value + step).toFixed(2)));

  const dragRef = useRef<{ lastY: number; pointerId: number; dragging: boolean } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const DRAG_THRESHOLD = 8;

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    e.preventDefault();
    dragRef.current = { lastY: e.clientY, pointerId: e.pointerId, dragging: false };
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.lastY - e.clientY;
    if (Math.abs(dy) >= DRAG_THRESHOLD) {
      dragRef.current.dragging = true;
      setIsDragging(true);
      if (dy > 0) inc();
      else dec();
      dragRef.current.lastY = e.clientY;
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <p className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">{label}</p>
      <div className="flex items-center gap-4">
        <button
          onPointerDown={dec}
          className="w-10 h-10 rounded-lg bg-[#f5f5f5] hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
        >
          <Minus size={16} className="text-[#0a0a0a]" strokeWidth={2.5} />
        </button>
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex flex-col items-center cursor-ns-resize select-none transition-colors ${isDragging ? 'opacity-70' : ''}`}
          style={{ touchAction: 'none' }}
        >
          <input
            type="number"
            inputMode={step < 1 ? 'decimal' : 'numeric'}
            value={value || ''}
            onChange={e => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= min) onChange(v);
              else if (e.target.value === '') onChange(min);
            }}
            className="w-16 text-center text-[3rem] font-semibold leading-[3rem] tracking-[-0.09375rem] text-[#fafafa] bg-transparent focus:outline-none pointer-events-none"
            tabIndex={-1}
          />
          {unit && (
            <span className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">{unit}</span>
          )}
        </div>
        <button
          onPointerDown={inc}
          className="w-10 h-10 rounded-lg bg-[#f5f5f5] hover:bg-white flex items-center justify-center flex-shrink-0 transition-colors active:scale-95"
        >
          <Plus size={16} className="text-[#0a0a0a]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function LogWorkoutModal({ exerciseId, exerciseName, dayType, onClose }: Props) {
  const { logWorkout, getLastWorkout, getPersonalRecord } = useWorkoutStore();
  const { currentUser } = useAuthStore();
  const [sets, setSets] = useState<SetEntry[]>([{ weight: 0, reps: 0 }]);
  const [currentSet, setCurrentSet] = useState(0);
  const [saved, setSaved] = useState(false);

  const lastWorkout = currentUser ? getLastWorkout(exerciseId, currentUser.id) : undefined;
  const pr = currentUser ? getPersonalRecord(exerciseId, currentUser.id) : undefined;

  useEffect(() => {
    if (lastWorkout?.sets?.length) {
      setSets(lastWorkout.sets.map(s => ({ ...s })));
    }
  }, [lastWorkout]);

  const updateSet = (field: keyof SetEntry, value: number) => {
    setSets(prev => prev.map((s, i) => i === currentSet ? { ...s, [field]: value } : s));
  };

  const addSet = () => {
    setSets(prev => [...prev, { ...prev[prev.length - 1] }]);
    setCurrentSet(sets.length);
  };

  const removeSet = (i: number) => {
    setSets(prev => prev.filter((_, idx) => idx !== i));
    if (currentSet >= i && currentSet > 0) setCurrentSet(currentSet - 1);
  };

  const handleSave = () => {
    if (!currentUser) return;
    logWorkout(exerciseId, sets, dayType, currentUser.id);
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const maxWeight = sets.length ? Math.max(...sets.map(s => s.weight)) : 0;
  const isNewPR = pr ? maxWeight > pr.weight : maxWeight > 0;
  const set = sets[currentSet] ?? sets[0];

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
        <p className="flex-1 text-center text-[3rem] font-semibold leading-[3rem] tracking-[-0.09375rem] text-[#fafafa] uppercase truncate">
          {dayType}
        </p>
        <div className="w-10 h-10 flex-shrink-0" />
      </div>

      {/* Exercise pill */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-center py-8 rounded-full bg-[#f5f5f5]">
          <span className="text-[1.25rem] font-semibold text-[#0a0a0a] uppercase">{exerciseName}</span>
        </div>
      </div>

      {/* PR banner */}
      {isNewPR && maxWeight > 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2 bg-[#422006] border border-[#78350f] rounded-2xl px-4 py-3 text-[#fbbf24] flex-shrink-0">
          <Trophy size={16} />
          <span className="font-semibold text-sm">New Personal Record!</span>
        </div>
      )}

      {/* Set label */}
      <p className="text-center text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3] mb-3 flex-shrink-0">
        SET {currentSet + 1}
      </p>

      {/* Weight & Reps cards */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {/* Weight */}
        <div className="bg-[#262626] rounded-xl px-6 py-8 flex items-center justify-center">
          <Stepper
            value={set.weight}
            onChange={v => updateSet('weight', v)}
            step={2.5}
            min={0}
            label="Weight"
            unit="kg"
          />
        </div>

        {/* Reps */}
        <div className="bg-[#262626] rounded-xl px-6 py-8 flex items-center justify-center">
          <Stepper
            value={set.reps}
            onChange={v => updateSet('reps', v)}
            step={1}
            min={1}
            label="Reps"
          />
        </div>

        {/* Set tabs */}
        <div className="flex gap-2 flex-wrap">
          {sets.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentSet(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === currentSet
                  ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                  : 'bg-[#262626] text-[#a3a3a3] border border-[#404040]'
              }`}
            >
              Set {i + 1}
              {s.weight > 0 && <span className="opacity-60">{s.weight}×{s.reps}</span>}
              {sets.length > 1 && i === currentSet && (
                <span
                  onClick={e => { e.stopPropagation(); removeSet(i); }}
                  className="ml-1 text-[#525252] hover:text-[#ef4444]"
                >
                  <Trash2 size={11} />
                </span>
              )}
            </button>
          ))}
          <button
            onClick={addSet}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[#262626] border border-dashed border-[#404040] text-[#a3a3a3] hover:border-[#fafafa] hover:text-[#fafafa] transition-colors"
          >
            <Plus size={12} /> Add Set
          </button>
        </div>
      </div>

      {/* Next Set / Save */}
      <div className="px-4 py-4 flex-shrink-0">
        {currentSet < sets.length - 1 ? (
          <button
            onClick={() => setCurrentSet(currentSet + 1)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[rgba(255,255,255,0.05)] border border-[#404040] text-[#fafafa] font-medium text-sm transition-all active:scale-[0.98]"
          >
            NEXT SET <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-full py-3 rounded-full font-medium text-base transition-all active:scale-[0.98] ${
              saved
                ? 'bg-[#16a34a] text-white'
                : 'bg-[#f5f5f5] hover:bg-white text-[#0a0a0a]'
            }`}
          >
            {saved ? '✓ Saved!' : `Log ${sets.length} Set${sets.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  );
}
