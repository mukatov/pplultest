import { useState, useRef, useCallback } from 'react';
import { Play, Settings, LogOut } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Home() {
  const navigate = useNavigate();
  const { trainingDays } = useWorkoutStore();
  const { currentUser, logout } = useAuthStore();
  const [selected, setSelected] = useState<string>(() => trainingDays[0]?.type ?? '');
  const cardRefs = useRef<Record<string, HTMLButtonElement>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!currentUser) return null;

  const today = DAYS_OF_WEEK[new Date().getDay()];

  const syncSelected = useCallback(() => {
    if (programmaticScroll.current) return;
    const container = scrollRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.offsetWidth / 2;
    let closest: string | null = null;
    let minDist = Infinity;
    for (const day of trainingDays) {
      const el = cardRefs.current[day.type];
      if (!el) continue;
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) { minDist = dist; closest = day.type; }
    }
    if (closest && closest !== selected) setSelected(closest);
  }, [trainingDays, selected]);

  const handleCardClick = (type: string) => {
    setSelected(type);
    if (programmaticScroll.current) clearTimeout(programmaticScroll.current);
    programmaticScroll.current = setTimeout(() => { programmaticScroll.current = null; }, 600);
    cardRefs.current[type]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          PPL/UL
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
        <p className="px-4 text-lg font-semibold text-[#fafafa] text-center">
          What workout are we doing today?
        </p>

        {/* Carousel — full width, no outer px-4 */}
        <div
          ref={scrollRef}
          onScroll={syncSelected}
          className="flex items-center gap-3 overflow-x-auto w-full pb-2"
          style={{
            scrollbarWidth: 'none',
            scrollSnapType: 'x mandatory',
            paddingLeft: 'calc(50vw - 100px)',
            paddingRight: 'calc(50vw - 100px)',
          }}
        >
          {trainingDays.map(day => {
            const isSelected = selected === day.type;
            return (
              <button
                key={day.type}
                ref={el => { if (el) cardRefs.current[day.type] = el; }}
                onClick={() => handleCardClick(day.type)}
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
                  {day.exerciseIds.length} exercises
                </span>
              </button>
            );
          })}
        </div>

        {/* Day label */}
        <p className="px-4 text-sm uppercase tracking-[1.5px] text-[#fafafa]">
          {today}
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-6">
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
