import { useState } from 'react';
import { Play, Settings, LogOut } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType } from '../types';
import { useNavigate } from 'react-router-dom';

const DAY_TYPES: DayType[] = ['push', 'pull', 'legs', 'upper', 'lower'];

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Home() {
  const navigate = useNavigate();
  const { trainingDays } = useWorkoutStore();
  const { currentUser, logout } = useAuthStore();
  const [selected, setSelected] = useState<DayType>('push');

  if (!currentUser) return null;

  const today = DAYS_OF_WEEK[new Date().getDay()];

  const handleStart = () => {
    navigate(`/${selected}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  function exerciseCount(type: DayType) {
    return trainingDays.find(d => d.type === type)?.exerciseIds.length ?? 0;
  }

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10">
        <button
          onClick={handleLogout}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <LogOut size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">
          PPL/UL
        </h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <p className="text-lg font-semibold text-[#fafafa] text-center">
          What workout are we doing today?
        </p>

        {/* Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto w-full justify-center pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {DAY_TYPES.map(type => {
            const isSelected = selected === type;
            const count = exerciseCount(type);
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={`flex-shrink-0 flex flex-col items-center justify-center rounded-3xl transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#262626] text-[#fafafa] w-[200px] h-[200px]'
                    : 'bg-[#f5f5f5] text-[#0a0a0a] w-[160px] h-[160px]'
                }`}
              >
                <span className={`font-semibold tracking-[-1px] ${isSelected ? 'text-3xl' : 'text-2xl'}`}>
                  {type.toUpperCase()}
                </span>
                <span className={`text-xs mt-1 ${isSelected ? 'text-[#a3a3a3]' : 'text-[#737373]'}`}>
                  {count} exercises
                </span>
              </button>
            );
          })}
        </div>

        {/* Day label */}
        <p className="text-sm uppercase tracking-[1.5px] text-[#fafafa]">
          {today}
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-6">
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-base transition-all active:scale-[0.98] hover:bg-white"
        >
          <Play size={16} className="fill-[#0a0a0a]" />
          Start workout
        </button>
      </div>
    </div>
  );
}
