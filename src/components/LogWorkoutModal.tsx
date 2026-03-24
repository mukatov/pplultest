import { useState, useRef } from 'react';
import { ChevronLeft, Settings, ChevronRight, Check, Minus, Plus } from 'lucide-react';
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
  const haptic = () => navigator.vibrate?.(8);
  const dec = () => { onChange(Math.max(min, parseFloat((value - step).toFixed(2)))); haptic(); };
  const inc = () => { onChange(parseFloat((value + step).toFixed(2))); haptic(); };

  const dragRef = useRef<{ lastY: number; dragging: boolean } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const DRAG_THRESHOLD = 8;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { lastY: e.clientY, dragging: false };
    trackRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.lastY - e.clientY;
    if (Math.abs(dy) >= DRAG_THRESHOLD) {
      dragRef.current.dragging = true;
      setIsDragging(true);
      if (dy > 0) inc(); else dec();
      dragRef.current.lastY = e.clientY;
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div className="bg-[#262626] rounded-xl w-full flex flex-col items-center gap-2 py-8 px-6">
      <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{label}</p>
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }}
        className={`flex items-center gap-[59px] cursor-ns-resize select-none rounded-xl px-2 py-1 transition-colors ${isDragging ? 'bg-[#1f1f1f]' : ''}`}
      >
        <button
          onClick={dec}
          className={`w-10 h-10 flex items-center justify-center bg-[#f5f5f5] rounded-lg flex-shrink-0 transition-opacity ${value <= min ? 'opacity-50' : ''}`}
        >
          <Minus size={16} className="text-[#0a0a0a]" />
        </button>
        <span className="text-5xl font-semibold text-[#fafafa] tracking-[-1.5px] min-w-[5rem] text-center leading-[48px]">
          {value}
        </span>
        <button
          onClick={inc}
          className="w-10 h-10 flex items-center justify-center bg-[#f5f5f5] rounded-lg flex-shrink-0"
        >
          <Plus size={16} className="text-[#0a0a0a]" />
        </button>
      </div>
      {unit && <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{unit}</p>}
    </div>
  );
}

export default function LogWorkoutModal({ exerciseId, exerciseName, dayType, onClose }: Props) {
  const { logWorkout, getLastWorkout } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const lastWorkout = currentUser ? getLastWorkout(exerciseId, currentUser.id) : undefined;

  const initWeight = lastWorkout?.sets?.[0]?.weight ?? 20;
  const initReps = lastWorkout?.sets?.[0]?.reps ?? 12;

  const [completedSets, setCompletedSets] = useState<SetEntry[]>([]);
  const [weight, setWeight] = useState(initWeight);
  const [reps, setReps] = useState(initReps);
  const [saved, setSaved] = useState(false);

  const currentSetNumber = completedSets.length + 1;

  const handleNextSet = () => {
    const nextIndex = completedSets.length + 1;
    setCompletedSets(prev => [...prev, { weight, reps }]);
    const nextLastSet = lastWorkout?.sets?.[nextIndex];
    if (nextLastSet) {
      setWeight(nextLastSet.weight);
      setReps(nextLastSet.reps);
    }
  };

  const handleSave = () => {
    if (!currentUser) return;
    const allSets = [...completedSets, { weight, reps }];
    logWorkout(exerciseId, allSets, dayType, currentUser.id);
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

      {/* Exercise pill */}
      <div className="px-4 pt-2 pb-0 flex-shrink-0">
        <div className="bg-[#f5f5f5] rounded-full py-8 flex items-center justify-center">
          <span className="text-xl font-semibold text-[#0a0a0a] uppercase tracking-wide">
            {exerciseName}
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {/* Completed sets grid */}
        {completedSets.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {completedSets.map((s, i) => (
              <div key={i} className="bg-[#262626] rounded-xl py-3 px-4 flex flex-col items-center gap-1">
                <div className="flex items-end gap-1">
                  <span className="text-xl font-semibold text-[#a3a3a3]">{s.weight}</span>
                  <span className="text-xs text-[#a3a3a3] uppercase tracking-[1.5px] mb-0.5">KG</span>
                  <span className="text-xl font-semibold text-[#a3a3a3] mx-1">x</span>
                  <span className="text-xl font-semibold text-[#a3a3a3]">{s.reps}</span>
                </div>
                <span className="text-xs text-[#a3a3a3] uppercase tracking-[1.5px]">set {i + 1}</span>
              </div>
            ))}
          </div>
        )}

        {/* Current set label */}
        <p className="text-center text-xs text-[#fafafa] uppercase tracking-[1.5px]">
          SET {currentSetNumber}
        </p>

        {/* Weight stepper */}
        <Stepper
          value={weight}
          onChange={setWeight}
          step={2.5}
          min={0}
          label="WEIGHT"
          unit="KG"
        />

        {/* Reps stepper */}
        <Stepper
          value={reps}
          onChange={setReps}
          step={1}
          min={1}
          label="REPS"
        />
      </div>

      {/* Bottom action */}
      <div className="px-4 py-3 pb-8 flex gap-2 flex-shrink-0">
        <button
          onClick={handleNextSet}
          disabled={saved}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-[#404040] bg-[rgba(255,255,255,0.05)] text-[#fafafa] font-medium text-base transition-all active:scale-[0.98]"
        >
          NEXT SET <ChevronRight size={16} />
        </button>
        {completedSets.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saved}
            className={`w-12 h-12 flex items-center justify-center bg-[#f5f5f5] rounded-full flex-shrink-0 transition-all active:scale-[0.98] ${saved ? 'opacity-50' : ''}`}
          >
            <Check size={16} className="text-[#0a0a0a]" />
          </button>
        )}
      </div>
    </div>
  );
}
