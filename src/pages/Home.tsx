import { useState } from 'react';
import { Dumbbell, Play, Calendar, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType } from '../types';
import StartSessionModal from '../components/StartSessionModal';
import { useNavigate } from 'react-router-dom';

const DAY_LABELS: Record<DayType, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};
const DAY_COLORS: Record<DayType, string> = {
  push: '#6366f1', pull: '#8b5cf6', legs: '#a855f7', upper: '#3b82f6', lower: '#06b6d4',
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
  const [showPicker, setShowPicker] = useState(false);

  if (!currentUser) return null;

  const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${currentUser.id}:`));

  // Last 5 sessions across all day types
  const recentSessions = [...userSets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((ws, idx, arr) => arr.findIndex(w => w.dayType === ws.dayType && w.date.split('T')[0] === ws.date.split('T')[0]) === idx)
    .slice(0, 3);

  function exerciseCount(dayType: DayType): number {
    return trainingDays.find(d => d.type === dayType)?.exerciseIds.length ?? 0;
  }

  function lastTrainedLabel(dayType: DayType): string {
    const sessions = userSets.filter(ws => ws.dayType === dayType);
    if (sessions.length === 0) return 'Never';
    const latest = sessions.reduce((a, b) => (a.date > b.date ? a : b));
    return daysSince(latest.date);
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

      {/* Start Workout CTA */}
      <div className="px-4 mb-6">
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
        >
          <Play size={22} className="text-white fill-white" />
          <span className="text-lg font-bold text-white">Start Workout</span>
        </button>
      </div>

      {/* Quick access */}
      <div className="px-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Access</h2>
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(DAY_LABELS) as DayType[]).map(type => (
            <button
              key={type}
              onClick={() => navigate(`/${type}`)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm active:scale-95 transition-all"
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: DAY_COLORS[type] + '25' }}
              >
                <div
                  className="w-2 h-2 rounded-full mx-auto mt-2"
                  style={{ backgroundColor: DAY_COLORS[type] }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600">{DAY_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Session overview */}
      <div className="px-4 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Session Overview</h2>
        <div className="space-y-2">
          {(Object.keys(DAY_LABELS) as DayType[]).map(type => (
            <button
              key={type}
              onClick={() => navigate(`/${type}`)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm transition-all text-left"
            >
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ backgroundColor: DAY_COLORS[type] }}
              />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm">{DAY_LABELS[type]}</span>
                <span className="text-gray-400 text-xs ml-2">{exerciseCount(type)} exercises</span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{lastTrainedLabel(type)}</span>
              <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentSessions.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {recentSessions.map((ws, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <Calendar size={14} className="text-gray-300 flex-shrink-0" />
                <span className="font-medium text-gray-700 text-sm capitalize">{ws.dayType}</span>
                <span className="text-xs text-gray-400">{ws.sets.length} sets</span>
                <span className="ml-auto text-xs text-gray-400">{daysSince(ws.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPicker && <StartSessionModal onClose={() => setShowPicker(false)} />}
    </div>
  );
}
