import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ForgotPassword() {
  const { resetPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const result = resetPassword(email, password);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Reset failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">PPL/UL</h1>
          <p className="text-[#737373] text-sm mt-2">Reset your password</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="bg-[#262626] border border-green-900 rounded-xl px-4 py-3 text-sm text-green-400">
              Password updated. You can now sign in.
            </div>
            <Link
              to="/login"
              className="block w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors text-center"
            >
              Sign In
            </Link>
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
                placeholder="Your account email"
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
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
