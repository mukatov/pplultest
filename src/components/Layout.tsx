import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#171717] text-[#fafafa]" style={{ position: 'relative' }}>
      <AnimatePresence initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: 'easeIn' } }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
