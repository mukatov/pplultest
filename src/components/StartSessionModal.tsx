import { useNavigate } from 'react-router-dom';
import { DayType } from '../types';
import { ChevronLeft } from 'lucide-react';

const SESSION_TYPES: { type: DayType; label: string; subtitle: string }[] = [
  { type: 'push',  label: 'PUSH',  subtitle: 'Chest · Shoulders · Triceps' },
  { type: 'pull',  label: 'PULL',  subtitle: 'Back · Biceps' },
  { type: 'legs',  label: 'LEGS',  subtitle: 'Quads · Hamstrings · Calves' },
  { type: 'upper', label: 'UPPER', subtitle: 'Full Upper Body' },
  { type: 'lower', label: 'LOWER', subtitle: 'Full Lower Body' },
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
    <div className="fixed inset-0 z-50 bg-[#171717] flex flex-col screen-enter">
      {/* Nav bar */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <div>
          <h1 className="text-base font-bold text-[#fafafa] leading-tight uppercase">Start Workout</h1>
          <p className="text-xs text-[#737373]">Choose your session type</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {SESSION_TYPES.map(({ type, label, subtitle }) => (
          <button
            key={type}
            onClick={() => handlePick(type)}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#262626] border border-[#404040] active:scale-[0.98] hover:border-[#737373] transition-all text-left"
          >
            <div className="flex-1">
              <p className="text-lg font-bold text-[#fafafa]">{label}</p>
              <p className="text-sm text-[#737373] mt-0.5">{subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
