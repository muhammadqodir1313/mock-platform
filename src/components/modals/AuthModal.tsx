import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Loader2, LogOut } from 'lucide-react';
import { AppRoute } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'signup';
  onClose: () => void;
  onNavigateToPlaceholder?: (target: AppRoute) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  onClose,
  onNavigateToPlaceholder,
}) => {
  const { user, profile, signInWithEmail, signUpWithEmail, signOut, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [targetBand, setTargetBand] = useState('7.5');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setLocalError(null);
    setSuccessMessage(null);
    clearAuthError();
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearAuthError();

    // Client-side validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Please provide your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Please enter a valid email format (e.g., candidate@example.com).');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        const candidateName = fullName.trim() || 'Candidate';
        await signUpWithEmail(trimmedEmail, password, candidateName, targetBand);
        setSuccessMessage(`Account created successfully for ${candidateName}! Redirecting to dashboard...`);
      } else {
        await signInWithEmail(trimmedEmail, password);
        setSuccessMessage('Signed in successfully! Redirecting to dashboard...');
      }

      setTimeout(() => {
        onClose();
        if (onNavigateToPlaceholder) {
          onNavigateToPlaceholder('/dashboard');
        }
      }, 900);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication could not be completed.';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1E0F36] rounded-2xl border border-[#E5E1EB] dark:border-[#361F5B] shadow-2xl overflow-hidden z-10 transition-colors">
        {/* Header Strip */}
        <div className="p-6 border-b border-[#E5E1EB] dark:border-[#361F5B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#35145A] dark:bg-[#8E54DC] flex items-center justify-center text-white font-bold text-xs">
              IZ
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-base font-bold text-[#211A2B] dark:text-[#F7F5FA]">
                {user ? 'Candidate Session' : mode === 'login' ? 'Candidate Login' : 'Create Candidate Account'}
              </h3>
              <p className="text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                IELTS ZONE Mock Testing Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#716A7B] dark:text-[#ABA1BC] hover:bg-[#F0EAF8] dark:hover:bg-[#26133E] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user ? (
          /* Already Signed In View */
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-sm">Authenticated Candidate Session</strong>
                <p className="mt-0.5 text-xs">
                  Active session for <strong>{user.email}</strong> via Firebase Authentication.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-[#F7F7FB] dark:bg-[#130922] p-4 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B]">
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Full Name:</span>
                <span className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                  {profile?.displayName || user.displayName || 'Candidate'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Email:</span>
                <span className="font-semibold text-[#211A2B] dark:text-[#F7F5FA]">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Target Band:</span>
                <span className="font-mono font-bold text-[#35145A] dark:text-[#8E54DC]">
                  {profile?.targetBand || '7.5'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716A7B] dark:text-[#ABA1BC]">Role:</span>
                <span className="uppercase text-[11px] font-mono px-2 py-0.5 rounded bg-[#F0EAF8] dark:bg-[#26133E] text-[#35145A] dark:text-[#8E54DC] font-bold">
                  {profile?.role || 'candidate'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onNavigateToPlaceholder) onNavigateToPlaceholder('/dashboard');
                }}
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] rounded-xl transition-colors cursor-pointer"
              >
                Go to Candidate Dashboard →
              </button>
              <button
                type="button"
                onClick={signOut}
                className="py-2.5 px-3 rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          /* Form for Email & Password */
          <>
            {/* Tab switch between Login and Sign Up */}
            <div className="flex border-b border-[#E5E1EB] dark:border-[#361F5B] bg-[#F7F7FB] dark:bg-[#130922]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLocalError(null);
                  setSuccessMessage(null);
                  clearAuthError();
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#1E0F36] text-[#35145A] dark:text-[#8E54DC] border-b-2 border-[#35145A] dark:border-[#8E54DC]'
                    : 'text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setLocalError(null);
                  setSuccessMessage(null);
                  clearAuthError();
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-[#1E0F36] text-[#35145A] dark:text-[#8E54DC] border-b-2 border-[#35145A] dark:border-[#8E54DC]'
                    : 'text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Feedback & Error Notifications */}
              {activeError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{activeError}</p>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{successMessage}</p>
                </div>
              )}

              {/* Email & Password Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#716A7B] dark:text-[#ABA1BC] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Muhammadqodir Abdullajonov"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#716A7B] dark:text-[#ABA1BC] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="candidate@example.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                      Password
                    </label>
                    <span className="text-[11px] text-[#716A7B] dark:text-[#ABA1BC]">Min. 6 chars</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#716A7B] dark:text-[#ABA1BC] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      minLength={6}
                      className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#716A7B] dark:text-[#ABA1BC] hover:text-[#211A2B] cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-[#211A2B] dark:text-[#F7F5FA]">
                      Target Overall Band Score
                    </label>
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E1EB] dark:border-[#361F5B] bg-white dark:bg-[#130922] text-[#211A2B] dark:text-[#F7F5FA] focus:outline-none focus:ring-2 focus:ring-[#35145A] dark:focus:ring-[#8E54DC]"
                    >
                      <option value="6.0">Band 6.0 (Competent)</option>
                      <option value="6.5">Band 6.5 (Upper Intermediate)</option>
                      <option value="7.0">Band 7.0 (Good User)</option>
                      <option value="7.5">Band 7.5 (High Good User)</option>
                      <option value="8.0">Band 8.0 (Very Good User)</option>
                      <option value="8.5">Band 8.5+ (Expert User)</option>
                    </select>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#35145A] hover:bg-[#481B7A] dark:bg-[#8E54DC] dark:hover:bg-[#7C42C4] rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing with Firebase Auth...</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === 'login' ? 'Sign In' : 'Create Candidate Account'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Footer Switcher */}
              <div className="pt-2 text-center text-xs text-[#716A7B] dark:text-[#ABA1BC]">
                {mode === 'login' ? (
                  <span>
                    New candidate?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setLocalError(null);
                        setSuccessMessage(null);
                        clearAuthError();
                      }}
                      className="font-bold text-[#35145A] dark:text-[#8E54DC] hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setLocalError(null);
                        setSuccessMessage(null);
                        clearAuthError();
                      }}
                      className="font-bold text-[#35145A] dark:text-[#8E54DC] hover:underline cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
