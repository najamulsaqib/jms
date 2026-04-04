import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import { useAuth } from '@contexts/AuthContext';

import logo from '../../../../assets/header-logo.png';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Login failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src={logo}
              alt="JMS Tax Consultancy"
              className="w-20 h-20 object-contain mb-3"
            />
            <h1 className="text-2xl font-bold text-slate-900">JMS Tax</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <TextField
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />

            <TextField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button type="submit" busy={loading} size="lg" className="w-full">
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          JMS Tax Consultancy &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
