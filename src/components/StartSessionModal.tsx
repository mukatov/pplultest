import { useNavigate } from 'react-router-dom';
import { DayType } from '../types';
import { X } from 'lucide-react';

const SESSION_TYPES: { type: DayType; label: string; subtitle: string; color: string; emoji: string }[] = [
  { type: 'push', label: 'Push',  subtitle: 'Chest · Shoulders · Triceps', color: '#6366f1', emoji: '💪' },
  { type: 'pull', label: 'Pull',  subtitle: 'Back · Biceps',               color: '#8b5cf6', emoji: '🏋️' },
  { type: 'legs', label: 'Legs',  subtitle: 'Quads · Hamstrings · Calves', color: '#a855f7', emoji: '🦵' },
  { type: 'upper', label: 'Upper', subtitle: 'Full Upper Body',            color: '#3b82f6', emoji: '🔝' },
  { type: 'lower', label: 'Lower', subtitle: 'Full Lower Body',            color: '#06b6d4', emoji: '⬇️' },
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-t-3xl border-t border-gray-200 shadow-2xl pb-safe">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choose Session Type</h2>
            <p className="text-sm text-gray-400 mt-0.5">What are you training today?</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        <div className="px-4 pb-8 space-y-2">
          {SESSION_TYPES.map(({ type, label, subtitle, color, emoji }) => (
            <button
              key={type}
              onClick={() => handlePick(type)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm active:scale-[0.98] transition-all text-left"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: color + '15' }}
              >
                {emoji}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{label}</div>
                <div className="text-sm text-gray-400">{subtitle}</div>
              </div>
              <div
                className="w-2 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
