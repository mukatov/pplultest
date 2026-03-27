import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trophy, ChevronLeft, Clock, Link2, X, GripVertical, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../utils/haptic';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { Exercise, Superset } from '../types';
import LogWorkoutModal from '../components/LogWorkoutModal';
import AddExerciseModal from '../components/AddExerciseModal';
import EditDayModal from '../components/EditDayModal';
import SupersetModal from '../components/SupersetModal';
import SupersetLogModal from '../components/SupersetLogModal';

// ─── Display items ─────────────────────────────────────────────────────────────
type DisplayItem =
  | { kind: 'standalone'; exercise: Exercise }
  | { kind: 'superset'; superset: Superset; exercises: Exercise[] };

function buildDisplayItems(
  orderedIds: string[],
  supersets: Superset[],
  exercises: Exercise[]
): DisplayItem[] {
  const idToSuperset = new Map<string, Superset>();
  for (const ss of supersets) {
    for (const eid of ss.exerciseIds) idToSuperset.set(eid, ss);
  }
  const emitted = new Set<string>();
  const items: DisplayItem[] = [];
  for (const eid of orderedIds) {
    const ss = idToSuperset.get(eid);
    if (ss) {
      if (!emitted.has(ss.id)) {
        emitted.add(ss.id);
        const ssEx = ss.exerciseIds.map(id => exercises.find(e => e.id === id)).filter(Boolean) as Exercise[];
        items.push({ kind: 'superset', superset: ss, exercises: ssEx });
      }
    } else {
      const ex = exercises.find(e => e.id === eid);
      if (ex) items.push({ kind: 'standalone', exercise: ex });
    }
  }
  return items;
}

function displayItemsToIds(items: DisplayItem[]): string[] {
  return items.flatMap(item =>
    item.kind === 'standalone' ? [item.exercise.id] : item.superset.exerciseIds
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function TrainingDay() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const dayType = day ?? '';

  const splits        = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const workoutSets   = useWorkoutStore(s => s.workoutSets);
  const { exercises, getLastWorkout, getPersonalRecord, updateDayExercises, removeSuperset } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  // Modal state
  const [logState,       setLogState]      = useState<{ exerciseId: string; supersetId?: string } | null>(null);
  const [logSuperset,    setLogSuperset]   = useState<Superset | null>(null);
  const [showAdd,        setShowAdd]       = useState(false);
  const [showEdit,       setShowEdit]      = useState(false);
  const [showSuperset,   setShowSuperset]  = useState(false);
  const [showFinishConf, setShowFinishConf] = useState(false);

  // Drag state
  const [dragIdx,    setDragIdx]    = useState<number | null>(null);
  const [targetIdx,  setTargetIdx]  = useState<number | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const itemRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const rectsRef  = useRef<DOMRect[]>([]);
  const startYRef = useRef(0);

  const activeSplit  = splits.find(s => s.id === activeSplitId);
  const trainingDay  = activeSplit?.days?.find(d => d.type === dayType);
  const dayExercises = exercises.filter(e => trainingDay?.exerciseIds.includes(e.id));
  const baseItems    = buildDisplayItems(trainingDay?.exerciseIds ?? [], trainingDay?.supersets ?? [], exercises);

  const logExercise = logState ? exercises.find(e => e.id === logState.exerciseId) : null;

  const today = new Date().toDateString();
  function isLoggedToday(exerciseId: string): boolean {
    if (!currentUser) return false;
    const key = `${currentUser.id}:${exerciseId}`;
    return workoutSets.some(
      ws => ws.exerciseId === key && ws.dayType === dayType && new Date(ws.date).toDateString() === today
    );
  }

  function handleAddExercise(exercise: Exercise) {
    const currentIds = trainingDay?.exerciseIds ?? [];
    if (!currentIds.includes(exercise.id)) {
      updateDayExercises(dayType, [...currentIds, exercise.id]);
    }
  }

  function formatDate(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }

  // ─── Drag handlers ─────────────────────────────────────────────────────────
  const startDrag = useCallback((idx: number, clientY: number) => {
    rectsRef.current = itemRefs.current.map(el => el?.getBoundingClientRect() ?? new DOMRect());
    startYRef.current = clientY;
    setDragIdx(idx);
    setTargetIdx(idx);
    setDragDeltaY(0);
    triggerHaptic(15);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (dragIdx === null) return;
    setDragDeltaY(e.clientY - startYRef.current);
    const y = e.clientY;
    let newTarget = dragIdx;
    for (let i = 0; i < rectsRef.current.length; i++) {
      const rect = rectsRef.current[i];
      if (y < rect.bottom) { newTarget = i; break; }
      newTarget = i;
    }
    setTargetIdx(prev => {
      if (newTarget !== prev) triggerHaptic(8);
      return newTarget;
    });
  }, [dragIdx]);

  const onPointerUp = useCallback(() => {
    if (dragIdx !== null && targetIdx !== null && dragIdx !== targetIdx) {
      const reordered = [...baseItems];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(targetIdx, 0, moved);
      updateDayExercises(dayType, displayItemsToIds(reordered));
    }
    setDragIdx(null);
    setTargetIdx(null);
    setDragDeltaY(0);
  }, [dragIdx, targetIdx, baseItems, dayType, updateDayExercises]);

  useEffect(() => {
    if (dragIdx === null) return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragIdx, onPointerMove, onPointerUp]);

  // Per-item animated transform
  function getItemStyle(idx: number): React.CSSProperties {
    if (dragIdx === null) return { position: 'relative' };
    if (idx === dragIdx) {
      return {
        transform: `translateY(${dragDeltaY}px) scale(1.03)`,
        transition: 'none',
        zIndex: 20,
        position: 'relative',
        opacity: 0.95,
      };
    }
    const draggedH = (rectsRef.current[dragIdx]?.height ?? 80) + 8;
    const from = dragIdx, to = targetIdx ?? dragIdx;
    let translateY = 0;
    if (from < to && idx > from && idx <= to) translateY = -draggedH;
    if (from > to && idx >= to && idx < from) translateY = draggedH;
    return {
      transform: `translateY(${translateY}px)`,
      transition: 'transform 180ms ease',
      zIndex: 1,
      position: 'relative',
    };
  }

  // ─── Finish day ────────────────────────────────────────────────────────────
  const completedToday = dayExercises.filter(e => isLoggedToday(e.id)).length;
  const handleFinish = () => {
    navigate('/home', { state: { finishedDay: trainingDay?.label ?? dayType } });
  };

  // ─── Exercise card — drag handle lives inside ───────────────────────────────
  function ExerciseCard({ exercise, supersetId, itemIdx }: {
    exercise: Exercise;
    supersetId?: string;
    itemIdx?: number; // provided only for standalone items (enables drag handle)
  }) {
    const last      = currentUser ? getLastWorkout(exercise.id, currentUser.id) : undefined;
    const pr        = currentUser ? getPersonalRecord(exercise.id, currentUser.id) : undefined;
    const maxWeight = last ? Math.max(...last.sets.map(s => s.weight)) : 0;
    const totalSets = last?.sets.length ?? 0;
    const doneToday = isLoggedToday(exercise.id);

    return (
      <button
        onClick={() => { triggerHaptic(10); setLogState({ exerciseId: exercise.id, supersetId }); }}
        className={`w-full flex items-center gap-3 px-4 py-5 rounded-2xl transition-colors active:scale-[0.98] ${
          doneToday ? 'bg-[#262626] border border-[#0d9488]' : 'bg-[#262626] hover:bg-[#2e2e2e]'
        }`}
      >
        {/* Drag handle — only for standalone items */}
        {itemIdx !== undefined && (
          <div
            className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1"
            onPointerDown={e => {
              e.preventDefault();
              e.stopPropagation();
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              startDrag(itemIdx, e.clientY);
            }}
          >
            <GripVertical size={16} className="text-[#525252]" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className={`font-semibold uppercase tracking-wide text-sm ${
              doneToday ? 'line-through text-[#737373]' : 'text-[#fafafa]'
            }`}>
              {exercise.name}
            </h3>
            {doneToday && <CheckCircle2 size={13} className="text-[#0d9488] flex-shrink-0" />}
          </div>
          <p className="text-xs text-[#737373]">{exercise.muscleGroups.join(' · ')}</p>
          {last ? (
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-xs text-[#525252] flex items-center gap-1">
                <Clock size={11} />
                {formatDate(last.date)}
              </span>
              <span className="text-xs text-[#525252]">{totalSets} sets · {maxWeight}kg</span>
            </div>
          ) : (
            <p className="text-xs text-[#525252] mt-1">Tap to log sets</p>
          )}
        </div>

        {/* PR badge */}
        {pr ? (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs text-yellow-400">
            <Trophy size={11} />
            {pr.weight}kg
          </span>
        ) : (
          itemIdx !== undefined ? <div className="w-6 flex-shrink-0" /> : null
        )}
      </button>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
          >
            <ChevronLeft size={16} className="text-[#fafafa]" />
          </button>
          <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa] uppercase">
            {trainingDay?.label ?? dayType}
          </h1>
          <button
            onClick={() => setShowEdit(true)}
            className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
          >
            <Pencil size={16} className="text-[#fafafa]" />
          </button>
        </div>
        {trainingDay && (
          <p className="text-center text-sm text-[#737373] -mt-2">
            {exercises
              .filter(e => trainingDay.exerciseIds.includes(e.id))
              .flatMap(e => e.muscleGroups)
              .filter((mg, i, arr) => arr.indexOf(mg) === i)
              .slice(0, 4)
              .join(' · ')}
          </p>
        )}
        {completedToday > 0 && (
          <p className="text-center text-xs text-[#0d9488] mt-2">
            {completedToday}/{dayExercises.length} done today
          </p>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {/* Action buttons — TOP of list */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setShowAdd(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-white/5 border border-[#404040] text-[#fafafa] font-medium text-sm active:scale-[0.98]"
          >
            <Plus size={15} />
            New exercise
          </button>
          <button
            onClick={() => setShowSuperset(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-white/5 border border-[#404040] text-[#fafafa] font-medium text-sm active:scale-[0.98]"
          >
            <Link2 size={15} />
            Add superset
          </button>
        </div>

        {/* Exercise cards */}
        {baseItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#737373] font-medium">No exercises yet.</p>
            <p className="text-[#525252] text-sm mt-1">Tap "New exercise" above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {baseItems.map((item, idx) => {
              const key = item.kind === 'standalone' ? item.exercise.id : item.superset.id;

              return (
                <div
                  key={key}
                  ref={el => { itemRefs.current[idx] = el; }}
                  style={getItemStyle(idx)}
                >
                  {item.kind === 'standalone' ? (
                    <ExerciseCard exercise={item.exercise} itemIdx={idx} />
                  ) : (
                    // Superset card
                    <div className="bg-[#1c1c1c] rounded-2xl overflow-hidden border border-[#333]">
                      {/* Header — drag handle on left, log tap in center, X on right */}
                      <div className="flex items-center px-3 py-2.5 border-b border-[#333] gap-2">
                        <div
                          className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1"
                          onPointerDown={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                            startDrag(idx, e.clientY);
                          }}
                        >
                          <GripVertical size={14} className="text-[#525252]" />
                        </div>
                        <button
                          className="flex-1 flex items-center gap-1.5 active:opacity-70"
                          onClick={() => setLogSuperset(item.superset)}
                        >
                          <Link2 size={12} className="text-[#fd9a00]" />
                          <span className="text-[10px] font-bold text-[#fd9a00] uppercase tracking-[2px]">Superset</span>
                        </button>
                        <button
                          onClick={() => removeSuperset(dayType, item.superset.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-[#262626] active:bg-[#404040] flex-shrink-0"
                        >
                          <X size={10} className="text-[#737373]" />
                        </button>
                      </div>
                      {/* Exercises inside */}
                      <div className="p-2 space-y-1">
                        {item.exercises.map((exercise, exIdx) => (
                          <div key={exercise.id}>
                            <ExerciseCard exercise={exercise} supersetId={item.superset.id} />
                            {exIdx < item.exercises.length - 1 && (
                              <div className="flex items-center justify-center py-1">
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="w-px h-2 bg-[#404040]" />
                                  <Link2 size={10} className="text-[#525252]" />
                                  <div className="w-px h-2 bg-[#404040]" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom — Finish session (always visible, primary style) */}
      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={() => { triggerHaptic(12); setShowFinishConf(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-semibold text-base active:scale-[0.98] hover:bg-white transition-colors"
        >
          <CheckCircle2 size={18} className="text-[#0a0a0a]" />
          Finish session
        </button>
      </div>

      {/* Finish confirmation sheet */}
      {showFinishConf && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full bg-[#1c1c1c] rounded-t-3xl p-6 pb-10 space-y-4">
            <h2 className="text-xl font-semibold text-[#fafafa] text-center">
              Wrap up {trainingDay?.label ?? dayType}?
            </h2>
            <p className="text-sm text-[#737373] text-center">
              {completedToday > 0
                ? `${completedToday}/${dayExercises.length} exercises logged today`
                : 'No exercises logged yet'}
            </p>
            <button
              onClick={handleFinish}
              className="w-full py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-semibold text-sm active:scale-[0.98]"
            >
              Finish session
            </button>
            <button
              onClick={() => setShowFinishConf(false)}
              className="w-full py-3 rounded-full bg-[#262626] text-[#fafafa] font-medium text-sm active:scale-[0.98]"
            >
              Keep going
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {logExercise && (
        <LogWorkoutModal
          exerciseId={logExercise.id}
          exerciseName={logExercise.name}
          dayType={dayType}
          supersetId={logState?.supersetId}
          onClose={() => setLogState(null)}
        />
      )}
      {logSuperset && (
        <SupersetLogModal
          superset={logSuperset}
          dayType={dayType}
          onClose={() => setLogSuperset(null)}
        />
      )}
      {showAdd && (
        <AddExerciseModal dayType={dayType} onClose={() => setShowAdd(false)} onAdd={handleAddExercise} />
      )}
      {showEdit && (
        <EditDayModal dayType={dayType} onClose={() => setShowEdit(false)} />
      )}
      {showSuperset && (
        <SupersetModal dayType={dayType} onClose={() => setShowSuperset(false)} />
      )}
    </div>
  );
}
