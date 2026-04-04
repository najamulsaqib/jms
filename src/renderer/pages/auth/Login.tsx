import { useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import { useAuth } from '@contexts/AuthContext';

import logo from '../../../../assets/header-logo.png';

type View = 'login' | 'forgot' | 'otp' | 'reset';

export default function LoginPage() {
  const {
    signIn,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    completePasswordReset,
  } = useAuth();

  const [view, setView] = useState<View>('login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot / OTP
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');

  // Reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSignIn = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
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

  const handleSendOtp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await sendPasswordResetOtp(forgotEmail);
      setInfo('A 6-digit code was sent to your email.');
      setView('otp');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send code. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await verifyPasswordResetOtp(forgotEmail, otp.trim());
      setView('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      await completePasswordReset(newPassword);
      setView('login');
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setInfo('Password updated successfully. Please sign in.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to reset password.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    clearMessages();
    try {
      await sendPasswordResetOtp(forgotEmail);
      setInfo('A new code was sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = (to: View) => {
    clearMessages();
    setView(to);
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
              {view === 'login' && 'Sign in to your account'}
              {view === 'forgot' && 'Reset your password'}
              {view === 'otp' && 'Enter verification code'}
              {view === 'reset' && 'Set new password'}
            </p>
          </div>

          {/* ── Login ── */}
          {view === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-5">
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

              <div>
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
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                <div className="mt-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setForgotEmail(email);
                      setView('forgot');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {info && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
                  <p className="text-sm text-green-700">{info}</p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                Sign in
              </Button>
            </form>
          )}

          {/* ── Forgot — enter email ── */}
          {view === 'forgot' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <p className="text-sm text-slate-500">
                Enter your account email and we&apos;ll send you a 6-digit
                verification code.
              </p>

              <TextField
                id="forgot-email"
                label="Email address"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                Send code
              </Button>

              <button
                type="button"
                onClick={() => goBack('login')}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mx-auto"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                Back to sign in
              </button>
            </form>
          )}

          {/* ── OTP — enter code ── */}
          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {info && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                  <p className="text-sm text-blue-700">{info}</p>
                </div>
              )}

              <TextField
                id="otp"
                label="6-digit code"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                required
                placeholder="123456"
                autoComplete="one-time-code"
              />

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                Verify code
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => goBack('forgot')}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* ── Reset — new password ── */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <TextField
                id="new-password"
                label="New password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={
                      showNewPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <TextField
                id="confirm-password"
                label="Confirm new password"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                Set new password
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          JMS Tax Consultancy &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
