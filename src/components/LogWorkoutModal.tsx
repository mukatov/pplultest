import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Trophy, Minus, ChevronsUpDown } from 'lucide-react';
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
    <div className="flex-1">
      <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-3 text-center">{label}</p>
      <div className="flex items-center gap-2">
        <button
          onPointerDown={dec}
          className="w-11 h-11 rounded-xl bg-[#262626] hover:bg-[#2e2e2e] active:bg-[#404040] flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <Minus size={18} className="text-[#fafafa]" strokeWidth={2.5} />
        </button>
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`flex-1 flex flex-col items-center cursor-ns-resize select-none rounded-xl transition-colors ${isDragging ? 'bg-[#262626]' : ''}`}
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
            className="w-full text-center text-3xl font-bold text-[#fafafa] bg-transparent focus:outline-none leading-none py-1 pointer-events-none"
            tabIndex={-1}
          />
          {unit
            ? <span className="text-xs text-[#737373] font-medium -mt-0.5">{unit}</span>
            : <ChevronsUpDown size={12} className="text-[#525252] mt-0.5" />
          }
        </div>
        <button
          onPointerDown={inc}
          className="w-11 h-11 rounded-xl bg-[#262626] hover:bg-[#2e2e2e] active:bg-[#404040] flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <Plus size={18} className="text-[#fafafa]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
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

  const updateSet = (index: number, field: keyof SetEntry, value: number) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSet = () => setSets(prev => [...prev, { ...prev[prev.length - 1] }]);
  const removeSet = (i: number) => setSets(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!currentUser) return;
    logWorkout(exerciseId, sets, dayType, currentUser.id);
    setSaved(true);
    setTimeout(onClose, 900);
  };

  const maxWeight = sets.length ? Math.max(...sets.map(s => s.weight)) : 0;
  const isNewPR = pr ? maxWeight > pr.weight : maxWeight > 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col screen-enter">
      {/* Nav bar */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-[#fafafa] leading-tight truncate uppercase">{exerciseName}</h1>
          {lastWorkout && (
            <p className="text-xs text-[#737373] truncate">
              Last: {lastWorkout.sets.map(s => `${s.weight}kg×${s.reps}`).join(', ')}
            </p>
          )}
        </div>
        {pr && (
          <div className="flex items-center gap-1 text-yellow-400 flex-shrink-0">
            <Trophy size={14} />
            <span className="text-sm font-bold">{pr.weight}kg</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {/* PR banner */}
        {isNewPR && maxWeight > 0 && (
          <div className="flex items-center gap-2 bg-[#262626] border border-yellow-900 rounded-2xl px-4 py-3 text-yellow-400">
            <Trophy size={18} />
            <span className="font-bold">New Personal Record!</span>
          </div>
        )}

        {/* Set cards */}
        {sets.map((set, i) => (
          <div key={i} className="bg-[#262626] rounded-2xl px-4 pt-3 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">Set {i + 1}</span>
              {sets.length > 1 && (
                <button
                  onClick={() => removeSet(i)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#525252] hover:text-red-400 hover:bg-[#171717] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-4">
              <Stepper
                value={set.weight}
                onChange={v => updateSet(i, 'weight', v)}
                step={2.5}
                min={0}
                label="Weight"
                unit="kg"
              />
              <div className="w-px bg-[#404040] self-stretch" />
              <Stepper
                value={set.reps}
                onChange={v => updateSet(i, 'reps', v)}
                step={1}
                min={1}
                label="Reps"
              />
            </div>
          </div>
        ))}

        {/* Add set */}
        <button
          onClick={addSet}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-[#404040] text-[#737373] hover:border-[#737373] hover:text-[#fafafa] transition-all text-sm font-semibold"
        >
          <Plus size={16} /> Add Set
        </button>
      </div>

      {/* Bottom action */}
      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-3 rounded-full text-base font-medium transition-all ${
            saved
              ? 'bg-[#262626] text-[#737373]'
              : 'bg-[#f5f5f5] hover:bg-white text-[#0a0a0a]'
          }`}
        >
          {saved ? '✓ Saved!' : `Log ${sets.length} Set${sets.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
