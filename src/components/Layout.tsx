import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Dumbbell, LogOut, User, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/push', label: 'Push', icon: Dumbbell },
  { path: '/pull', label: 'Pull', icon: Dumbbell },
  { path: '/legs', label: 'Legs', icon: Dumbbell },
  { path: '/upper', label: 'Upper', icon: Dumbbell },
  { path: '/lower', label: 'Lower', icon: Dumbbell },
];

const DAY_COLORS: Record<string, string> = {
  '/push': 'text-indigo-400',
  '/pull': 'text-violet-400',
  '/legs': 'text-purple-400',
  '/upper': 'text-blue-400',
  '/lower': 'text-cyan-400',
};

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            PPL/UL Tracker
          </h1>
          <p className="text-xs text-gray-500 mt-1">Gym Progress</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            const colorClass = DAY_COLORS[path] || 'text-gray-400';
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} className={active ? colorClass : ''} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <User size={14} />
            </div>
            <span className="text-sm font-medium truncate">{currentUser?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
