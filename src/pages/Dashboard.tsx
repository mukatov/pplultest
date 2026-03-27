import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';
import { Trophy, TrendingUp, Dumbbell, Calendar, ChevronLeft, Download } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { useT } from '../hooks/useT';

const SESSION_COLORS = ['#e5e5e5', '#a3a3a3', '#737373', '#d4d4d4', '#525252', '#b0b0b0', '#909090'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const t = useT();
  const navigate = useNavigate();
  const splits = useWorkoutStore(s => s.splits);
  const activeSplitId = useWorkoutStore(s => s.activeSplitId);
  const { exercises, workoutSets, personalRecords } = useWorkoutStore();
  const trainingDays = splits.find(s => s.id === activeSplitId)?.days ?? [];
  const { currentUser } = useAuthStore();

  const [selectedExercise, setSelectedExercise] = useState<string>('');

  const handleExport = () => {
    const rows: string[][] = [['Date', 'Day', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'Volume (kg)']];
    const sorted = [...userSets].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const ws of sorted) {
      const exerciseId = ws.exerciseId.split(':').slice(1).join(':');
      const exercise = exercises.find(e => e.id === exerciseId);
      const day = trainingDays.find(d => d.type === ws.dayType);
      const date = new Date(ws.date).toLocaleDateString('en-GB');
      ws.sets.forEach((s, i) => {
        rows.push([
          date,
          day?.label ?? ws.dayType,
          exercise?.name ?? exerciseId,
          String(i + 1),
          String(s.weight),
          String(s.reps),
          String(s.weight * s.reps),
        ]);
      });
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser) return null;

  const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${currentUser.id}:`));
  const userPRs = personalRecords.filter(pr => pr.exerciseId.startsWith(`${currentUser.id}:`));

  const totalSessions = userSets.length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = userSets.filter(ws => new Date(ws.date) > weekAgo).length;

  const byDay = trainingDays.map((d, i) => ({
    name: d.label,
    sessions: userSets.filter(ws => ws.dayType === d.type).length,
    color: SESSION_COLORS[i % SESSION_COLORS.length],
  }));

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dayStr = d.toISOString().split('T')[0];
    const daySets = userSets.filter(ws => ws.date.startsWith(dayStr));
    const volume = daySets.reduce((sum, ws) => sum + ws.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, volume };
  }).filter(d => d.volume > 0);

  const exerciseOptions = exercises.filter(e =>
    userSets.some(ws => ws.exerciseId === `${currentUser.id}:${e.id}`)
  );

  const progressData = selectedExercise
    ? userSets
        .filter(ws => ws.exerciseId === `${currentUser.id}:${selectedExercise}`)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(ws => ({
          date: formatDate(ws.date),
          maxWeight: Math.max(...ws.sets.map(s => s.weight)),
          totalVolume: ws.sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
          sets: ws.sets.length,
        }))
    : [];

  const tooltipStyle = {
    contentStyle: { background: '#262626', border: '1px solid #404040', borderRadius: 8 },
    labelStyle: { color: '#fafafa' },
    itemStyle: { color: '#a3a3a3' },
  };

  return (
    <div className="min-h-screen bg-[#171717]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-6">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">
          {t.stats}
        </h1>
        <button
          onClick={handleExport}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
          title={t.exportToCsv}
        >
          <Download size={16} className="text-[#fafafa]" />
        </button>
      </div>

      <div className="px-4 pb-12 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t.totalSessions, value: totalSessions, icon: Calendar },
            { label: t.thisWeek, value: thisWeek, icon: TrendingUp },
            { label: t.exercisesLabel, value: exercises.length, icon: Dumbbell },
            { label: t.personalRecords, value: userPRs.length, icon: Trophy },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#262626] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#737373] uppercase tracking-wider">{label}</p>
                <Icon size={16} className="text-[#737373]" />
              </div>
              <p className="text-2xl font-bold text-[#fafafa]">{value}</p>
            </div>
          ))}
        </div>

        {/* Quick navigate */}
        <div>
          <h2 className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-3">{t.trainingDaysLabel}</h2>
          <div className="grid grid-cols-5 gap-2">
            {trainingDays.map(d => {
              const count = userSets.filter(ws => ws.dayType === d.type).length;
              return (
                <button
                  key={d.type}
                  onClick={() => navigate(`/${d.type}`)}
                  className="bg-[#262626] rounded-xl p-3 text-center transition-all active:scale-95 hover:bg-[#2e2e2e]"
                >
                  <p className="text-xs font-semibold text-[#fafafa] uppercase">{d.label}</p>
                  <p className="text-lg font-bold text-[#fafafa] mt-1">{d.exerciseIds.length}</p>
                  <p className="text-xs text-[#737373]">{count}x</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <div className="bg-[#262626] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#fafafa] mb-4">{t.sessionsByDayType}</h3>
            {byDay.some(d => d.sessions > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byDay} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                    {byDay.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-[#737373] text-sm">
                {t.logWorkoutsToSeeData}
              </div>
            )}
          </div>

          <div className="bg-[#262626] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#fafafa] mb-4">{t.volumeLast30Days}</h3>
            {last30.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={last30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volume']}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="#e5e5e5"
                    strokeWidth={2}
                    dot={{ fill: '#e5e5e5', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: '#fafafa' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-[#737373] text-sm">
                {t.logWorkoutsToSeeData}
              </div>
            )}
          </div>
        </div>

        {/* Exercise progress */}
        <div className="bg-[#262626] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#fafafa]">{t.exerciseProgress}</h3>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="bg-[#171717] border border-[#404040] rounded-lg px-3 py-1.5 text-sm text-[#fafafa] focus:outline-none focus:border-[#737373] transition-colors"
            >
              <option value="">{t.selectExercise}</option>
              {exerciseOptions.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {progressData.length > 1 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="date" tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: 16, color: '#a3a3a3' }} />
                <Line type="monotone" dataKey="maxWeight" name={`${t.maxWeight} (kg)`} stroke="#e5e5e5" strokeWidth={2} dot={{ fill: '#e5e5e5', r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="sets" name={t.sets} stroke="#737373" strokeWidth={2} dot={{ fill: '#737373', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : selectedExercise ? (
            <div className="h-48 flex items-center justify-center text-[#737373] text-sm">
              {t.need2Sessions}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#737373] text-sm">
              {t.selectExerciseToView}
            </div>
          )}
        </div>

        {/* Personal Records */}
        {userPRs.length > 0 && (
          <div className="bg-[#262626] rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#fafafa] mb-4 flex items-center gap-2">
              <Trophy size={14} className="text-yellow-400" /> {t.personalRecords}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {userPRs.map(pr => {
                const exerciseId = pr.exerciseId.split(':').slice(1).join(':');
                const exercise = exercises.find(e => e.id === exerciseId);
                if (!exercise) return null;
                return (
                  <div key={pr.exerciseId} className="bg-[#171717] rounded-xl p-3 border border-[#404040]">
                    <p className="text-xs text-[#737373] truncate">{exercise.name}</p>
                    <p className="text-lg font-bold text-yellow-400 mt-1">{pr.weight}kg</p>
                    <p className="text-xs text-[#525252]">{pr.reps} reps · {formatDate(pr.date)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
