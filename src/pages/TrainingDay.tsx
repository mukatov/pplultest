import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trophy, ChevronLeft, Clock } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { Exercise } from '../types';
import LogWorkoutModal from '../components/LogWorkoutModal';
import AddExerciseModal from '../components/AddExerciseModal';
import EditDayModal from '../components/EditDayModal';

export default function TrainingDay() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const dayType = day ?? '';

  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { exercises, getLastWorkout, getPersonalRecord, updateDayExercises } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const [logExerciseId, setLogExerciseId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const activeSplit = splits.find(s => s.id === activeSplitId);
  const trainingDay = activeSplit?.days.find(d => d.type === dayType);
  const dayExercises = exercises.filter(e => trainingDay?.exerciseIds.includes(e.id));
  const logExercise = logExerciseId ? exercises.find(e => e.id === logExerciseId) : null;

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
        {dayExercises.length === 0 ? (
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
          dayExercises.map(exercise => {
            const last = currentUser ? getLastWorkout(exercise.id, currentUser.id) : undefined;
            const pr = currentUser ? getPersonalRecord(exercise.id, currentUser.id) : undefined;
            const maxWeight = last ? Math.max(...last.sets.map(s => s.weight)) : 0;
            const totalSets = last?.sets.length ?? 0;

            return (
              <button
                key={exercise.id}
                onClick={() => setLogExerciseId(exercise.id)}
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
          })
        )}
      </div>

      {/* Bottom action */}
      <div className="px-4 py-6 flex gap-3">
        <button
          onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-sm active:scale-[0.98]"
        >
          <Plus size={16} />
          Add exercise
        </button>
      </div>

      {/* Modals */}
      {logExercise && (
        <LogWorkoutModal
          exerciseId={logExercise.id}
          exerciseName={logExercise.name}
          dayType={dayType}
          onClose={() => setLogExerciseId(null)}
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
    </div>
  );
}
