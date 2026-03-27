import { useState, useRef, useEffect } from 'react';
import { Play, Menu, BarChart2, Settings, User, LogOut } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptic';
import { useT } from '../hooks/useT';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const MENU_PATHS = [
  { key: 'dashboard' as const, icon: BarChart2, path: '/dashboard' },
  { key: 'settings'  as const, icon: Settings,  path: '/settings'  },
  { key: 'profile'   as const, icon: User,      path: '/profile'   },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { currentUser, logout } = useAuthStore();
  const t = useT();

  const activeSplit = splits.find(s => s.id === activeSplitId) ?? splits[0];
  const days = activeSplit?.days ?? [];

  const [selected, setSelected]   = useState<string>(days[0]?.type ?? '');
  const [toast, setToast]         = useState<{ label: string; dayType: string } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [menuOpen, setMenuOpen]   = useState(false);
  const cardRefs   = useRef<Record<string, HTMLButtonElement>>({});
  const toastTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRaf  = useRef<number | null>(null);

  useEffect(() => {
    const state = location.state as { finishedDay?: string } | null;
    if (state?.finishedDay) {
      setToast({ label: state.finishedDay, dayType: selected });
      setCountdown(5);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearInterval(toastTimer.current);
    toastTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(toastTimer.current!); setToast(null); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (toastTimer.current) clearInterval(toastTimer.current); };
  }, [toast]);

  if (!currentUser) return null;

  const today = DAYS_OF_WEEK[new Date().getDay()];
  const handleStart  = () => { triggerHaptic(12); navigate(`/${selected}`); };
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const handleUndo   = () => {
    if (toastTimer.current) clearInterval(toastTimer.current);
    setToast(null);
    navigate(-1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = requestAnimationFrame(() => {
      const containerCenter = container.scrollLeft + container.clientWidth / 2;
      let closest = days[0]?.type ?? '';
      let minDist = Infinity;
      for (const day of days) {
        const el = cardRefs.current[day.type];
        if (!el) continue;
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - containerCenter);
        if (dist < minDist) { minDist = dist; closest = day.type; }
      }
      if (closest && closest !== selected) {
        triggerHaptic(8);
        setSelected(closest);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10">
        <button
          onClick={() => setMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <Menu size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">
          {activeSplit?.name ?? 'PPL/UL'}
        </h1>
        <div className="w-10" />
      </div>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <p className="text-lg font-semibold text-[#fafafa] text-center px-4">
          {t.whatWorkout}
        </p>

        {/* Carousel — fixed height prevents text above/below from jumping */}
        <div className="h-[212px] flex items-center w-full overflow-hidden">
          <div
            className="flex items-center gap-3 overflow-x-auto w-full h-full py-2"
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
                    triggerHaptic(10);
                    if (selected === day.type) {
                      navigate(`/${day.type}`);
                    } else {
                      setSelected(day.type);
                      cardRefs.current[day.type]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                  }}
                  style={{ scrollSnapAlign: 'center' }}
                  className={`flex-shrink-0 flex flex-col items-center justify-center rounded-3xl transition-all duration-300 ease-out active:scale-95 ${
                    isSelected
                      ? 'bg-[#f5f5f5] text-[#0a0a0a] w-[200px] h-[200px]'
                      : 'bg-[#262626] text-[#fafafa] w-[160px] h-[160px]'
                  }`}
                >
                  <span className={`font-semibold tracking-[-1px] ${isSelected ? 'text-3xl' : 'text-2xl'}`}>
                    {day.label.toUpperCase()}
                  </span>
                  <span className={`text-xs mt-1 ${isSelected ? 'text-[#737373]' : 'text-[#a3a3a3]'}`}>
                    {count} {t.exercises}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Day label */}
        <p className="text-sm uppercase tracking-[1.5px] text-[#fafafa]">{today}</p>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-medium text-base transition-all active:scale-[0.98] hover:bg-white"
        >
          <Play size={16} className="fill-[#0a0a0a]" />
          {t.startWorkout}
        </button>
      </div>

      {/* Finish toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50">
          <div className="bg-[#1c1c1c] border border-[#4ade80]/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#4ade80] truncate">
                {toast.label} {t.sessionComplete}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-1000 ${
                      i < countdown ? 'bg-[#4ade80] w-5' : 'bg-[#333] w-5'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={handleUndo}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-[#262626] text-[#fafafa] text-xs font-medium border border-[#404040] active:scale-[0.96]"
            >
              {t.undo}
            </button>
          </div>
        </div>
      )}

      {/* Hamburger menu drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-[#1c1c1c] rounded-t-3xl p-6 pb-10"
            onClick={e => e.stopPropagation()}
          >
            {/* User info */}
            <div className="flex items-center gap-3 pb-5 mb-4 border-b border-[#2a2a2a]">
              <div className="w-11 h-11 rounded-full bg-[#262626] flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-[#525252]" />
              </div>
              <div className="min-w-0">
                <p className="text-[#fafafa] font-semibold text-sm truncate">{currentUser.email}</p>
                <p className="text-[#525252] text-xs">
                  {t.since} {new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {MENU_PATHS.map(({ key, icon: Icon, path }) => (
                <button
                  key={key}
                  onClick={() => { navigate(path); setMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#262626] text-[#fafafa] font-medium text-sm active:bg-[#2e2e2e] transition-colors"
                >
                  <Icon size={18} className="text-[#737373]" />
                  {t[key]}
                </button>
              ))}

              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-[#262626] text-red-400 font-medium text-sm active:bg-[#2e2e2e] transition-colors"
              >
                <LogOut size={18} className="text-red-400" />
                {t.logOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
