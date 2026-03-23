import { useState } from 'react';
import { Play, Settings, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType } from '../types';
import { useNavigate } from 'react-router-dom';

const DAYS: { type: DayType; label: string }[] = [
  { type: 'push',  label: 'PUSH'  },
  { type: 'pull',  label: 'PULL'  },
  { type: 'legs',  label: 'LEGS'  },
  { type: 'upper', label: 'UPPER' },
  { type: 'lower', label: 'LOWER' },
];

const DAY_LABELS: Record<DayType, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

function daysSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${diff}d ago`;
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
}

export default function Home() {
  const navigate = useNavigate();
  const { trainingDays, workoutSets } = useWorkoutStore();
  const { currentUser } = useAuthStore();
  const [selected, setSelected] = useState<DayType>('push');

  if (!currentUser) return null;

  const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${currentUser.id}:`));

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
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2">
        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#262626] flex-shrink-0">
          <ChevronRight size={16} className="text-[#fafafa] rotate-180" />
        </button>
        <p className="flex-1 text-center text-[3rem] font-semibold leading-[3rem] tracking-[-0.09375rem] text-[#fafafa]">
          PPL/UL
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#262626] flex-shrink-0"
        >
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      </div>

      {/* Workout picker */}
      <div className="flex flex-col items-center gap-6 mt-8 flex-1">
        <p className="text-lg font-semibold text-[#fafafa] text-center px-4">
          What workout are we doing today?
        </p>

        {/* Horizontal scroll cards */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory w-full px-4 pb-1 scrollbar-hide">
          {DAYS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelected(type)}
              className={`flex-shrink-0 snap-center w-[200px] h-[200px] rounded-3xl flex items-center justify-center transition-colors active:scale-[0.97] ${
                selected === type
                  ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                  : 'bg-[#262626] text-[#fafafa]'
              }`}
            >
              <span className="text-[1.875rem] font-semibold tracking-[-0.0625rem]">{label}</span>
            </button>
          ))}
        </div>

        <p className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#fafafa] text-center">
          {todayLabel()}
        </p>
      </div>

      {/* Session overview */}
      <div className="px-4 mt-6 mb-4">
        <p className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3] mb-3">
          Session Overview
        </p>
        <div className="space-y-2">
          {DAYS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => navigate(`/${type}`)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#262626] rounded-2xl border border-[#404040] text-left transition-colors hover:bg-[#2a2a2a] active:scale-[0.99]"
            >
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-[#fafafa] text-sm">{label}</span>
                <span className="text-[#a3a3a3] text-xs ml-2">{exerciseCount(type)} exercises</span>
              </div>
              <span className="text-xs text-[#a3a3a3] flex-shrink-0">{lastTrainedLabel(type)}</span>
              <ChevronRight size={14} className="text-[#525252] flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {recentSessions.length > 0 && (
        <div className="px-4 mb-4">
          <p className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3] mb-3">
            Recent Activity
          </p>
          <div className="space-y-2">
            {recentSessions.map((ws, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 bg-[#262626] rounded-2xl border border-[#404040]"
              >
                <span className="font-medium text-[#fafafa] text-sm capitalize">{DAY_LABELS[ws.dayType]}</span>
                <span className="text-xs text-[#a3a3a3]">{ws.sets.length} sets</span>
                <span className="ml-auto text-xs text-[#a3a3a3]">{daysSince(ws.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start workout button */}
      <div className="px-4 pb-4 pt-2 flex-shrink-0">
        <button
          onClick={() => navigate(`/${selected}`)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-base transition-all active:scale-[0.98] hover:bg-white"
        >
          <Play size={16} className="fill-[#0a0a0a]" />
          Start workout
        </button>
      </div>
    </div>
  );
}
