import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuthStore();
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await sendPasswordReset(email);
    setLoading(false);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error ?? 'Could not send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">PPL/UL</h1>
          <p className="text-[#737373] text-sm mt-2">Reset your password</p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center mx-auto">
              <Mail size={28} className="text-[#fafafa]" />
            </div>
            <div>
              <p className="text-[#fafafa] font-semibold">Check your email</p>
              <p className="text-[#737373] text-sm mt-1">
                We sent a password reset link to<br />
                <span className="text-[#fafafa] font-medium">{email}</span>
              </p>
            </div>
            <p className="text-xs text-[#525252]">
              Click the link in the email to set a new password. The link expires in 1 hour.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 rounded-full bg-[#262626] border border-[#404040] text-[#fafafa] text-sm font-medium text-center hover:bg-[#2e2e2e] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#262626] border border-red-900/60 rounded-xl px-4 py-3 text-sm text-red-400">
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

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Send Reset Link
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
