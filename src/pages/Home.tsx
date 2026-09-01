import { useState, useRef, useEffect } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptic';
import { useT } from '../hooks/useT';
import BottomActionBar from '../components/BottomActionBar';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Home() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const splits      = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const workoutSets   = useWorkoutStore(s => s.workoutSets);
  const finishedDays  = useWorkoutStore(s => s.finishedDays);
  const { currentUser } = useAuthStore();
  const t = useT();

  const activeSplit = splits.find(s => s.id === activeSplitId) ?? splits[0];
  const days        = activeSplit?.days ?? [];

  // ─── Determine initial selected day ────────────────────────────────────────
  // After a day is finished, start on the NEXT day in the split order.
  function getInitialDay(): string {
    if (days.length === 0) return '';
    // Find the most recently finished day that exists in this split
    let lastFinishedIdx = -1;
    let mostRecentDate  = '';
    for (const [dayType, dateStr] of Object.entries(finishedDays)) {
      if (dateStr > mostRecentDate) {
        const idx = days.findIndex(d => d.type === dayType);
        if (idx !== -1) { lastFinishedIdx = idx; mostRecentDate = dateStr; }
      }
    }
    if (lastFinishedIdx !== -1) {
      return days[(lastFinishedIdx + 1) % days.length].type;
    }
    return days[0].type;
  }

  const [selected, setSelected]   = useState<string>(getInitialDay);
  const [toast, setToast]         = useState<{ label: string } | null>(null);
  const [countdown, setCountdown] = useState(5);
  const cardRefs    = useRef<Record<string, HTMLButtonElement>>({});
  const toastTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRaf   = useRef<number | null>(null);
  const didRedirect = useRef(false);

  // ─── On mount: redirect to unfinished active workout (cold start only) ───────
  useEffect(() => {
    // Only redirect on cold start (history index 0 means the user typed the URL
    // or refreshed — not navigated back from a training screen).
    const isColdStart = (window.history.state?.idx ?? 0) === 0;
    if (!isColdStart || didRedirect.current || !currentUser) return;
    didRedirect.current = true;
    const today = new Date().toDateString();
    // Find dayTypes that have sets logged today but are NOT marked finished today
    const activeDayTypes = new Set(
      workoutSets
        .filter(ws =>
          ws.exerciseId.startsWith(`${currentUser.id}:`) &&
          new Date(ws.date).toDateString() === today
        )
        .map(ws => ws.dayType)
    );
    for (const dayType of activeDayTypes) {
      if (finishedDays[dayType] !== today && days.some(d => d.type === dayType)) {
        navigate(`/${dayType}`, { replace: true });
        return;
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Scroll selected card into view on mount ───────────────────────────────
  useEffect(() => {
    if (!selected) return;
    requestAnimationFrame(() => {
      cardRefs.current[selected]?.scrollIntoView({
        behavior: 'instant' as ScrollBehavior,
        inline: 'center',
        block: 'nearest',
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Finish toast from navigation state ────────────────────────────────────
  useEffect(() => {
    const state = location.state as { finishedDay?: string } | null;
    if (state?.finishedDay) {
      setToast({ label: state.finishedDay });
      setCountdown(5);
      window.history.replaceState({}, '');
      // Also scroll to newly selected day (next after finished)
      requestAnimationFrame(() => {
        const newSelected = getInitialDay();
        setSelected(newSelected);
        cardRefs.current[newSelected]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ─── Last workout date per day ────────────────────────────────────────────
  function lastWorkoutDate(dayType: string): string | null {
    const entry = [...workoutSets]
      .filter(ws => ws.exerciseId.startsWith(`${currentUser!.id}:`) && ws.dayType === dayType)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    if (!entry) return null;
    return entry.date;
  }

  function daysAgoLabel(dateStr: string): string {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (d === 0) return t.today;
    if (d === 1) return t.yesterday;
    return t.dAgo(d);
  }

  const today      = DAYS_OF_WEEK[new Date().getDay()];
  const handleStart = () => { triggerHaptic(12); navigate(`/${selected}`); };
  const handleUndo  = () => {
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
      <div className="flex items-center px-4 py-3 pt-10">
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">
          {activeSplit?.name ?? 'PPL/UL'}
        </h1>
      </div>

      {/* Center content — pb-28 offsets the fixed bottom nav so justify-center lands above it */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 pb-28">
        <p className="text-lg font-semibold text-[#fafafa] text-center px-4">
          {t.whatWorkout}
        </p>

        {/* Carousel */}
        <div className="h-[228px] flex items-center w-full overflow-hidden">
          <div
            className="flex items-center gap-3 overflow-x-auto w-full h-full py-2"
            style={{
              scrollbarWidth: 'none',
              scrollSnapType: 'x mandatory',
              paddingLeft:  'calc(50vw - 100px)',
              paddingRight: 'calc(50vw - 100px)',
            }}
            onScroll={handleScroll}
          >
            {days.map(day => {
              const isSelected = selected === day.type;
              const count      = day.exerciseIds.length;
              const lastDate   = lastWorkoutDate(day.type);
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
                  <span className={`text-xs mt-1 ${isSelected ? 'text-[#737373]' : 'text-[#737373]'}`}>
                    {count} {t.exercises}
                  </span>
                  {lastDate && (
                    <span className="text-[10px] mt-1.5 text-[#525252] px-3 text-center leading-tight">
                      {t.lastWorkout} · {daysAgoLabel(lastDate)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day label */}
        <p className="text-sm uppercase tracking-[1.5px] text-[#fafafa]">{today}</p>
      </div>

      {/* Finish toast */}
      {toast && (
        <div className="fixed bottom-28 left-4 right-4 z-50">
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

      <BottomActionBar active="home" onWorkout={handleStart} />
    </div>
  );
}
