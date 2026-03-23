import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';
import { Trophy, TrendingUp, Dumbbell, Calendar, ChevronRight } from 'lucide-react';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { DayType } from '../types';

const DAY_COLORS: Record<DayType, string> = {
  push: '#6366f1',
  pull: '#8b5cf6',
  legs: '#a855f7',
  upper: '#3b82f6',
  lower: '#06b6d4',
};

const DAY_LABELS: Record<DayType, string> = {
  push: 'Push', pull: 'Pull', legs: 'Legs', upper: 'Upper', lower: 'Lower',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { exercises, workoutSets, trainingDays, personalRecords } = useWorkoutStore();
  const { currentUser } = useAuthStore();

  const [selectedExercise, setSelectedExercise] = useState<string>('');

  if (!currentUser) return null;

  // Filter sets for current user
  const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${currentUser.id}:`));
  const userPRs = personalRecords.filter(pr => pr.exerciseId.startsWith(`${currentUser.id}:`));

  // Total sessions
  const totalSessions = userSets.length;

  // Sessions this week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = userSets.filter(ws => new Date(ws.date) > weekAgo).length;

  // Workouts per day type (all time)
  const byDay = trainingDays.map(d => ({
    name: DAY_LABELS[d.type],
    sessions: userSets.filter(ws => ws.dayType === d.type).length,
    color: DAY_COLORS[d.type],
  }));

  // Volume over last 30 days
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dayStr = d.toISOString().split('T')[0];
    const daySets = userSets.filter(ws => ws.date.startsWith(dayStr));
    const volume = daySets.reduce((sum, ws) => sum + ws.sets.reduce((s, set) => s + set.weight * set.reps, 0), 0);
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, volume };
  }).filter(d => d.volume > 0);

  // Exercise progress chart
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {currentUser.username}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: totalSessions, icon: Calendar, color: 'text-indigo-400' },
          { label: 'This Week', value: thisWeek, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Exercises', value: exercises.length, icon: Dumbbell, color: 'text-violet-400' },
          { label: 'Personal Records', value: userPRs.length, icon: Trophy, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Quick navigate */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Training Days</h2>
        <div className="grid grid-cols-5 gap-3">
          {trainingDays.map(d => {
            const count = userSets.filter(ws => ws.dayType === d.type).length;
            return (
              <button
                key={d.type}
                onClick={() => navigate(`/${d.type}`)}
                className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 text-left transition-all group"
                style={{ borderTopColor: DAY_COLORS[d.type] + '40' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: DAY_COLORS[d.type] }}>
                    {d.label}
                  </span>
                  <ChevronRight size={12} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-xl font-bold text-white">{d.exerciseIds.length}</p>
                <p className="text-xs text-gray-600 mt-0.5">exercises</p>
                <p className="text-xs text-gray-500 mt-1">{count} sessions</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions by day */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Sessions by Day Type</h3>
          {byDay.some(d => d.sessions > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDay} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                  itemStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                  {byDay.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              Log workouts to see data
            </div>
          )}
        </div>

        {/* Volume over time */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Volume (last 30 days)</h3>
          {last30.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                  itemStyle={{ color: '#9ca3af' }}
                  formatter={(v: number) => [`${v.toLocaleString()} kg`, 'Volume']}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#818cf8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
              Log workouts to see data
            </div>
          )}
        </div>
      </div>

      {/* Exercise progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-300">Exercise Progress</h3>
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Select exercise...</option>
            {exerciseOptions.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        {progressData.length > 1 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                labelStyle={{ color: '#e5e7eb' }}
                itemStyle={{ color: '#9ca3af' }}
              />
              <Legend wrapperStyle={{ paddingTop: 16 }} />
              <Line type="monotone" dataKey="maxWeight" name="Max Weight (kg)" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="sets" name="Sets" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : selectedExercise ? (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            Need at least 2 sessions to show progress
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
            Select an exercise to view progress
          </div>
        )}
      </div>

      {/* Personal Records */}
      {userPRs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" /> Personal Records
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {userPRs.map(pr => {
              const exerciseId = pr.exerciseId.split(':').slice(1).join(':');
              const exercise = exercises.find(e => e.id === exerciseId);
              if (!exercise) return null;
              return (
                <div key={pr.exerciseId} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <p className="text-xs text-gray-400 truncate">{exercise.name}</p>
                  <p className="text-lg font-bold text-yellow-400 mt-1">{pr.weight}kg</p>
                  <p className="text-xs text-gray-500">{pr.reps} reps · {formatDate(pr.date)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
