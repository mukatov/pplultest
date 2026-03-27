import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Settings, ChevronRight, Check, Minus, Plus, X, ChevronDown, Link2, Download } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType, SetEntry, WorkoutSet } from '../types';
import { triggerHaptic } from '../utils/haptic';

interface Props {
  exerciseId: string;
  exerciseName: string;
  dayType: DayType;
  supersetId?: string;
  onClose: () => void;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartMetric = 'maxWeight' | 'totalVolume' | 'maxReps' | 'est1rm';
type TimeRange   = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

const METRIC_LABELS: Record<ChartMetric, string> = {
  maxWeight:   'Max Weight',
  totalVolume: 'Total Volume',
  maxReps:     'Max Reps',
  est1rm:      'Est. 1RM',
};
const METRIC_UNIT: Record<ChartMetric, string> = {
  maxWeight:   'KG',
  totalVolume: 'KG',
  maxReps:     'reps',
  est1rm:      'KG',
};
const TIME_RANGES: { label: string; value: TimeRange; days: number }[] = [
  { label: '1W',       value: '1w',  days: 7   },
  { label: '1M',       value: '1m',  days: 30  },
  { label: '3M',       value: '3m',  days: 90  },
  { label: '6M',       value: '6m',  days: 180 },
  { label: '1Y',       value: '1y',  days: 365 },
  { label: 'ALL TIME', value: 'all', days: Infinity },
];

const BATCH = 6; // sessions per lazy-load batch

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7)  return `${d}d ago`;
  if (d < 14) return 'last week';
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function computeMetric(ws: WorkoutSet, metric: ChartMetric): number {
  const sets = ws.sets;
  switch (metric) {
    case 'maxWeight':   return Math.max(...sets.map(s => s.weight));
    case 'totalVolume': return Math.round(sets.reduce((sum, s) => sum + s.weight * s.reps, 0));
    case 'maxReps': {
      const mw = Math.max(...sets.map(s => s.weight));
      return Math.max(...sets.filter(s => s.weight === mw).map(s => s.reps));
    }
    case 'est1rm': return Math.round(Math.max(...sets.map(s => s.weight * (1 + s.reps / 30))));
  }
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

const CHART_W = 346, CHART_H = 165, PAD_X = 10, PAD_Y = 14, DOT = 12, HIT = 28;

function LineChart({
  data,
  selectedIndex,
  onSelect,
}: {
  data: { value: number }[];
  selectedIndex: number;
  onSelect: (i: number) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-[#525252]">No data in selected range</p>
      </div>
    );
  }

  const ew = CHART_W - PAD_X * 2;
  const eh = CHART_H - PAD_Y * 2;
  const minV = Math.min(...data.map(d => d.value));
  const maxV = Math.max(...data.map(d => d.value));
  const range = maxV - minV || 1;

  const pts = data.map((d, i) => ({
    x: PAD_X + (data.length === 1 ? ew / 2 : (i / (data.length - 1)) * ew),
    y: PAD_Y + eh - ((d.value - minV) / range) * eh,
  }));

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      preserveAspectRatio="none"
    >
      {data.length > 1 && (
        <polyline
          points={polyline}
          fill="none"
          stroke="#fd9a00"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {pts.map((p, i) => {
        const isSelected = i === selectedIndex;
        return (
          <g key={i} onClick={() => onSelect(i)} style={{ cursor: 'pointer' }}>
            {/* invisible larger hit area */}
            <rect x={p.x - HIT/2} y={p.y - HIT/2} width={HIT} height={HIT} fill="transparent" />
            {/* visible dot */}
            <rect
              x={p.x - DOT/2}
              y={p.y - DOT/2}
              width={DOT}
              height={DOT}
              fill={isSelected ? '#ffffff' : '#fd9a00'}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Trend Dropdown ───────────────────────────────────────────────────────────

function TrendDropdown({ value, onChange }: { value: ChartMetric; onChange: (m: ChartMetric) => void }) {
  const [open, setOpen] = useState(false);
  const metrics: ChartMetric[] = ['maxWeight', 'totalVolume', 'maxReps', 'est1rm'];
  return (
    <div className="relative z-10">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[#404040] rounded-lg px-3 py-2 text-sm"
      >
        <span className="text-[#a3a3a3]">Trend:</span>
        <span className="text-[#fafafa] font-medium">{METRIC_LABELS[value]}</span>
        <ChevronDown size={13} className={`text-[#a3a3a3] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-[#1a1a1a] border border-[#404040] rounded-xl overflow-hidden shadow-xl min-w-[160px]">
          {metrics.map(m => (
            <button
              key={m}
              onClick={() => { onChange(m); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                m === value ? 'bg-[#262626] text-[#fafafa] font-medium' : 'text-[#a3a3a3] hover:bg-[#262626]'
              }`}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Set Grid ─────────────────────────────────────────────────────────────────

function SetGrid({ sets, highlightMax, onRemove }: {
  sets: SetEntry[]; highlightMax: boolean; onRemove?: (i: number) => void;
}) {
  if (sets.length === 0) return null;
  const maxW = highlightMax ? Math.max(...sets.map(s => s.weight)) : -1;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {sets.map((s, i) => {
        const isPR = s.weight === maxW;
        return (
          <div key={i} className={`bg-[#262626] rounded-xl py-3 px-4 flex flex-col items-center gap-1 relative ${isPR ? 'border border-[#fcd34d]' : ''}`}>
            {onRemove && (
              <button onClick={() => onRemove(i)} className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-[#404040] text-[#a3a3a3] active:bg-[#525252]">
                <X size={10} />
              </button>
            )}
            <div className="flex items-end gap-1">
              <span className={`text-xl font-semibold ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>{s.weight}</span>
              <span className={`text-xs uppercase tracking-[1.5px] mb-0.5 ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>KG</span>
              <span className={`text-xl font-semibold mx-1 ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>x</span>
              <span className={`text-xl font-semibold ${isPR ? 'text-[#fcd34d]' : 'text-[#a3a3a3]'}`}>{s.reps}</span>
            </div>
            <span className="text-xs text-[#a3a3a3] uppercase tracking-[1.5px]">set {i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ value, onChange, step, min, label, unit, className }: {
  value: number; onChange: (v: number) => void; step: number; min: number;
  label: string; unit?: string; className?: string;
}) {
  const dec = () => { onChange(Math.max(min, parseFloat((value - step).toFixed(2)))); triggerHaptic(); };
  const inc = () => { onChange(parseFloat((value + step).toFixed(2))); triggerHaptic(); };

  const dragRef  = useRef<{ lastY: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { lastY: e.clientY };
    trackRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dy = dragRef.current.lastY - e.clientY;
    if (Math.abs(dy) >= 8) { if (dy > 0) inc(); else dec(); dragRef.current.lastY = e.clientY; }
  };
  const onUp = () => { dragRef.current = null; setDragging(false); };

  // Weight (decimal step) needs wider number cell; reps (integer) needs narrower
  const numWidthClass = step % 1 !== 0 ? 'w-[6ch]' : 'w-[4ch]';

  return (
    <div className={`bg-[#262626] rounded-3xl flex flex-col items-center gap-2 py-5 px-6 transition-colors ${className ?? 'flex-1'} ${dragging ? 'bg-[#1f1f1f]' : ''}`}>
      <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{label}</p>
      <div ref={trackRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ touchAction: 'none' }} className="flex items-center justify-between w-full cursor-ns-resize select-none">
        <button onClick={dec} className={`w-6 h-6 flex items-center justify-center rounded-[4px] transition-opacity ${value <= min ? 'opacity-30' : ''}`}>
          <Minus size={16} className="text-[#fafafa]" />
        </button>
        <span className={`text-5xl font-mono text-[#fafafa] text-center leading-[48px] shrink-0 ${numWidthClass}`}>{value}</span>
        <button onClick={inc} className="w-6 h-6 flex items-center justify-center rounded-[4px]">
          <Plus size={16} className="text-[#fafafa]" />
        </button>
      </div>
      {unit && <p className="text-xs text-[#fafafa] uppercase tracking-[1.5px]">{unit}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LogWorkoutModal({ exerciseId, exerciseName, dayType, supersetId, onClose }: Props) {
  const { logWorkout, removeWorkout, getWorkoutHistory } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const allHistory  = currentUser ? getWorkoutHistory(exerciseId, currentUser.id) : [];
  const todayStr    = new Date().toDateString();
  // Session logged earlier today (kept in "current session", not yet in history)
  const todaySession = [...allHistory].reverse().find(ws => new Date(ws.date).toDateString() === todayStr);
  // History excludes today — shown only after the session finishes
  const history     = allHistory.filter(ws => new Date(ws.date).toDateString() !== todayStr);
  const historyDesc = [...history].reverse();
  // Reference workout = most recent previous-day session
  const prevWorkout = history.length > 0 ? history[history.length - 1] : undefined;

  const lastMaxW = prevWorkout ? Math.max(...prevWorkout.sets.map(s => s.weight)) : null;
  const lastMaxR = prevWorkout ? (prevWorkout.sets.find(s => s.weight === lastMaxW)?.reps ?? null) : null;

  // Session state — pre-populate from today's session if re-opening after partial log
  const initSets   = todaySession?.sets ?? [];
  const lastTodaySet = todaySession?.sets?.[todaySession.sets.length - 1];
  const initWeight = lastTodaySet?.weight ?? prevWorkout?.sets?.[0]?.weight ?? 20;
  const initReps   = lastTodaySet?.reps   ?? prevWorkout?.sets?.[0]?.reps   ?? 12;

  const [mode, setMode]           = useState<'session' | 'history'>('session');
  const [completedSets, setComp]  = useState<SetEntry[]>(initSets);
  const [weight, setWeight]       = useState(initWeight);
  const [reps,   setReps]         = useState(initReps);
  const [saved,  setSaved]        = useState(false);

  // Chart state
  const [chartMetric,    setChartMetric]    = useState<ChartMetric>('maxWeight');
  const [timeRange,      setTimeRange]      = useState<TimeRange>('3m');
  const [selectedPtIdx,  setSelectedPtIdx]  = useState<number | null>(null);

  // Lazy-load state
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset lazy-load when entering history mode
  useEffect(() => {
    if (mode === 'history') setVisibleCount(BATCH);
  }, [mode]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (mode !== 'history') return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(prev => prev + BATCH); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [mode, sentinelRef.current]);

  // Filtered history for chart
  const now    = Date.now();
  const rangMs = TIME_RANGES.find(r => r.value === timeRange)!.days * 86400000;
  const chartHistory = history.filter(ws => now - new Date(ws.date).getTime() <= rangMs);
  const chartData    = chartHistory.map(ws => ({ value: computeMetric(ws, chartMetric) }));

  // Reset selected point when metric/range changes; default to latest
  useEffect(() => {
    setSelectedPtIdx(chartData.length > 0 ? chartData.length - 1 : null);
  }, [chartMetric, timeRange, chartData.length]);

  const effectiveIdx   = selectedPtIdx ?? (chartData.length > 0 ? chartData.length - 1 : null);
  const displayValue   = effectiveIdx !== null ? chartData[effectiveIdx]?.value ?? null : null;
  const displaySession = effectiveIdx !== null ? chartHistory[effectiveIdx] : null;
  const displayDate    = displaySession
    ? new Date(displaySession.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
    : null;

  // Session handlers
  const handleAddSet = () => {
    const nextIdx = completedSets.length + 1;
    setComp(prev => [...prev, { weight, reps }]);
    const nextSet = prevWorkout?.sets?.[nextIdx];
    if (nextSet) { setWeight(nextSet.weight); setReps(nextSet.reps); }
  };
  const handleRemoveSet = (i: number) => setComp(prev => prev.filter((_, j) => j !== i));
  const handleExportHistory = () => {
    const rows: string[][] = [['Date', 'Set', 'Weight (kg)', 'Reps', 'Volume (kg)']];
    for (const ws of historyDesc) {
      const date = new Date(ws.date).toLocaleDateString('en-GB');
      ws.sets.forEach((s, i) => {
        rows.push([date, String(i + 1), String(s.weight), String(s.reps), String(s.weight * s.reps)]);
      });
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exerciseName.replace(/\s+/g, '_')}_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (!currentUser || completedSets.length === 0) return;
    // Replace today's partial session so history only ever has one entry per day
    if (todaySession) removeWorkout(todaySession.id);
    logWorkout(exerciseId, completedSets, dayType, currentUser.id, supersetId);
    setSaved(true);
    setTimeout(onClose, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col screen-enter">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10 flex-shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0">
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa] uppercase">{dayType}</h1>
        <button className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0">
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      </div>

      {/* Exercise toggle bar */}
      <div className="px-4 pt-2 flex gap-2 flex-shrink-0">
        {mode === 'session' ? (
          <>
            <div className="flex-1 bg-[#f5f5f5] rounded-full py-3 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xl font-semibold text-[#0a0a0a] uppercase truncate px-2">{exerciseName}</span>
              <span className="text-xs text-[#0a0a0a]">current session</span>
            </div>
            {prevWorkout && lastMaxW !== null && (
              <button onClick={() => setMode('history')}
                className="bg-[#262626] rounded-full py-3 px-6 flex flex-col items-center gap-1 flex-shrink-0 active:scale-[0.97] transition-transform">
                <span className="text-xl font-semibold text-[#fafafa]">{lastMaxW}×{lastMaxR}</span>
                <span className="text-xs text-[#737373]">{relativeDate(prevWorkout.date)}</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setMode('session')}
              className="bg-[#262626] rounded-full py-3 px-6 flex flex-col items-center gap-1 flex-shrink-0 active:scale-[0.97] transition-transform">
              <span className="text-xl font-semibold text-[#fafafa]">BACK</span>
              <span className="text-xs text-[#737373]">to session</span>
            </button>
            <div className="flex-1 bg-[#f5f5f5] rounded-full py-3 flex flex-col items-center gap-1 min-w-0">
              <span className="text-xl font-semibold text-[#0a0a0a] uppercase truncate px-2">{exerciseName}</span>
              <span className="text-xs text-[#0a0a0a] uppercase tracking-[1px]">HISTORY</span>
            </div>
            {historyDesc.length > 0 && (
              <button
                onClick={handleExportHistory}
                className="w-12 h-12 flex items-center justify-center bg-[#262626] rounded-full flex-shrink-0 active:scale-[0.97] transition-transform"
                title="Export history"
              >
                <Download size={16} className="text-[#fafafa]" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {mode === 'session' ? (
          <>
            <SetGrid sets={completedSets} highlightMax onRemove={handleRemoveSet} />
            <p className="text-center text-xl font-semibold text-[#fafafa] uppercase tracking-wide">SET {completedSets.length + 1}</p>
            <div className="flex gap-2.5">
              <Stepper value={weight} onChange={setWeight} step={2.5} min={0} label="WEIGHT" unit="KG" className="flex-[3]" />
              <Stepper value={reps}   onChange={setReps}   step={1}   min={1} label="REPS"   className="flex-[2]" />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Chart card */}
            <div className="bg-[#262626] border border-[#404040] rounded-xl p-3 flex flex-col gap-3">
              {/* Dropdown row + selected value */}
              <div className="flex items-start justify-between">
                <TrendDropdown value={chartMetric} onChange={setChartMetric} />
                <div className="text-right">
                  {displayValue !== null ? (
                    <>
                      <div className="flex items-end gap-1 justify-end">
                        <span className="text-[30px] font-semibold text-[#fafafa] leading-none tracking-[-1px]">{displayValue}</span>
                        <span className="text-xs text-[#a3a3a3] uppercase tracking-[1.5px] mb-0.5">{METRIC_UNIT[chartMetric]}</span>
                      </div>
                      {displayDate && (
                        <p className="text-[10px] text-[#525252] mt-0.5">{displayDate}</p>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
              {/* Chart */}
              <div className="h-[165px]">
                <LineChart
                  data={chartData}
                  selectedIndex={effectiveIdx ?? -1}
                  onSelect={i => setSelectedPtIdx(i)}
                />
              </div>
            </div>

            {/* Time range bar */}
            <div className="flex rounded-lg overflow-hidden border border-[#404040]">
              {TIME_RANGES.map((r, i) => (
                <button key={r.value} onClick={() => { setTimeRange(r.value); setSelectedPtIdx(null); }}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    timeRange === r.value ? 'bg-[rgba(255,255,255,0.15)] text-[#fafafa]' : 'text-[#737373]'
                  } ${i > 0 ? 'border-l border-[#404040]' : ''}`}>
                  {r.label}
                </button>
              ))}
            </div>

            {/* Session history list (lazy loaded) */}
            {historyDesc.slice(0, visibleCount).map(ws => {
              const dateStr = new Date(ws.date).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long',
              }).toUpperCase();
              return (
                <div key={ws.id} className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-center text-sm text-[#fafafa] uppercase tracking-[1.5px]">{dateStr}</p>
                    {ws.supersetId && <Link2 size={11} className="text-[#fd9a00] flex-shrink-0" />}
                  </div>
                  <SetGrid sets={ws.sets} highlightMax />
                </div>
              );
            })}

            {/* Sentinel for intersection observer / lazy loading */}
            {visibleCount < historyDesc.length && (
              <div ref={sentinelRef} className="py-4 flex justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-[#404040] border-t-[#737373] animate-spin" />
              </div>
            )}

            {history.length === 0 && (
              <p className="text-center text-[#737373] text-sm mt-4">No history yet</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="px-4 py-3 pb-8 flex gap-2 flex-shrink-0 backdrop-blur-sm bg-[rgba(23,23,23,0.8)]">
        <button
          onClick={mode === 'history' ? () => setMode('session') : handleAddSet}
          disabled={saved}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-[#404040] bg-[rgba(255,255,255,0.05)] text-[#fafafa] font-medium text-base transition-all active:scale-[0.98]"
        >
          ADD SET <ChevronRight size={16} />
        </button>
        <button
          onClick={handleSave}
          disabled={saved || completedSets.length === 0}
          className={`w-12 h-12 flex items-center justify-center bg-[#f5f5f5] rounded-full flex-shrink-0 transition-all active:scale-[0.98] ${saved || completedSets.length === 0 ? 'opacity-40' : ''}`}
        >
          <Check size={16} className="text-[#0a0a0a]" />
        </button>
      </div>
    </div>
  );
}
