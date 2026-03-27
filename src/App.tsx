import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TrainingDay from './pages/TrainingDay';
import Settings from './pages/Settings';
import CreateSplitPage from './pages/CreateSplitPage';
import ProfilePage from './pages/ProfilePage';

function Spinner() {
  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#333] border-t-[#f5f5f5] animate-spin" />
    </div>
  );
}

function AuthGuard() {
  const { currentUser, loading } = useAuthStore();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuthStore();
  if (loading) return <Spinner />;
  if (currentUser) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

// Inner component that has access to useNavigate (must be inside Router)
function AppRoutes() {
  const navigate = useNavigate();
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    // Initialize Supabase session + auth state listener
    const unsub = initialize();

    // Handle password recovery link — redirect to dedicated page
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => {
      unsub();
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Routes>
      <Route path="/login"           element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/register"        element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPassword /></RedirectIfAuthed>} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          <Route path="/home"              element={<Home />} />
          <Route path="/dashboard"         element={<Dashboard />} />
          <Route path="/settings"          element={<Settings />} />
          <Route path="/settings/new-split" element={<CreateSplitPage />} />
          <Route path="/profile"           element={<ProfilePage />} />
          <Route path="/:day"              element={<TrainingDay />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
