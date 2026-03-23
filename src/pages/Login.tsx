import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-[3rem] font-semibold leading-[3rem] tracking-[-0.09375rem] text-[#fafafa]">
            PPL/UL
          </p>
          <p className="text-[#a3a3a3] text-sm mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#2a0a0a] border border-[#7f1d1d] rounded-xl px-4 py-3 text-sm text-[#fca5a5]">
              {error}
            </div>
          )}

          <div>
            <label className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">
              Username
            </label>
            <input
              autoFocus
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="mt-2 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#a3a3a3] transition-colors"
            />
          </div>

          <div>
            <label className="text-[0.875rem] font-normal tracking-[0.09375rem] uppercase text-[#a3a3a3]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full bg-[#262626] border border-[#404040] rounded-xl px-4 py-3 text-sm text-[#fafafa] placeholder-[#525252] focus:outline-none focus:border-[#a3a3a3] transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[#f5f5f5] hover:bg-white text-[#0a0a0a] text-sm font-medium transition-colors mt-2"
          >
            Sign In
          </button>

          <p className="text-center text-sm text-[#525252]">
            No account?{' '}
            <Link to="/register" className="text-[#fafafa] hover:text-white transition-colors font-medium">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
