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
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#262626] flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <p className="flex-1 text-center text-[3rem] font-semibold leading-[3rem] tracking-[-0.09375rem] text-[#fafafa]">
          PPL/UL
        </p>
        <div className="w-10 h-10 flex-shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {SESSION_TYPES.map(({ type, label, subtitle }) => (
          <button
            key={type}
            onClick={() => handlePick(type)}
            className="w-full flex items-center justify-center py-8 rounded-full bg-[#262626] border border-[#404040] active:scale-[0.98] hover:bg-[#2a2a2a] transition-all"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-[1.875rem] font-semibold tracking-[-0.0625rem] text-[#fafafa]">{label}</span>
              <span className="text-xs text-[#a3a3a3]">{subtitle}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
