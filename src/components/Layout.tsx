import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#171717] text-[#fafafa]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.16, ease: [0.25, 0.1, 0.25, 1] } }}
          style={{ willChange: 'opacity, transform' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
