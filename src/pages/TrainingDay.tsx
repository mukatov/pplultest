import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Pencil, Trophy, ChevronRight, Dumbbell, Clock } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType, Exercise } from '../types';
import LogWorkoutModal from '../components/LogWorkoutModal';
import AddExerciseModal from '../components/AddExerciseModal';
import EditDayModal from '../components/EditDayModal';

const DAY_CONFIG: Record<DayType, { headerBg: string; accent: string; accentText: string; description: string }> = {
  push:  { headerBg: 'bg-indigo-50 border-b border-indigo-100',  accent: '#6366f1', accentText: 'text-indigo-600', description: 'Chest · Shoulders · Triceps' },
  pull:  { headerBg: 'bg-violet-50 border-b border-violet-100',  accent: '#8b5cf6', accentText: 'text-violet-600', description: 'Back · Biceps · Rear Delts' },
  legs:  { headerBg: 'bg-purple-50 border-b border-purple-100',  accent: '#a855f7', accentText: 'text-purple-600', description: 'Quads · Hamstrings · Glutes · Calves' },
  upper: { headerBg: 'bg-blue-50 border-b border-blue-100',      accent: '#3b82f6', accentText: 'text-blue-600',   description: 'Full Upper Body' },
  lower: { headerBg: 'bg-cyan-50 border-b border-cyan-100',      accent: '#06b6d4', accentText: 'text-cyan-600',   description: 'Full Lower Body' },
};

export default function TrainingDay() {
  const { day } = useParams<{ day: string }>();
  const dayType = day as DayType;
  const { exercises, trainingDays, getLastWorkout, getPersonalRecord, updateDayExercises } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const [logExerciseId, setLogExerciseId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const trainingDay = trainingDays.find(d => d.type === dayType);
  const dayExercises = exercises.filter(e => trainingDay?.exerciseIds.includes(e.id));
  const config = DAY_CONFIG[dayType] || DAY_CONFIG.push;

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
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className={config.headerBg}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className={`text-3xl font-bold capitalize ${config.accentText}`}>
                {dayType} Day
              </h1>
              <p className="text-gray-500 text-sm mt-1">{config.description}</p>
              <p className="text-gray-400 text-xs mt-2">{dayExercises.length} exercises</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm text-gray-600 transition-all shadow-sm"
              >
                <Pencil size={14} />
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white transition-all shadow-sm"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add Exercise</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {dayExercises.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell size={40} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No exercises in this session yet.</p>
            <p className="text-gray-400 text-sm mt-1">Add exercises from the library to get started.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm text-white transition-all shadow-sm"
            >
              Add exercises to this session
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {dayExercises.map(exercise => {
              const last = currentUser ? getLastWorkout(exercise.id, currentUser.id) : undefined;
              const pr = currentUser ? getPersonalRecord(exercise.id, currentUser.id) : undefined;
              const maxWeight = last ? Math.max(...last.sets.map(s => s.weight)) : 0;
              const totalSets = last?.sets.length ?? 0;

              return (
                <button
                  key={exercise.id}
                  onClick={() => setLogExerciseId(exercise.id)}
                  className="w-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-4 text-left transition-all group shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {exercise.name}
                        </h3>
                        {pr && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500">
                            <Trophy size={11} />
                            {pr.weight}kg
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{exercise.muscleGroups.join(' · ')}</p>

                      {last ? (
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={11} className="text-gray-400" />
                            {formatDate(last.date)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {totalSets} sets · {maxWeight}kg
                          </span>
                          <div className="flex gap-1">
                            {last.sets.slice(0, 4).map((s, i) => (
                              <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                                {s.weight}×{s.reps}
                              </span>
                            ))}
                            {last.sets.length > 4 && (
                              <span className="text-xs text-gray-400">+{last.sets.length - 4}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-indigo-400 mt-2 font-medium">Tap to log sets →</p>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors mt-1 ml-3 flex-shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
