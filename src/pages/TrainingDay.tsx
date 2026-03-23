import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Settings, Trophy, ChevronLeft, Search } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType, Exercise } from '../types';
import LogWorkoutModal from '../components/LogWorkoutModal';
import AddExerciseModal from '../components/AddExerciseModal';
import EditDayModal from '../components/EditDayModal';

export default function TrainingDay() {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const dayType = day as DayType;
  const { exercises, trainingDays, getLastWorkout, getPersonalRecord, updateDayExercises } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const [logExerciseId, setLogExerciseId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const trainingDay = trainingDays.find(d => d.type === dayType);
  const dayExercises = exercises.filter(e => trainingDay?.exerciseIds.includes(e.id));

  const logExercise = logExerciseId ? exercises.find(e => e.id === logExerciseId) : null;

  function handleAddExercise(exercise: Exercise) {
    const currentIds = trainingDay?.exerciseIds ?? [];
    if (!currentIds.includes(exercise.id)) {
      updateDayExercises(dayType, [...currentIds, exercise.id]);
    }
  }

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#262626] flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <p className="flex-1 text-center text-[3rem] font-semibold leading-[3rem] tracking-[-0.09375rem] text-[#fafafa] uppercase">
          {dayType}
        </p>
        <button
          onClick={() => setShowEdit(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#262626] flex-shrink-0"
        >
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {dayExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-[#a3a3a3] font-medium text-center">No exercises yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-sm"
            >
              <Plus size={16} />
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
                className="w-full flex items-center justify-center px-6 py-[var(--2xl,2rem)] rounded-full bg-[#262626] border border-[#404040] text-center transition-colors hover:bg-[#2a2a2a] active:scale-[0.99] relative"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[1.25rem] font-semibold tracking-[0] text-[#fafafa] uppercase">
                    {exercise.name}
                  </span>
                  {(last || pr) && (
                    <div className="flex items-center gap-3">
                      {last && (
                        <span className="text-xs text-[#a3a3a3]">
                          {totalSets} sets · {maxWeight}kg
                        </span>
                      )}
                      {pr && (
                        <span className="flex items-center gap-1 text-xs text-[#fbbf24]">
                          <Trophy size={10} />
                          {pr.weight}kg PR
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex gap-3 flex-shrink-0">
        <button
          onClick={() => setShowAdd(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-sm transition-all active:scale-[0.98] hover:bg-white"
        >
          <Plus size={16} />
          Add new exercise
        </button>
        <button
          onClick={() => setShowEdit(true)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[#404040] flex-shrink-0"
        >
          <Search size={16} className="text-[#fafafa]" />
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
