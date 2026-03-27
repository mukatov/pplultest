import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Check, Loader2 } from 'lucide-react';

const RULES = [
  { id: 'len',     label: 'At least 8 characters',   test: (p: string) => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter',     test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number',  label: 'One number',               test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character',    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  const allRulesPassed = RULES.every(r => r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesPassed || password !== confirm) return;
    setError('');
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.success) {
      setDone(true);
      setTimeout(() => navigate('/home'), 1500);
    } else {
      setError(result.error ?? 'Password update failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">PPL/UL</h1>
          <p className="text-[#737373] text-sm mt-2">Set a new password</p>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-400/10 border border-green-400/30 flex items-center justify-center mx-auto">
              <Check size={28} className="text-green-400" strokeWidth={2.5} />
            </div>
            <p className="text-[#fafafa] font-semibold">Password updated!</p>
            <p className="text-[#737373] text-sm">Taking you to the app…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#262626] border border-red-900/60 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">New Password</label>
              <input
                autoFocus
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="mt-1.5 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
              />
              {password && (
                <div className="mt-2 space-y-1">
                  {RULES.map(rule => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.id} className={`flex items-center gap-2 text-xs ${ok ? 'text-green-400' : 'text-[#525252]'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-green-400/20' : 'bg-[#333]'}`}>
                          {ok && <Check size={9} strokeWidth={3} />}
                        </div>
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">Confirm New Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                className={`mt-1.5 w-full bg-[#262626] border rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none transition-colors ${
                  confirm && confirm !== password ? 'border-red-800 focus:border-red-600' : 'border-[#404040] focus:border-[#737373]'
                }`}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !allRulesPassed || password !== confirm}
              className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
