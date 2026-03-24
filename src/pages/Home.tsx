import { useState, useRef } from 'react';
import { Play, Settings, LogOut } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Home() {
  const navigate = useNavigate();
  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { currentUser, logout } = useAuthStore();

  const activeSplit = splits.find(s => s.id === activeSplitId) ?? splits[0];
  const days = activeSplit?.days ?? [];

  const [selected, setSelected] = useState<string>(days[0]?.type ?? '');
  const cardRefs = useRef<Record<string, HTMLButtonElement>>({});

  if (!currentUser) return null;

  const today = DAYS_OF_WEEK[new Date().getDay()];

  const handleStart = () => {
    navigate(`/${selected}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closest = days[0]?.type ?? '';
    let minDist = Infinity;
    for (const day of days) {
      const el = cardRefs.current[day.type];
      if (!el) continue;
      const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - containerCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = day.type;
      }
    }
    if (closest) setSelected(closest);
  };

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
          {activeSplit?.name ?? 'PPL/UL'}
        </h1>
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <p className="text-lg font-semibold text-[#fafafa] text-center px-4">
          What workout are we doing today?
        </p>

        {/* Carousel */}
        <div
          className="flex items-center gap-3 overflow-x-auto w-full pb-2"
          style={{
            scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory',
            paddingLeft: 'calc(50vw - 100px)',
            paddingRight: 'calc(50vw - 100px)',
          }}
          onScroll={handleScroll}
        >
          {days.map(day => {
            const isSelected = selected === day.type;
            const count = day.exerciseIds.length;
            return (
              <button
                key={day.type}
                ref={el => { if (el) cardRefs.current[day.type] = el; }}
                onClick={() => {
                  setSelected(day.type);
                  cardRefs.current[day.type]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }}
                style={{ scrollSnapAlign: 'center' }}
                className={`flex-shrink-0 flex flex-col items-center justify-center rounded-3xl transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-[#f5f5f5] text-[#0a0a0a] w-[200px] h-[200px]'
                    : 'bg-[#262626] text-[#fafafa] w-[160px] h-[160px]'
                }`}
              >
                <span className={`font-semibold tracking-[-1px] ${isSelected ? 'text-3xl' : 'text-2xl'}`}>
                  {day.label.toUpperCase()}
                </span>
                <span className={`text-xs mt-1 ${isSelected ? 'text-[#737373]' : 'text-[#a3a3a3]'}`}>
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
