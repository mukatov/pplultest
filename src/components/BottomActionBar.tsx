import { Play, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { useT } from '../hooks/useT';

interface Props {
  active: 'home' | 'settings' | 'profile';
  onWorkout?: () => void;
}

const SPRING = { type: 'spring', stiffness: 400, damping: 32, mass: 0.8 } as const;

// Progressive blur layers — each covers a vertical slice with increasing blur.
// Overlapping ranges ensure a smooth ramp from 0 → max blur.
const BLUR_LAYERS = [
  { blur: '2px',  from: '0%',   to: '30%'  },
  { blur: '6px',  from: '15%',  to: '55%'  },
  { blur: '12px', from: '35%',  to: '75%'  },
  { blur: '20px', from: '55%',  to: '88%'  },
  { blur: '28px', from: '72%',  to: '100%' },
];

export default function BottomActionBar({ active, onWorkout }: Props) {
  const navigate = useNavigate();
  const t = useT();

  const iconBase = 'relative w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 z-10';
  const pillBase = 'relative flex items-center gap-2 px-8 py-3 rounded-full font-medium text-base flex-shrink-0 z-10';

  return (
    <LayoutGroup>
      {/* Outer container — tall enough to show the blur ramp above the buttons */}
      <div className="fixed bottom-0 left-0 right-0 h-36 z-40 pointer-events-none">

        {/* Progressive blur layers */}
        {BLUR_LAYERS.map(({ blur, from, to }, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${blur})`,
              WebkitBackdropFilter: `blur(${blur})`,
              maskImage: `linear-gradient(to bottom, transparent ${from}, black ${to})`,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${from}, black ${to})`,
            }}
          />
        ))}

        {/* Solid fade-in at the very bottom so buttons stay readable */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 40%, rgba(23,23,23,0.85) 100%)',
          }}
        />

        {/* Buttons row — restore pointer events here only */}
        <div className="absolute bottom-0 left-0 right-0 pb-8 pt-3 flex items-center justify-center gap-3 pointer-events-auto">

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
    </LayoutGroup>
  );
}
