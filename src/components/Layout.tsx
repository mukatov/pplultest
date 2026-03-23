import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Stats', icon: LayoutDashboard },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#171717] text-[#fafafa]">
      <main className="flex-1 overflow-auto pb-16">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#262626] flex items-stretch h-14">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium tracking-wide transition-colors ${
                active ? 'text-[#fafafa]' : 'text-[#525252] hover:text-[#a3a3a3]'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-[#525252] hover:text-[#ef4444] transition-colors"
        >
          <User size={20} />
          <span className="truncate max-w-[56px]">{currentUser?.username}</span>
        </button>
      </nav>
    </div>
  );
}
