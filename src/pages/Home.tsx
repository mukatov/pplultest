import { useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType } from '../types';

const DAY_CONFIG: { type: DayType; label: string; subtitle: string; accent: string; border: string }[] = [
  { type: 'push', label: 'Push', subtitle: 'Chest · Shoulders · Triceps', accent: 'bg-indigo-500', border: 'border-indigo-500/30' },
  { type: 'pull', label: 'Pull', subtitle: 'Back · Biceps', accent: 'bg-violet-500', border: 'border-violet-500/30' },
  { type: 'legs', label: 'Legs', subtitle: 'Quads · Hamstrings · Calves', accent: 'bg-purple-500', border: 'border-purple-500/30' },
  { type: 'upper', label: 'Upper', subtitle: 'Upper Body Compound', accent: 'bg-blue-500', border: 'border-blue-500/30' },
  { type: 'lower', label: 'Lower', subtitle: 'Lower Body Compound', accent: 'bg-cyan-500', border: 'border-cyan-500/30' },
];

const TEXT_COLORS: Record<DayType, string> = {
  push: 'text-indigo-400',
  pull: 'text-violet-400',
  legs: 'text-purple-400',
  upper: 'text-blue-400',
  lower: 'text-cyan-400',
};

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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="px-4 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Dumbbell size={20} className="text-indigo-400" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            PPL/UL Tracker
          </h1>
        </div>
        <p className="text-gray-400 text-sm">Hey, {currentUser.username} 👋</p>
      </div>

      {/* Session picker */}
      <div className="px-4">
        <h2 className="text-xl font-bold text-white mb-4">Start a Session</h2>
        <div className="space-y-3">
          {DAY_CONFIG.map(({ type, label, subtitle, accent, border }) => {
            const count = exerciseCount(type);
            const last = lastTrainedLabel(type);
            return (
              <button
                key={type}
                onClick={() => navigate(`/${type}`)}
                className={`w-full flex items-center gap-4 p-4 bg-gray-900 rounded-2xl border ${border} active:scale-[0.98] transition-transform text-left`}
              >
                {/* Color accent bar */}
                <div className={`w-1 self-stretch rounded-full ${accent} shrink-0`} />

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-base ${TEXT_COLORS[type]}`}>{label}</div>
                  <div className="text-gray-400 text-sm truncate">{subtitle}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">{count} exercises</span>
                    <span className="text-gray-700">·</span>
                    <span className="text-xs text-gray-600">{last}</span>
                  </div>
                </div>

                <ChevronRight size={18} className="text-gray-600 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
