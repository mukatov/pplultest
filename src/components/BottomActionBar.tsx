import { Play, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../hooks/useT';

interface Props {
  /** Which page is currently active — determines which slot shows as a pill */
  active: 'home' | 'settings' | 'profile';
  /** Called when the Workout pill is tapped (home only) */
  onWorkout?: () => void;
}

export default function BottomActionBar({ active, onWorkout }: Props) {
  const navigate = useNavigate();
  const t = useT();

  const iconBtn = 'w-10 h-10 flex items-center justify-center bg-[#262626] rounded-full flex-shrink-0 active:scale-95 transition-transform';
  const pillBtn = 'flex items-center gap-2 px-8 py-3 bg-[#f5f5f5] text-[#0a0a0a] rounded-full font-medium text-base flex-shrink-0 active:scale-[0.97] transition-transform';

  return (
    <div className="px-4 pb-8 pt-3 flex-shrink-0 flex items-center justify-center gap-3">
      {/* Settings slot */}
      {active === 'settings' ? (
        <button className={pillBtn}>
          <Settings size={16} />
          {t.settings}
        </button>
      ) : (
        <button onClick={() => navigate('/settings')} className={iconBtn}>
          <Settings size={16} className="text-[#fafafa]" />
        </button>
      )}

      {/* Workout slot */}
      {active === 'home' ? (
        <button onClick={onWorkout} className={pillBtn}>
          <Play size={16} className="fill-[#0a0a0a]" />
          {t.workout}
        </button>
      ) : (
        <button onClick={() => navigate('/home')} className={iconBtn}>
          <Play size={14} className="text-[#fafafa] fill-[#fafafa] ml-0.5" />
        </button>
      )}

      {/* Profile slot */}
      {active === 'profile' ? (
        <button className={pillBtn}>
          <User size={16} />
          {t.profile}
        </button>
      ) : (
        <button onClick={() => navigate('/profile')} className={iconBtn}>
          <User size={16} className="text-[#fafafa]" />
        </button>
      )}
    </div>
  );
}
