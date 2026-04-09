import { Play, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { useT } from '../hooks/useT';

interface Props {
  active: 'home' | 'settings' | 'profile';
  onWorkout?: () => void;
}

const SPRING = { type: 'spring', stiffness: 400, damping: 32, mass: 0.8 } as const;

export default function BottomActionBar({ active, onWorkout }: Props) {
  const navigate = useNavigate();
  const t = useT();

  const iconBase = 'relative w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 z-10';
  const pillBase = 'relative flex items-center gap-2 px-8 py-3 rounded-full font-medium text-base flex-shrink-0 z-10';

  return (
    <LayoutGroup>
      {/*
        Wrapper: full-width fixed zone.
        - Top portion: pure gradient fade (transparent → nav bg) — provides
          the "progressive" visual ramp even over flat backgrounds.
        - Bottom portion: backdrop-blur + semi-transparent bg — frosted glass
          effect that works over any scrolled content.
      */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        {/* Gradient fade zone above the bar (progressive blur illusion) */}
        <div
          className="h-20 w-full"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(23,23,23,0.6) 60%, rgba(23,23,23,0.92) 100%)',
          }}
        />

        {/* Frosted-glass bar */}
        <div
          className="w-full"
          style={{
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'rgba(23,23,23,0.75)',
          }}
        >
          {/* Buttons row */}
          <div className="pb-8 pt-3 flex items-center justify-center gap-3 pointer-events-auto">

            {/* Settings slot */}
            {active === 'settings' ? (
              <button className={`${pillBase} text-[#0a0a0a]`}>
                <motion.div layoutId="pill-bg" className="absolute inset-0 bg-[#f5f5f5] rounded-full" transition={SPRING} />
                <Settings size={16} className="relative z-10" />
                <span className="relative z-10">{t.settings}</span>
              </button>
            ) : (
              <button onClick={() => navigate('/settings')} className={`${iconBase} active:scale-90 transition-transform duration-150`}>
                <motion.div className="absolute inset-0 bg-[#262626] rounded-full" />
                <Settings size={16} className="relative z-10 text-[#fafafa]" />
              </button>
            )}

            {/* Workout slot */}
            {active === 'home' ? (
              <button onClick={onWorkout} className={`${pillBase} text-[#0a0a0a]`}>
                <motion.div layoutId="pill-bg" className="absolute inset-0 bg-[#f5f5f5] rounded-full" transition={SPRING} />
                <Play size={16} className="relative z-10 fill-[#0a0a0a]" />
                <span className="relative z-10">{t.workout}</span>
              </button>
            ) : (
              <button onClick={() => navigate('/home')} className={`${iconBase} active:scale-90 transition-transform duration-150`}>
                <motion.div className="absolute inset-0 bg-[#262626] rounded-full" />
                <Play size={14} className="relative z-10 text-[#fafafa] fill-[#fafafa] ml-0.5" />
              </button>
            )}

            {/* Profile slot */}
            {active === 'profile' ? (
              <button className={`${pillBase} text-[#0a0a0a]`}>
                <motion.div layoutId="pill-bg" className="absolute inset-0 bg-[#f5f5f5] rounded-full" transition={SPRING} />
                <User size={16} className="relative z-10" />
                <span className="relative z-10">{t.profile}</span>
              </button>
            ) : (
              <button onClick={() => navigate('/profile')} className={`${iconBase} active:scale-90 transition-transform duration-150`}>
                <motion.div className="absolute inset-0 bg-[#262626] rounded-full" />
                <User size={16} className="relative z-10 text-[#fafafa]" />
              </button>
            )}

          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
