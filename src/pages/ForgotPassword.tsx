import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const result = resetPassword(email, password);
    if (result.success) {
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.error || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/login')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg mb-8"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>

        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">PPL/UL</h1>
          <p className="text-[#737373] text-sm mt-2">Reset your password</p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle size={40} className="text-[#fafafa]" />
            <p className="text-[#fafafa] font-medium">Password updated!</p>
            <p className="text-[#737373] text-sm">Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#262626] border border-red-900 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">Email</label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1.5 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="mt-1.5 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                className="mt-1.5 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors mt-2"
            >
              Reset Password
            </button>

            <p className="text-center text-sm text-[#737373]">
              <Link to="/login" className="text-[#fafafa] hover:text-white transition-colors font-medium">
                Back to login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
