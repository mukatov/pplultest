import { useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType } from '../types';

const DAY_CONFIG: { type: DayType; label: string; subtitle: string; color: string }[] = [
  { type: 'push', label: 'Push', subtitle: 'Chest · Shoulders · Triceps', color: '#6366f1' },
  { type: 'pull', label: 'Pull', subtitle: 'Back · Biceps', color: '#8b5cf6' },
  { type: 'legs', label: 'Legs', subtitle: 'Quads · Hamstrings · Calves', color: '#a855f7' },
  { type: 'upper', label: 'Upper', subtitle: 'Full Upper Body', color: '#3b82f6' },
  { type: 'lower', label: 'Lower', subtitle: 'Full Lower Body', color: '#06b6d4' },
];

function daysSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export default function Home() {
  const navigate = useNavigate();
  const { trainingDays, workoutSets } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  if (!currentUser) return null;

  const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${currentUser.id}:`));

  function lastTrainedLabel(dayType: DayType): string {
    const sessions = userSets.filter(ws => ws.dayType === dayType);
    if (sessions.length === 0) return 'Never trained';
    const latest = sessions.reduce((a, b) => (a.date > b.date ? a : b));
    return daysSince(latest.date);
  }

  function exerciseCount(dayType: DayType): number {
    return trainingDays.find(d => d.type === dayType)?.exerciseIds.length ?? 0;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="px-4 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={20} className="text-indigo-600" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            PPL/UL Tracker
          </h1>
        </div>
        <p className="text-gray-500 text-sm">Hey, {currentUser.username} 👋</p>
      </div>

      {/* Session picker */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Start a Session</h2>
        <p className="text-sm text-gray-400 mb-4">Choose a training type to begin</p>
        <div className="space-y-3">
          {DAY_CONFIG.map(({ type, label, subtitle, color }) => {
            const count = exerciseCount(type);
            const last = lastTrainedLabel(type);
            return (
              <button
                key={type}
                onClick={() => navigate(`/${type}`)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm active:scale-[0.98] hover:shadow-md hover:border-gray-300 transition-all text-left"
                style={{ borderLeftWidth: 3, borderLeftColor: color }}
              >
                {/* Color icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: color + '18' }}
                >
                  <Dumbbell size={18} style={{ color }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base text-gray-900">{label}</div>
                  <div className="text-gray-500 text-sm truncate">{subtitle}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{count} exercises</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{last}</span>
                  </div>
                </div>

                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
