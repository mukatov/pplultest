import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trophy, ChevronLeft, Clock, Link2, X } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { Exercise, Superset } from '../types';
import LogWorkoutModal from '../components/LogWorkoutModal';
import AddExerciseModal from '../components/AddExerciseModal';
import EditDayModal from '../components/EditDayModal';
import SupersetModal from '../components/SupersetModal';

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
        const ssExercises = ss.exerciseIds
          .map(id => exercises.find(e => e.id === id))
          .filter((e): e is Exercise => !!e);
        items.push({ kind: 'superset', superset: ss, exercises: ssExercises });
      }
    } else {
      const ex = exercises.find(e => e.id === eid);
      if (ex) items.push({ kind: 'standalone', exercise: ex });
    }
  }

  return items;
}

export default function TrainingDay() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const dayType = day ?? '';

  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { exercises, getLastWorkout, getPersonalRecord, updateDayExercises, removeSuperset } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const [logState, setLogState] = useState<{ exerciseId: string; supersetId?: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSuperset, setShowSuperset] = useState(false);

  const activeSplit = splits.find(s => s.id === activeSplitId);
  const trainingDay = activeSplit?.days?.find(d => d.type === dayType);
  const dayExercises = exercises.filter(e => trainingDay?.exerciseIds.includes(e.id));
  const logExercise = logState ? exercises.find(e => e.id === logState.exerciseId) : null;

  const displayItems = buildDisplayItems(
    trainingDay?.exerciseIds ?? [],
    trainingDay?.supersets ?? [],
    exercises
  );

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

  function ExerciseCard({ exercise, supersetId }: { exercise: Exercise; supersetId?: string }) {
    const last = currentUser ? getLastWorkout(exercise.id, currentUser.id) : undefined;
    const pr = currentUser ? getPersonalRecord(exercise.id, currentUser.id) : undefined;
    const maxWeight = last ? Math.max(...last.sets.map(s => s.weight)) : 0;
    const totalSets = last?.sets.length ?? 0;

    return (
      <button
        onClick={() => setLogState({ exerciseId: exercise.id, supersetId })}
        className="w-full bg-[#262626] hover:bg-[#2e2e2e] rounded-2xl px-4 py-5 text-center transition-all active:scale-[0.98]"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="w-6" />
          <h3 className="font-semibold text-[#fafafa] uppercase tracking-wide text-sm">
            {exercise.name}
          </h3>
          {pr ? (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <Trophy size={11} />
              {pr.weight}kg
            </span>
          ) : <div className="w-6" />}
        </div>
        <p className="text-xs text-[#737373]">{exercise.muscleGroups.join(' · ')}</p>
        {last ? (
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-xs text-[#525252] flex items-center gap-1">
              <Clock size={11} />
              {formatDate(last.date)}
            </span>
            <span className="text-xs text-[#525252]">
              {totalSets} sets · {maxWeight}kg
            </span>
          </div>
        ) : (
          <p className="text-xs text-[#525252] mt-2">Tap to log sets</p>
        )}
      </button>
    );
  }

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
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {displayItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#737373] font-medium">No exercises yet.</p>
            <p className="text-[#525252] text-sm mt-1">Add exercises to get started.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-6 px-6 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] text-sm font-medium"
            >
              Add exercises
            </button>
          </div>
        ) : (
          displayItems.map(item => {
            if (item.kind === 'standalone') {
              return <ExerciseCard key={item.exercise.id} exercise={item.exercise} />;
            }

            // Superset card
            return (
              <div
                key={item.superset.id}
                className="bg-[#1c1c1c] rounded-2xl overflow-hidden border border-[#333]"
              >
                {/* Superset header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#333]">
                  <div className="flex items-center gap-1.5">
                    <Link2 size={12} className="text-[#fd9a00]" />
                    <span className="text-[10px] font-bold text-[#fd9a00] uppercase tracking-[2px]">Superset</span>
                  </div>
                  <button
                    onClick={() => removeSuperset(dayType, item.superset.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-[#262626] active:bg-[#404040]"
                  >
                    <X size={10} className="text-[#737373]" />
                  </button>
                </div>

                {/* Exercises inside superset */}
                <div className="p-2 space-y-1">
                  {item.exercises.map((exercise, idx) => (
                    <div key={exercise.id}>
                      <ExerciseCard exercise={exercise} supersetId={item.superset.id} />
                      {idx < item.exercises.length - 1 && (
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
            );
          })
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-4 py-6 flex gap-3">
        <button
          onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-sm active:scale-[0.98]"
        >
          <Plus size={16} />
          Add exercise
        </button>
        {dayExercises.length >= 2 && (
          <button
            onClick={() => setShowSuperset(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#262626] text-[#fafafa] font-medium text-sm active:scale-[0.98] border border-[#404040]"
          >
            <Link2 size={16} />
            Superset
          </button>
        )}
      </div>

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
      {showAdd && (
        <AddExerciseModal
          dayType={dayType}
          onClose={() => setShowAdd(false)}
          onAdd={handleAddExercise}
        />
      )}
      {showEdit && (
        <EditDayModal
          dayType={dayType}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showSuperset && (
        <SupersetModal
          dayType={dayType}
          onClose={() => setShowSuperset(false)}
        />
      )}
    </div>
  );
}
