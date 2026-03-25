import { useState, useRef } from 'react';
import { ChevronLeft, Settings, ChevronRight, Check, Minus, Plus, X } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType, SetEntry } from '../types';

interface Props {
  exerciseId: string;
  exerciseName: string;
  dayType: DayType;
  onClose: () => void;
}

function relativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 14) return 'last week';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function SetGrid({
  sets,
  highlightMax,
  onRemove,
}: {
  sets: SetEntry[];
  highlightMax: boolean;
  onRemove?: (index: number) => void;
}) {
  if (sets.length === 0) return null;
  const maxW = highlightMax ? Math.max(...sets.map(s => s.weight)) : -1;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {sets.map((s, i) => {
        const isPR = s.weight === maxW;
        return (
          <div
            key={i}
            className={`bg-[#262626] rounded-xl py-3 px-4 flex flex-col items-center gap-1 relative ${isPR ? 'border border-[#fcd34d]' : ''}`}
          >
            {onRemove && (
              <button
                onClick={() => onRemove(i)}
                className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-[#404040] text-[#a3a3a3] active:bg-[#525252]"
              >
                <X size={10} />
              </button>
            )}
            <div className="flex items-end gap-1">
              <span className={`text-xl font-semibold ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>{s.weight}</span>
              <span className={`text-xs uppercase tracking-[1.5px] mb-0.5 ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>KG</span>
              <span className={`text-xl font-semibold mx-1 ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>x</span>
              <span className={`text-xl font-semibold ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>{s.reps}</span>
            </div>
            <span className="text-xs text-[#a3a3a3] uppercase tracking-[1.5px]">set {i + 1}</span>
          </div>
        );
      })}
    </div>
  );
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
  const haptic = () => navigator.vibrate?.(8);
  const dec = () => { onChange(Math.max(min, parseFloat((value - step).toFixed(2)))); haptic(); };
  const inc = () => { onChange(parseFloat((value + step).toFixed(2))); haptic(); };

  const dragRef = useRef<{ lastY: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { lastY: e.clientY };
    trackRef.current?.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.lastY - e.clientY;
    if (Math.abs(dy) >= 8) {
      if (dy > 0) inc(); else dec();
      dragRef.current.lastY = e.clientY;
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div className={`bg-[#262626] rounded-3xl flex-1 flex flex-col items-center gap-2 py-5 px-6 transition-colors ${isDragging ? 'bg-[#1f1f1f]' : ''}`}>
      <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{label}</p>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className="flex items-center justify-between w-full cursor-ns-resize select-none"
      >
        <button
          onClick={dec}
          className={`w-6 h-6 flex items-center justify-center rounded-[4px] transition-opacity ${value <= min ? 'opacity-30' : ''}`}
        >
          <Minus size={16} className="text-[#fafafa]" />
        </button>
        <span className="text-5xl font-semibold text-[#fafafa] tracking-[-1.5px] min-w-[3rem] text-center leading-[48px]">
          {value}
        </span>
        <button onClick={inc} className="w-6 h-6 flex items-center justify-center rounded-[4px]">
          <Plus size={16} className="text-[#fafafa]" />
        </button>
      </div>
      {unit && <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{unit}</p>}
    </div>
  );
}

export default function LogWorkoutModal({ exerciseId, exerciseName, dayType, onClose }: Props) {
  const { logWorkout, getLastWorkout, getWorkoutHistory } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const lastWorkout = currentUser ? getLastWorkout(exerciseId, currentUser.id) : undefined;
  const history = currentUser ? getWorkoutHistory(exerciseId, currentUser.id) : [];

  const lastMaxWeight = lastWorkout ? Math.max(...lastWorkout.sets.map(s => s.weight)) : null;
  const lastMaxReps = lastWorkout
    ? (lastWorkout.sets.find(s => s.weight === lastMaxWeight)?.reps ?? null)
    : null;

  const [mode, setMode] = useState<'session' | 'history'>('session');
  const [completedSets, setCompletedSets] = useState<SetEntry[]>([]);
  const [weight, setWeight] = useState(lastWorkout?.sets?.[0]?.weight ?? 20);
  const [reps, setReps] = useState(lastWorkout?.sets?.[0]?.reps ?? 12);
  const [saved, setSaved] = useState(false);

  const currentSetNumber = completedSets.length + 1;

  const handleAddSet = () => {
    const nextIndex = completedSets.length + 1;
    setCompletedSets(prev => [...prev, { weight, reps }]);
    const nextLastSet = lastWorkout?.sets?.[nextIndex];
    if (nextLastSet) {
      setWeight(nextLastSet.weight);
      setReps(nextLastSet.reps);
    }
  };

  const handleRemoveSet = (index: number) => {
    setCompletedSets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!currentUser || completedSets.length === 0) return;
    logWorkout(exerciseId, completedSets, dayType, currentUser.id);
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col screen-enter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa] uppercase">
          {dayType}
        </h1>
        <button className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0">
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      </div>

      {/* Exercise toggle bar */}
      <div className="px-4 pt-2 flex gap-2 flex-shrink-0">
        {mode === 'session' ? (
          <>
            <div className="flex-1 bg-[#f5f5f5] rounded-full py-3 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xl font-semibold text-[#0a0a0a] uppercase truncate px-2">{exerciseName}</span>
              <span className="text-xs text-[#0a0a0a]">current session</span>
            </div>
            {lastWorkout && lastMaxWeight !== null && (
              <button
                onClick={() => setMode('history')}
                className="bg-[#262626] rounded-full py-3 px-6 flex flex-col items-center gap-1 flex-shrink-0 active:scale-[0.97] transition-transform"
              >
                <span className="text-xl font-semibold text-[#fafafa]">
                  {lastMaxWeight}×{lastMaxReps}
                </span>
                <span className="text-xs text-[#737373]">{relativeDate(lastWorkout.date)}</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => setMode('session')}
              className="bg-[#262626] rounded-full py-3 px-6 flex flex-col items-center gap-1 flex-shrink-0 active:scale-[0.97] transition-transform"
            >
              <span className="text-xl font-semibold text-[#fafafa]">BACK</span>
              <span className="text-xs text-[#737373]">to session</span>
            </button>
            <div className="flex-1 bg-[#f5f5f5] rounded-full py-3 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xl font-semibold text-[#0a0a0a] uppercase truncate px-2">{exerciseName}</span>
              <span className="text-xs text-[#0a0a0a] uppercase tracking-[1px]">HISTORY</span>
            </div>
          </>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {mode === 'session' ? (
          <>
            <SetGrid sets={completedSets} highlightMax onRemove={handleRemoveSet} />
            <p className="text-center text-xl font-semibold text-[#fafafa] uppercase tracking-wide">
              SET {currentSetNumber}
            </p>
            <div className="flex gap-2.5">
              <Stepper value={weight} onChange={setWeight} step={2.5} min={0} label="WEIGHT" unit="KG" />
              <Stepper value={reps} onChange={setReps} step={1} min={1} label="REPS" />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {history.length === 0 ? (
              <p className="text-center text-[#737373] text-sm mt-8">No history yet</p>
            ) : (
              [...history].reverse().map(ws => {
                const dateStr = new Date(ws.date).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long',
                }).toUpperCase();
                return (
                  <div key={ws.id} className="flex flex-col gap-2.5">
                    <p className="text-center text-sm text-[#fafafa] uppercase tracking-[1.5px]">{dateStr}</p>
                    <SetGrid sets={ws.sets} highlightMax />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="px-4 py-3 pb-8 flex gap-2 flex-shrink-0 backdrop-blur-sm bg-[rgba(23,23,23,0.8)]">
        <button
          onClick={mode === 'history' ? () => setMode('session') : handleAddSet}
          disabled={saved}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-[#404040] bg-[rgba(255,255,255,0.05)] text-[#fafafa] font-medium text-base transition-all active:scale-[0.98]"
        >
          ADD SET <ChevronRight size={16} />
        </button>
        <button
          onClick={handleSave}
          disabled={saved || completedSets.length === 0}
          className={`w-12 h-12 flex items-center justify-center bg-[#f5f5f5] rounded-full flex-shrink-0 transition-all active:scale-[0.98] ${saved || completedSets.length === 0 ? 'opacity-40' : ''}`}
        >
          <Check size={16} className="text-[#0a0a0a]" />
        </button>
      </div>
    </div>
  );
}
