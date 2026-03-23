import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex items-stretch h-14">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${
                active ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          );
        })}

        {/* Profile / logout tab */}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium text-gray-500 hover:text-red-400 transition-colors"
        >
          <User size={20} />
          <span className="truncate max-w-[56px]">{currentUser?.username}</span>
        </button>
      </nav>
    </div>
  );
}
