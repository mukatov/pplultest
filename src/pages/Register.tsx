import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Check, Loader2, Mail } from 'lucide-react';
import { useT } from '../hooks/useT';

// ─── Password rules ────────────────────────────────────────────────────────────

const RULE_TESTS = [
  { id: 'len',     test: (p: string) => p.length >= 8 },
  { id: 'upper',   test: (p: string) => /[A-Z]/.test(p) },
  { id: 'number',  test: (p: string) => /[0-9]/.test(p) },
  { id: 'special', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function StrengthBar({ password }: { password: string }) {
  const t = useT();
  const passed = RULE_TESTS.filter(r => r.test(password)).length;
  if (!password) return null;
  const colors = ['bg-red-500', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
  const labels = ['', t.weak, t.weak, t.fair, t.strong];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passed ? colors[passed] : 'bg-[#333]'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${passed <= 2 ? 'text-red-400' : passed === 3 ? 'text-yellow-400' : 'text-green-400'}`}>
        {labels[passed]}
      </p>
    </div>
  );
}

function RuleList({ password }: { password: string }) {
  const t = useT();
  const rules = [
    { id: 'len',     label: t.atLeast8Chars, test: (p: string) => p.length >= 8 },
    { id: 'upper',   label: t.oneUppercase,  test: (p: string) => /[A-Z]/.test(p) },
    { id: 'number',  label: t.oneNumber,     test: (p: string) => /[0-9]/.test(p) },
    { id: 'special', label: t.oneSpecial,    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {rules.map(rule => {
        const ok = rule.test(password);
        return (
          <div key={rule.id} className={`flex items-center gap-2 text-xs transition-colors ${ok ? 'text-green-400' : 'text-[#525252]'}`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${ok ? 'bg-green-400/20' : 'bg-[#333]'}`}>
              {ok && <Check size={9} strokeWidth={3} />}
            </div>
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Register() {
  const { register } = useAuthStore();
  const t = useT();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [verified, setVerified] = useState(false);

  const allRulesPassed = RULE_TESTS.every(r => r.test(password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allRulesPassed) {
      setError(t.passwordNotMeetReqs);
      return;
    }
    if (password !== confirm) {
      setError(t.passwordsDoNotMatch);
      return;
    }
    setLoading(true);
    const result = await register(email, password);
    setLoading(false);
    if (result.success && result.needsVerification) {
      setVerified(true);
    } else if (result.success) {
      // Email confirmation disabled — already logged in via onAuthStateChange
    } else {
      setError(result.error ?? 'Registration failed');
    }
  };

  // ── Email sent screen ──
  if (verified) {
    return (
      <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#262626] flex items-center justify-center mx-auto">
            <Mail size={28} className="text-[#fafafa]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-[#fafafa] tracking-tight">{t.checkYourEmail}</h2>
            <p className="text-[#737373] text-sm mt-2">
              {t.weSentConfirmLink}<br />
              <span className="text-[#fafafa] font-medium">{email}</span>
            </p>
          </div>
          <p className="text-xs text-[#525252]">
            {t.checkSpamFolder}
          </p>
          <Link
            to="/login"
            className="block w-full py-3 rounded-full bg-[#262626] border border-[#404040] text-[#fafafa] text-sm font-medium text-center hover:bg-[#2e2e2e] transition-colors"
          >
            {t.backToSignIn}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold tracking-[-1.5px] text-[#fafafa]">PPL/UL</h1>
          <p className="text-[#737373] text-sm mt-2">{t.createYourAccount}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#262626] border border-red-900/60 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">{t.email}</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="mt-1.5 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="mt-1.5 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#737373] transition-colors"
            />
            <StrengthBar password={password} />
            <RuleList password={password} />
          </div>

          <div>
            <label className="text-xs text-[#737373] uppercase tracking-wider font-medium">{t.confirmPassword}</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={t.repeatPasswordPlaceholder}
              className={`mt-1.5 w-full bg-[#262626] border rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none transition-colors ${
                confirm && confirm !== password ? 'border-red-800 focus:border-red-600' : 'border-[#404040] focus:border-[#737373]'
              }`}
            />
            {confirm && confirm !== password && (
              <p className="text-xs text-red-400 mt-1">{t.passwordsDontMatch}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !allRulesPassed || password !== confirm}
            className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {t.createAccount}
          </button>

          <p className="text-center text-sm text-[#737373]">
            {t.alreadyHaveAccount}{' '}
            <Link to="/login" className="text-[#fafafa] hover:text-white transition-colors font-medium">
              {t.signIn}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
