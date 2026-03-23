import { useNavigate } from 'react-router-dom';
import { DayType } from '../types';
import { ArrowLeft } from 'lucide-react';

const SESSION_TYPES: { type: DayType; label: string; subtitle: string; color: string; emoji: string }[] = [
  { type: 'push',  label: 'Push',  subtitle: 'Chest · Shoulders · Triceps', color: '#6366f1', emoji: '💪' },
  { type: 'pull',  label: 'Pull',  subtitle: 'Back · Biceps',               color: '#8b5cf6', emoji: '🏋️' },
  { type: 'legs',  label: 'Legs',  subtitle: 'Quads · Hamstrings · Calves', color: '#a855f7', emoji: '🦵' },
  { type: 'upper', label: 'Upper', subtitle: 'Full Upper Body',             color: '#3b82f6', emoji: '🔝' },
  { type: 'lower', label: 'Lower', subtitle: 'Full Lower Body',             color: '#06b6d4', emoji: '⬇️' },
];

interface Props {
  onClose: () => void;
}

export default function StartSessionModal({ onClose }: Props) {
  const navigate = useNavigate();

  const handlePick = (type: DayType) => {
    onClose();
    navigate(`/${type}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col screen-enter">
      {/* Nav bar */}
      <div className="bg-white border-b border-gray-100 px-4 flex items-center gap-3 h-14 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors -ml-1"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900 leading-tight">Start Workout</h1>
          <p className="text-xs text-gray-400">Choose your session type</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {SESSION_TYPES.map(({ type, label, subtitle, color, emoji }) => (
          <button
            key={type}
            onClick={() => handlePick(type)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm active:scale-[0.98] hover:shadow-md hover:border-gray-300 transition-all text-left"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: color + '18' }}
            >
              {emoji}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">{label}</p>
              <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            <div
              className="w-1.5 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
